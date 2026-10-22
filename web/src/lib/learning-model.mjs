/** Pure, dependency-free model operations shared by the UI and Node tests. */
export function allLessons(course) {
  return course.chapters.flatMap((chapter) => chapter.lessons);
}

export function sourceCoverage(article, sourceDocuments) {
  if (article.provenance.kind !== 'source' || !article.provenance.sourceDocumentId) {
    return { linked: false, reason: 'demo-or-unlinked' };
  }
  return sourceDocuments.some((doc) => doc.id === article.provenance.sourceDocumentId)
    ? { linked: true, reason: 'source-found' }
    : { linked: false, reason: 'source-missing' };
}

export function findDuplicatesById(records) {
  const seen = new Set();
  const duplicates = [];
  for (const record of records) {
    if (seen.has(record.id)) duplicates.push(record.id);
    seen.add(record.id);
  }
  return duplicates;
}

export function discoverLessons(courses, keyword) {
  const query = String(keyword).trim().toLocaleLowerCase();
  return courses.flatMap(course => allLessons(course)
    .filter(lesson => !query || `${course.title} ${lesson.title}`.toLocaleLowerCase().includes(query))
    .map(lesson => ({...lesson, courseTitle: course.title, courseSlug: course.slug}))
  );
}
