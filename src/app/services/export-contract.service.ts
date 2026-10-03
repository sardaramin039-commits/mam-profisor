import { Injectable } from '@angular/core';

export interface ExportContract {
  version: '1.0';
  approved: boolean;
  fingerprint: string;
  identityVerifiedSourceCount: number;
  citationEligibleSourceCount: number;
  createdAt: string;
}

export interface ExportGateResponse {
  qa?: {
    exportBlocked?: boolean;
    kurdishSummaryStatus?: string;
    exportContract?: ExportContract;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExportContractService {
  assertApproved(response: ExportGateResponse): ExportContract {
    const gate = response?.qa;
    const contract = gate?.exportContract;

    if (!gate || gate.exportBlocked === true || contract?.approved !== true) {
      throw new Error(
        gate?.kurdishSummaryStatus ||
        'Export بەهۆی پشکنینی بەڵگە و verification ـەوە بلۆک کرا.'
      );
    }

    if (contract.citationEligibleSourceCount === 0) {
      throw new Error(
        'هیچ citation ـێکی کۆتایی نابێت بێ identity verification و evidence verification هەردووکیان Export بکرێت.'
      );
    }

    return contract;
  }
}
