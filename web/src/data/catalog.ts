import dataset from "./catalog.json";

export type LessonStatus = "planned" | "sample" | "published";
export type Lesson = {
  id: string;
  title: string;
  status: LessonStatus;
  articleSlug?: string;
};
export type Chapter = { id: string; title: string; lessons: Lesson[] };
export type Course = {
  id: string; subjectId: string; slug: string; title: string;
  subtitle: string; label: string; accent: string; chapters: Chapter[];
};
export type Article = {
  id: string; slug: string; courseId: string; lessonId: string;
  title: string; summary: string; readingMinutes: number; status: LessonStatus;
  provenance: {
    kind: "demo" | "source";
    sourceDocumentId: string | null;
    pages: number[];
    message: string;
  };
  knowledgePointIds: string[];
  sections: { id: string; title: string }[];
};
export type KnowledgePoint = {
  id: string; courseId: string; chapterId: string; label: string;
};

// The fixture stays intentionally explicit: V1 contains no actual source documents,
// quizzes, generated publications, or measured mastery.
export const catalog = dataset;
export const courses = dataset.courses as Course[];
export const articles = dataset.articles as Article[];
export const knowledgePoints = dataset.knowledgePoints as KnowledgePoint[];
export const findCourse = (slug: string) => courses.find((course) => course.slug === slug);
export const findArticle = (slug: string) => articles.find((article) => article.slug === slug);
export const countLessons = (course: Course) => course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
