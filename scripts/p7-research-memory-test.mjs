import assert from 'node:assert/strict';
import { researchMemoryService } from '../src/server/services/research-memory.service.ts';

console.log('🧪 Starting P7 Research Memory Contract Test...\n');

const userId = 'TEST-USER-1';
const projectId = 'PROJ-001';

const projectState = researchMemoryService.getOrCreateProjectState(userId, projectId, 'تێزی دکتۆرا', 'زمانەوانی');
assert.equal(projectState.title, 'تێزی دکتۆرا');

const item1 = researchMemoryService.addMemoryItem(userId, projectId, {
  userId,
  topic: 'سۆرانی',
  type: 'claim',
  content: 'سۆرانی بەشێکە لە زمانی کوردی.',
  tags: ['grammar', 'sorani']
});

assert.ok(item1.id.startsWith('MEM-'));
assert.equal(projectState.claimsCount, 1);

const updatedState = researchMemoryService.getProjectMemory(userId, projectId);
assert.equal(updatedState.memoryItems.length, 1);

console.log('✅ P7 Research Memory Contract Test PASSED SUCCESSFULLY!');
