import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// An MDX content file: where it is, its frontmatter, and its MDX body.
export interface MdxFile {
  filePath: string;
  data: Record<string, unknown>;
  content: string;
}

// A content file with bad frontmatter. The message names the file and the problem.
export class ContentError extends Error {
  readonly filePath: string;
  readonly problem: string;

  constructor(filePath: string, problem: string) {
    super(`${path.relative(process.cwd(), filePath)}: ${problem}`);
    this.name = 'ContentError';
    this.filePath = filePath;
    this.problem = problem;
  }
}

export function readMdxFile(filePath: string): MdxFile {
  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
  return { filePath, data, content };
}

export function requiredString(file: MdxFile, field: string): string {
  const value = file.data[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ContentError(file.filePath, `"${field}" is required and must be text`);
  }
  return value;
}

export function optionalString(file: MdxFile, field: string): string | undefined {
  const value = file.data[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ContentError(file.filePath, `"${field}" must be text`);
  }
  return value;
}

// A missing list is an empty list.
export function optionalStringList(file: MdxFile, field: string): string[] {
  const value = file.data[field];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string' && v.trim() !== '')) {
    throw new ContentError(file.filePath, `"${field}" must be a list of text values`);
  }
  return value;
}

// A calendar date in the form YYYY-MM-DD, as midnight UTC. YAML reads an unquoted
// date as a Date already, so both forms are accepted.
export function requiredDate(file: MdxFile, field: string): Date {
  const value = file.data[field];
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    // A day that does not exist (such as February 30) rolls over into the next month.
    if (!Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)) return date;
  }
  throw new ContentError(
    file.filePath,
    `"${field}" is required and must be a date in the form YYYY-MM-DD`,
  );
}

// A missing value is false.
export function optionalBoolean(file: MdxFile, field: string): boolean {
  const value = file.data[field];
  if (value === undefined || value === null) return false;
  if (typeof value !== 'boolean') {
    throw new ContentError(file.filePath, `"${field}" must be true or false`);
  }
  return value;
}
