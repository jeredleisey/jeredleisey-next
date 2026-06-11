import { describe, it, expect } from 'vitest';
import path from 'path';
import { getAllSeries, getSeries, getLesson, getAllProjects, getProject, getAllEssays, getEssay, getAllDialogues, getDialogue } from '@/lib/content';

const FIXTURES = path.join(__dirname, '../fixtures/content');

describe('getAllSeries', () => {
  it('returns all series with metadata and lessons', () => {
    const series = getAllSeries(FIXTURES);
    expect(series).toHaveLength(1);
    expect(series[0].slug).toBe('test-series');
    expect(series[0].metadata.title).toBe('Test Series');
    expect(series[0].metadata.level).toBe(101);
    expect(series[0].metadata.status).toBe('active');
    expect(series[0].lessons).toHaveLength(2);
  });

  it('strips order prefix from lesson slugs', () => {
    const series = getAllSeries(FIXTURES);
    expect(series[0].lessons[0].slug).toBe('first-lesson');
    expect(series[0].lessons[1].slug).toBe('second-lesson');
  });

  it('returns lessons in order', () => {
    const series = getAllSeries(FIXTURES);
    expect(series[0].lessons[0].metadata.title).toBe('First Lesson');
    expect(series[0].lessons[1].metadata.title).toBe('Second Lesson');
  });
});

describe('getSeries', () => {
  it('returns a single series by slug', () => {
    const series = getSeries('test-series', FIXTURES);
    expect(series).not.toBeNull();
    expect(series!.metadata.title).toBe('Test Series');
  });

  it('returns null for unknown slug', () => {
    expect(getSeries('does-not-exist', FIXTURES)).toBeNull();
  });
});

describe('getLesson', () => {
  it('returns lesson content and metadata', () => {
    const lesson = getLesson('test-series', 'first-lesson', FIXTURES);
    expect(lesson).not.toBeNull();
    expect(lesson!.metadata.title).toBe('First Lesson');
    expect(lesson!.content).toContain('First lesson content.');
  });

  it('returns null prev for first lesson', () => {
    const lesson = getLesson('test-series', 'first-lesson', FIXTURES);
    expect(lesson!.prev).toBeNull();
    expect(lesson!.next).toEqual({ slug: 'second-lesson', title: 'Second Lesson' });
  });

  it('returns null next for last lesson', () => {
    const lesson = getLesson('test-series', 'second-lesson', FIXTURES);
    expect(lesson!.next).toBeNull();
    expect(lesson!.prev).toEqual({ slug: 'first-lesson', title: 'First Lesson' });
  });

  it('includes series title and total lesson count', () => {
    const lesson = getLesson('test-series', 'first-lesson', FIXTURES);
    expect(lesson!.seriesTitle).toBe('Test Series');
    expect(lesson!.totalLessons).toBe(2);
  });

  it('returns null for unknown lesson', () => {
    expect(getLesson('test-series', 'no-such-lesson', FIXTURES)).toBeNull();
  });
});

describe('getAllProjects', () => {
  it('returns all projects sorted by date descending', () => {
    const projects = getAllProjects(FIXTURES);
    expect(projects).toHaveLength(1);
    expect(projects[0].slug).toBe('test-project');
    expect(projects[0].metadata.title).toBe('Test Project');
  });
});

describe('getProject', () => {
  it('returns project content and metadata', () => {
    const project = getProject('test-project', FIXTURES);
    expect(project).not.toBeNull();
    expect(project!.metadata.title).toBe('Test Project');
    expect(project!.content).toContain('Project content here.');
  });

  it('resolves lesson refs with title and level', () => {
    const project = getProject('test-project', FIXTURES);
    expect(project!.lessonRefs).toHaveLength(2);
    expect(project!.lessonRefs[0]).toMatchObject({
      seriesSlug: 'test-series',
      lessonSlug: 'first-lesson',
      lessonTitle: 'First Lesson',
      level: 101,
      href: '/learn/test-series/first-lesson',
    });
  });

  it('returns null for unknown slug', () => {
    expect(getProject('no-such-project', FIXTURES)).toBeNull();
  });
});

describe('getAllEssays', () => {
  it('returns essays sorted by date descending', () => {
    const essays = getAllEssays(FIXTURES);
    expect(essays).toHaveLength(1);
    expect(essays[0].slug).toBe('test-essay');
  });
});

describe('getEssay', () => {
  it('returns essay content and metadata', () => {
    const essay = getEssay('test-essay', FIXTURES);
    expect(essay).not.toBeNull();
    expect(essay!.metadata.title).toBe('Test Essay');
    expect(essay!.content).toContain('Essay content here.');
  });

  it('returns null for unknown slug', () => {
    expect(getEssay('no-such-essay', FIXTURES)).toBeNull();
  });
});

describe('getAllDialogues', () => {
  it('returns dialogues sorted by date descending', () => {
    const dialogues = getAllDialogues(FIXTURES);
    expect(dialogues).toHaveLength(2);
    expect(dialogues[0].slug).toBe('test-dialogue');
    expect(dialogues[1].slug).toBe('older-dialogue');
  });

  it('exposes the model on each summary', () => {
    const dialogues = getAllDialogues(FIXTURES);
    expect(dialogues[0].metadata.model).toBe('Fable 5');
  });
});

describe('getDialogue', () => {
  it('returns content and metadata', () => {
    const dialogue = getDialogue('test-dialogue', FIXTURES);
    expect(dialogue).not.toBeNull();
    expect(dialogue!.metadata.title).toBe('Test Dialogue');
    expect(dialogue!.metadata.summary).toContain('test conversation');
    expect(dialogue!.content).toContain('<Turn who="Jered">');
  });

  it('loads a bare dialogue with no annotations', () => {
    const dialogue = getDialogue('older-dialogue', FIXTURES);
    expect(dialogue).not.toBeNull();
    expect(dialogue!.content).toContain('<Turn who="Jered">');
    expect(dialogue!.content).not.toContain('<Note>');
  });

  it('returns null for unknown slug', () => {
    expect(getDialogue('no-such-dialogue', FIXTURES)).toBeNull();
  });
});
