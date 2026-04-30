import { describe, it, expect } from 'vitest';
import path from 'path';
import { getAllSeries, getSeries, getLesson } from '@/lib/content';

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
