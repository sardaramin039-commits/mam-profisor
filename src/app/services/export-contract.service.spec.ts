import { describe, expect, it } from 'vitest';
import { ExportContractService, ExportGateResponse } from './export-contract.service';

describe('ExportContractService', () => {
  it('rejects blocked or unapproved export contracts', () => {
    const service = new ExportContractService();
    const response: ExportGateResponse = {
      qa: {
        exportBlocked: true,
        kurdishSummaryStatus: 'بەڵگە پێویستە.',
        exportContract: {
          version: '1.0',
          approved: false,
          fingerprint: 'x',
          identityVerifiedSourceCount: 1,
          citationEligibleSourceCount: 0,
          createdAt: new Date().toISOString()
        }
      }
    };

    expect(() => service.assertApproved(response)).toThrow('بەڵگە پێویستە.');
  });

  it('accepts an approved contract with at least one eligible source', () => {
    const service = new ExportContractService();
    const contract = {
      version: '1.0' as const,
      approved: true,
      fingerprint: 'abc',
      identityVerifiedSourceCount: 2,
      citationEligibleSourceCount: 1,
      createdAt: new Date().toISOString()
    };

    expect(service.assertApproved({
      qa: { exportBlocked: false, exportContract: contract }
    })).toEqual(contract);
  });
});
