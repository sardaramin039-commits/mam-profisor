import assert from 'node:assert/strict';
import { researchProjectStateService } from '../src/server/services/research-project-state.service.ts';

console.log('🧪 Starting P8 Research Workspace Contract Test...\n');

const userId = 'USER-88';
const workspaceId = 'WS-001';

const ws = researchProjectStateService.getOrCreateWorkspace(userId, workspaceId, 'پڕۆژەی ئەکادیمی');
assert.equal(ws.workspaceId, workspaceId);

const updated = await researchProjectStateService.updateWorkspaceContent(userId, workspaceId, 'دەقی نوێی بەشی یەکەم', 'بەشی یەکەم');
assert.equal(updated.draftContent, 'دەقی نوێی بەشی یەکەم');
assert.equal(updated.activeChapter, 'بەشی یەکەم');

console.log('✅ P8 Research Workspace Contract Test PASSED SUCCESSFULLY!');
