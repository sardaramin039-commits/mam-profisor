import { test, expect } from '@playwright/test';

const workspaceId = 'WS-E2E';
const submissionId = 'SUB-E2E';
const versionId = 'VER-E2E';

const submission = {
  id: submissionId,
  journalName: 'Journal of Kurdish Studies',
  manuscriptType: 'article',
  currentStatus: 'REVISION_REQUESTED',
  currentVersionId: versionId,
  versionCount: 1,
  updatedAt: '2026-10-08T00:00:00.000Z'
};

const policy = {
  journalName: submission.journalName,
  manuscriptType: submission.manuscriptType
};

function seedHistory(page: import('@playwright/test').Page): Promise<void> {
  return page.addInitScript(({ workspaceId: id }) => {
    localStorage.setItem('local_manuscripts_backup', JSON.stringify([{
      id,
      userId: 'USER-E2E',
      title: 'E2E Research Workspace',
      discipline: 'humanities',
      academicLevel: 'doctorate',
      pages: 10,
      chapters: [{
        title: 'Chapter 1',
        content: 'Academic test content for browser workflow verification.',
        wordCount: 8,
        academicNotes: ''
      }],
      createdAt: { seconds: 1_790_000_000, nanoseconds: 0 }
    }]));
  }, { workspaceId });
}

async function mockWorkflowApis(
  page: import('@playwright/test').Page,
  revisionReady = false
): Promise<{ decision: Record<string, unknown> | null; resubmission: Record<string, unknown> | null }> {
  let decision: Record<string, unknown> | null = null;
  let resubmission: Record<string, unknown> | null = null;

  await page.route('**/api/publication-submission-lifecycle/WS-E2E', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ submissions: [submission] }) });
      return;
    }
    await route.continue();
  });
  await page.route('**/api/publication-submission-editorial/WS-E2E/SUB-E2E/decisions', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decisions: [] }) });
  });
  await page.route('**/api/publication-submission-editorial/WS-E2E/SUB-E2E/revision', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          id: 'RVP-E2E',
          submissionVersionId: versionId,
          severity: 'MINOR',
          status: 'OPEN',
          tasks: [{
            id: 'RVT-E2E',
            order: 1,
            title: 'Clarify methodology',
            details: 'Add sampling and analysis details.',
            scope: 'SECTION',
            required: true,
            status: 'OPEN'
          }]
        },
        gate: {
          ready: revisionReady,
          reason: revisionReady ? undefined : 'Required revision tasks are not complete.',
          pendingRequiredTasks: revisionReady ? [] : []
        }
      })
    });
  });
  await page.route('**/api/publication-submission-editorial/WS-E2E/SUB-E2E/versions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        versions: {
          status: 'VERIFIED',
          versionCount: 1,
          latestCycle: 1,
          latestFingerprint: 'a'.repeat(64),
          errors: []
        },
        items: [{
          id: versionId,
          submissionId,
          cycle: 1,
          kind: 'READY',
          statusAtCapture: 'READY',
          packageFingerprint: 'a'.repeat(64),
          note: 'Initial ready package.',
          capturedAt: '2026-10-08T00:00:00.000Z',
          immutableHash: 'b'.repeat(64)
        }]
      })
    });
  });
  await page.route('**/api/publication-submission-manifest/WS-E2E', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        manifests: [{
          id: 'MAN-E2E',
          versionId,
          policy,
          journalName: policy.journalName,
          manuscriptType: policy.manuscriptType,
          policyFingerprint: 'policy-hash',
          referenceCount: 0
        }]
      })
    });
  });
  await page.route('**/api/publication-submission-lifecycle/WS-E2E/SUB-E2E/resubmit', async route => {
    resubmission = await route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        submission: {
          ...submission,
          currentStatus: 'RESUBMITTED',
          currentVersionId: 'VER-E2E-2',
          versionCount: 2
        }
      })
    });
  });

  await page.route('**/api/publication-submission-editorial/WS-E2E/SUB-E2E/decision', async route => {
    decision = await route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        decision: {
          id: 'DEC-E2E',
          decisionType: decision?.['decisionType'],
          resultingStatus: 'REVISION_REQUESTED',
          submissionVersionId: versionId,
          note: decision?.['note'] || ''
        },
        submission
      })
    });
  });

  return {
    get decision() { return decision; },
    get resubmission() { return resubmission; }
  };
}

test.describe('Mam Professor browser E2E', () => {
  test('opens the scholarly workspace from the splash screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /توێژینەوەکەت/ })).toBeVisible();
    await page.getByRole('button', { name: 'دەستپێکردنی پڕۆژە' }).click();
    await expect(page.getByRole('heading', { name: 'ناوەندی نووسینی زانستی' })).toBeVisible();
  });

  test('completes the editorial decision interaction in the browser', async ({ page }) => {
    await seedHistory(page);
    const state = await mockWorkflowApis(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'دەستپێکردنی پڕۆژە' }).click();

    const publicationDetails = page.locator('details').filter({ hasText: 'publication و پێداچوونەوە' });
    await publicationDetails.locator('summary').click();
    await expect(page.getByRole('heading', { name: 'تۆمارکردنی بڕیاری editorial' })).toBeVisible();

    const decisionLabel = page.locator('label').filter({ hasText: 'جۆری بڕیار' });
    await decisionLabel.locator('select').selectOption('MAJOR_REVISION');

    const note = page.locator('label').filter({ hasText: 'تێبینی editorial' }).locator('textarea');
    await note.fill('Please revise the methodology and clarify the sampling procedure.');

    const taskTitle = page.locator('label').filter({ hasText: 'ناونیشانی task' }).locator('input');
    await taskTitle.fill('Clarify methodology');
    const taskDetails = page.locator('label').filter({ hasText: 'وردەکاری و داواکاری' }).locator('textarea');
    await taskDetails.fill('Add sampling and analysis details.');
    await page.getByRole('button', { name: 'زیادکردنی task' }).click();

    await page.getByRole('button', { name: 'تۆمارکردنی بڕیار' }).click();
    await expect.poll(() => state.decision).not.toBeNull();
    expect(state.decision?.['decisionType']).toBe('MAJOR_REVISION');
    expect(state.decision?.['note']).toContain('methodology');
    expect(Array.isArray(state.decision?.['tasks'])).toBe(true);
    expect((state.decision?.['tasks'] as Array<Record<string, unknown>>)[0]?.['required']).toBe(true);
  });

  test('completes a policy-locked resubmission when the revision gate is ready', async ({ page }) => {
    await seedHistory(page);
    const state = await mockWorkflowApis(page, true);
    await page.goto('/');
    await page.getByRole('button', { name: 'دەستپێکردنی پڕۆژە' }).click();

    const publicationDetails = page.locator('details').filter({ hasText: 'publication و پێداچوونەوە' });
    await publicationDetails.locator('summary').click();
    await expect(page.getByRole('heading', { name: 'Resubmission ـی Version ـی نوێ' })).toBeVisible();

    const title = page.locator('label').filter({ hasText: 'ناونیشانی manuscript' }).locator('input');
    await title.fill('Revised E2E Research');
    const abstract = page.locator('label').filter({ hasText: 'پوختە' }).locator('textarea');
    await abstract.fill('This is a revised abstract for the browser E2E workflow.');

    await page.getByRole('button', { name: 'ناردنی Version ـی نوێ' }).click();
    await expect.poll(() => state.resubmission).not.toBeNull();
    expect(state.resubmission?.['policy']).toEqual(policy);
    expect(state.resubmission?.['title']).toBe('Revised E2E Research');
    expect(state.resubmission?.['abstract']).toContain('revised abstract');
  });

  test('keeps protected publication APIs inaccessible without Firebase authentication', async ({ request, baseURL }) => {
    const response = await request.get(
      `${baseURL}/api/publication-submission-editorial/WS-E2E/SUB-E2E/decisions`
    );
    expect(response.status()).toBe(401);
  });
});
