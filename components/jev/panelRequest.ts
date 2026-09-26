import type { DecisionsRequest } from '@/lib/jev/types';

export type StateMode = 'text' | 'json';

type Questions = DecisionsRequest['questions'];
type Question = Questions[string];

export interface ChoiceLabelDraft {
  id: string;
  label: string;
  description: string;
}

export interface ScoreLevelDraft {
  id: string;
  text: string;
}

// One question as the User edits it. The id stays the same when the User
// renames the question.
export type QuestionDraft = {
  id: string;
  name: string;
  instructions: string;
} & (
  | { type: 'noul'; whenTrue: string; whenFalse: string }
  | { type: 'choice'; labels: ChoiceLabelDraft[] }
  | { type: 'score'; levels: ScoreLevelDraft[] }
);

export interface PanelSettings {
  model: string;
  stateMode: StateMode;
  state: string;
  questions: QuestionDraft[];
}

let lastId = 0;
export function newId(): string {
  lastId += 1;
  return `d${lastId}`;
}

// A new, empty question of one type.
export function emptyQuestion(type: QuestionDraft['type']): QuestionDraft {
  const base = { id: newId(), name: '', instructions: '' };
  if (type === 'noul') return { ...base, type, whenTrue: '', whenFalse: '' };
  if (type === 'choice') return { ...base, type, labels: [] };
  return { ...base, type, levels: [] };
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

// Turns questions in the API shape into drafts that the builder can edit.
export function draftsFrom(questions: Questions): QuestionDraft[] {
  return Object.entries(questions).map(([name, q]) => {
    const base = { id: newId(), name, instructions: text(q.instructions) };
    if (q.type === 'noul')
      return {
        ...base,
        type: 'noul',
        whenTrue: text(q.criteria?.true),
        whenFalse: text(q.criteria?.false),
      };
    if (q.type === 'choice')
      return {
        ...base,
        type: 'choice',
        labels: Object.entries(q.criteria).map(([label, description]) => ({
          id: newId(),
          label,
          description: text(description),
        })),
      };
    return {
      ...base,
      type: 'score',
      levels: q.criteria.map((level) => ({ id: newId(), text: text(level) })),
    };
  });
}

export interface QuestionErrors {
  name?: string;
  instructions?: string;
  criteria?: string;
  // Errors on one choice label or one score level, keyed by its id.
  items?: Record<string, string>;
}

function filled(value: string): boolean {
  return value.trim() !== '';
}

function buildQuestion(
  draft: QuestionDraft
): { question: Question } | { errors: QuestionErrors } {
  const errors: QuestionErrors = {};
  const instructions = draft.instructions;
  if (!filled(draft.name)) errors.name = 'Give the question a name.';
  if (!filled(instructions))
    errors.instructions = 'Give the question instructions.';
  let question: Question;
  if (draft.type === 'noul') {
    const hasTrue = filled(draft.whenTrue);
    const hasFalse = filled(draft.whenFalse);
    // A half-filled pair blocks the Run. It is not dropped without a word.
    if (hasTrue !== hasFalse)
      errors.criteria = 'Fill in both true and false, or leave both empty.';
    question =
      hasTrue && hasFalse
        ? {
            type: 'noul',
            instructions,
            criteria: { true: draft.whenTrue, false: draft.whenFalse },
          }
        : { type: 'noul', instructions };
  } else if (draft.type === 'choice') {
    if (draft.labels.length === 0) errors.criteria = 'Add at least one label.';
    const items: Record<string, string> = {};
    const seen = new Set<string>();
    const criteria: Record<string, string | null> = {};
    for (const l of draft.labels) {
      const label = l.label.trim();
      if (!label) items[l.id] = 'Give the label a name.';
      else if (seen.has(label))
        items[l.id] =
          `Two labels are "${label}". Give each label its own name.`;
      seen.add(label);
      // The API takes null for a label with no description.
      criteria[label] = filled(l.description) ? l.description : null;
    }
    if (Object.keys(items).length > 0) errors.items = items;
    question = { type: 'choice', instructions, criteria };
  } else {
    if (draft.levels.length === 0) errors.criteria = 'Add at least one level.';
    const items: Record<string, string> = {};
    for (const l of draft.levels)
      if (!filled(l.text)) items[l.id] = 'Fill in the level or remove it.';
    if (Object.keys(items).length > 0) errors.items = items;
    question = {
      type: 'score',
      instructions,
      criteria: draft.levels.map((l) => l.text.trim()),
    };
  }
  return Object.keys(errors).length > 0 ? { errors } : { question };
}

export interface PanelErrors {
  model?: string;
  state?: string;
  // A problem with the list as a whole, such as no questions.
  list?: string;
  // Keyed by the id of the question draft.
  questions?: Record<string, QuestionErrors>;
}

export type BuiltRequest =
  | { ok: true; request: DecisionsRequest }
  | { ok: false; errors: PanelErrors };

function buildState(
  mode: StateMode,
  text: string
): { value: DecisionsRequest['state'] } | { error: string } {
  const empty = { error: 'Give a state to decide on.' };
  if (text.trim() === '') return empty;
  if (mode === 'text') return { value: text };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      error:
        'The state is not valid JSON. Check the brackets, quotes, and commas.',
    };
  }
  if (typeof value !== 'object' || value === null)
    return {
      error: 'In JSON mode, the state must be a JSON object or an array.',
    };
  if (Object.keys(value).length === 0) return empty;
  return { value: value as DecisionsRequest['state'] };
}

// Turns the panel settings into the Decisions request for a Run, or into the
// errors that block the Run.
export function buildRequest(settings: PanelSettings): BuiltRequest {
  const errors: PanelErrors = {};
  const model = settings.model.trim();
  if (!model) errors.model = 'Give a model.';
  const state = buildState(settings.stateMode, settings.state);
  if ('error' in state) errors.state = state.error;

  const questions: Questions = {};
  const questionErrors: Record<string, QuestionErrors> = {};
  const nameCount = new Map<string, number>();
  for (const draft of settings.questions) {
    const name = draft.name.trim();
    nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
  }
  for (const draft of settings.questions) {
    const name = draft.name.trim();
    const built = buildQuestion(draft);
    const qErrors = 'errors' in built ? built.errors : {};
    if (name && (nameCount.get(name) ?? 0) > 1)
      qErrors.name = `Two questions have the name "${name}". Give each question its own name.`;
    if (Object.keys(qErrors).length > 0) questionErrors[draft.id] = qErrors;
    else if ('question' in built) questions[name] = built.question;
  }
  if (Object.keys(questionErrors).length > 0) errors.questions = questionErrors;
  if (settings.questions.length === 0)
    errors.list = 'Add at least one question.';

  if ('error' in state || Object.keys(errors).length > 0)
    return { ok: false, errors };
  return {
    ok: true,
    request: { model, state: state.value, questions },
  };
}
