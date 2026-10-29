import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { SourceVerificationService, VerifiedAcademicSource } from './source-verification.service';

const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => Array.from(storageMap.keys())[index] || null
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

import { TestBed } from '@angular/core/testing';
import { AcademicStoreService } from './academic-store.service';
import { Data } from './data';

describe('SourceVerificationService', () => {
  let service: SourceVerificationService;

  beforeEach(() => {
    storageMap.clear();
    service = new SourceVerificationService();
  });

  describe('DOI Normalization & Validation', () => {
    it('cleans and normalizes full DOI URLs and prefixes', () => {
      expect(service.cleanDoi('https://doi.org/10.1000/182')).toBe('10.1000/182');
      expect(service.cleanDoi('http://dx.doi.org/10.1038/nature12373')).toBe('10.1038/nature12373');
      expect(service.cleanDoi('doi:10.1145/3377325')).toBe('10.1145/3377325');
    });

    it('validates genuine DOI syntax correctly', () => {
      expect(service.isValidDoiFormat('10.1000/182')).toBe(true);
      expect(service.isValidDoiFormat('10.1038/nature12373')).toBe(true);
      expect(service.isValidDoiFormat('https://doi.org/10.1145/3377325')).toBe(true);
      
      // Invalid DOIs
      expect(service.isValidDoiFormat('invalid-doi')).toBe(false);
      expect(service.isValidDoiFormat('99.1234/test')).toBe(false);
      expect(service.isValidDoiFormat('')).toBe(false);
    });
  });

  describe('Citation Eligibility & Verification Gating', () => {
    it('REJECTS unverified sources with explicit failure reason', () => {
      const unverifiedSource: VerifiedAcademicSource = {
        id: 'src_fake',
        title: 'کتێبی خەیاڵی',
        authors: ['نووسەری ساختە'],
        year: 2026,
        venue: 'چاپخانەی نەزانراو',
        url: '',
        provider: 'manual',
        retrievalTime: new Date().toISOString(),
        status: 'FAILED',
        userApproved: false,
        failureReason: 'سەرچاوەکە لە داتابەیسی Crossref و OpenAlex نەدۆزرایەوە.'
      };

      const check = service.isEligibleForCitation(unverifiedSource);
      expect(check.eligible).toBe(false);
      expect(check.reason).toContain('Crossref');
    });

    it('REJECTS verified sources if user has not yet approved them', () => {
      const verifiedUnapproved: VerifiedAcademicSource = {
        id: 'src_10_1000_182',
        title: 'The Digital Object Identifier System',
        authors: ['Norman Paskin'],
        year: 2010,
        venue: 'D-Lib Magazine',
        doi: '10.1000/182',
        url: 'https://doi.org/10.1000/182',
        provider: 'crossref',
        retrievalTime: new Date().toISOString(),
        status: 'VERIFIED',
        userApproved: false // Not yet approved by user
      };

      const check = service.isEligibleForCitation(verifiedUnapproved);
      expect(check.eligible).toBe(false);
      expect(check.reason).toContain('پەسەند');
    });

    it('ACCEPTS sources ONLY when VERIFIED and userApproved are true', () => {
      const approvedSource: VerifiedAcademicSource = {
        id: 'src_approved',
        title: 'Grammatical Structure of Kurdish',
        authors: ['Ernest N. McCarus'],
        year: 1958,
        venue: 'American Council of Learned Societies',
        doi: '10.2307/123456',
        url: 'https://doi.org/10.2307/123456',
        provider: 'crossref',
        retrievalTime: new Date().toISOString(),
        status: 'VERIFIED',
        userApproved: true
      };

      const check = service.isEligibleForCitation(approvedSource);
      expect(check.eligible).toBe(true);
      expect(check.source).toBeDefined();
    });
  });

  describe('Export Gating & Audit Check', () => {
    it('blocks export when unverified sources are cited in chapter text', () => {
      const unverified: VerifiedAcademicSource = {
        id: 'src_fake',
        title: 'لێکۆڵینەوەیەکی خەیاڵی',
        authors: ['فەرهاد حەسەن'],
        year: 2024,
        venue: 'نادیار',
        url: '',
        provider: 'manual',
        retrievalTime: new Date().toISOString(),
        status: 'FAILED',
        userApproved: false
      };
      service.addOrUpdateSource(unverified);

      const chapters = [
        {
          title: 'بەشی یەکەم',
          content: 'وەک فەرهاد حەسەن ئاماژەی پێداوە، زمانی سۆرانی پێشکەوتووە.'
        }
      ];

      const validation = service.validateForExport(chapters);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('فەرهاد حەسەن');
    });

    it('passes export check when all cited sources are VERIFIED and approved', () => {
      const validSource: VerifiedAcademicSource = {
        id: 'src_valid_1',
        title: 'Kurdish Grammar in Context',
        authors: ['David N. MacKenzie'],
        year: 1961,
        venue: 'Oxford University Press',
        doi: '10.1093/oxford/12345',
        url: 'https://doi.org/10.1093/oxford/12345',
        provider: 'crossref',
        retrievalTime: new Date().toISOString(),
        status: 'VERIFIED',
        userApproved: true
      };
      service.addOrUpdateSource(validSource);

      const chapters = [
        {
          title: 'بەشی یەکەم',
          content: 'بەپێی توێژینەوەی (MacKenzie، 1961) ڕێزمانی کوردی خاوەن تایبەتمەندییە.'
        }
      ];

      const validation = service.validateForExport(chapters);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('Citation Formatting without Invention', () => {
    it('formats inline citation using only genuine author and year, without inventing pages', () => {
      const source: VerifiedAcademicSource = {
        id: 's1',
        title: 'Modern Kurdish Literature',
        authors: ['Hashem Ahmadzadeh'],
        year: 2003,
        venue: 'Uppsala University',
        url: 'https://doi.org/10.1000/test',
        provider: 'openalex',
        retrievalTime: new Date().toISOString(),
        status: 'VERIFIED',
        userApproved: true
      };

      const inline = service.formatCitation(source, 'inline');
      expect(inline).toBe('(Ahmadzadeh، 2003)');
      expect(inline).not.toContain('٤٥'); // Did NOT invent page 45!
    });

    it('includes page number only when genuine page number is explicitly provided', () => {
      const sourceWithPage: VerifiedAcademicSource = {
        id: 's2',
        title: 'Modern Kurdish Literature',
        authors: ['Hashem Ahmadzadeh'],
        year: 2003,
        pageNumber: '112',
        venue: 'Uppsala University',
        url: 'https://doi.org/10.1000/test',
        provider: 'openalex',
        retrievalTime: new Date().toISOString(),
        status: 'VERIFIED',
        userApproved: true
      };

      const inline = service.formatCitation(sourceWithPage, 'inline');
      expect(inline).toBe('(Ahmadzadeh، 2003: 112)');
    });
  });
});
