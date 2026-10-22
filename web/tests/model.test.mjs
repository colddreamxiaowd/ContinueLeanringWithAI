import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allLessons, discoverLessons, findDuplicatesById, sourceCoverage } from '../src/lib/learning-model.mjs';

const catalog = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url)));

test('all course and lesson IDs are unique', () => {
  assert.deepEqual(findDuplicatesById(catalog.courses), []);
  const lessons = catalog.courses.flatMap(allLessons);
  assert.deepEqual(findDuplicatesById(lessons), []);
  assert.deepEqual(findDuplicatesById(catalog.articles), []);
  assert.deepEqual(findDuplicatesById(catalog.knowledgePoints), []);
});

test('articles always point to a known lesson and knowledge points', () => {
  for (const article of catalog.articles) {
    const course = catalog.courses.find(c => c.id === article.courseId);
    assert.ok(course, 'course referenced by article exists');
    assert.ok(allLessons(course).some(l => l.id === article.lessonId));
    for (const id of article.knowledgePointIds) assert.ok(catalog.knowledgePoints.some(k => k.id === id));
  }
});

test('a sample article is never represented as linked to original material', () => {
  assert.equal(catalog.sourceDocuments.length, 0);
  assert.equal(catalog.publishedContent.length, 0);
  for (const article of catalog.articles) assert.deepEqual(sourceCoverage(article, catalog.sourceDocuments), { linked: false, reason: 'demo-or-unlinked' });
});

test('case-insensitive search returns a real course lesson', () => {
  const matches = discoverLessons(catalog.courses, '循环队列');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].articleSlug, 'circular-queue');
  assert.equal(discoverLessons(catalog.courses, 'never-exists').length, 0);
});

test('a source article whose source is unavailable cannot claim source linkage', () => {
  const a = {...catalog.articles[0], provenance: {kind:'source', sourceDocumentId:'missing'}};
  assert.deepEqual(sourceCoverage(a, []), {linked:false,reason:'source-missing'});
});
