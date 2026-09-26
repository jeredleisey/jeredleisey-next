import type { DecisionsRequest } from './types';

type Questions = DecisionsRequest['questions'];

export type Validation =
  | { ok: true; request: DecisionsRequest }
  | { ok: false; message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFilled(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return false;
}

function questionError(name: string, q: unknown): string | null {
  if (!isObject(q)) return `Question "${name}" is not an object.`;
  if (!isFilled(q.instructions))
    return `Question "${name}" needs instructions.`;
  switch (q.type) {
    case 'noul':
      return null;
    case 'choice':
      return isObject(q.criteria) && isFilled(q.criteria)
        ? null
        : `Choice question "${name}" needs at least one label.`;
    case 'score':
      return Array.isArray(q.criteria) && q.criteria.length > 0
        ? null
        : `Score question "${name}" needs at least one level.`;
    default:
      return `Question "${name}" has an unknown type. Use noul, choice, or score.`;
  }
}

// Checks a Run request before it costs money. Only model, state, and
// questions pass through, so a caller cannot set other API options.
export function validateRunInput(input: unknown): Validation {
  if (!isObject(input))
    return { ok: false, message: 'The request must be a JSON object.' };
  const { model, state, questions } = input;
  if (typeof model !== 'string' || model.trim() === '') {
    return { ok: false, message: 'Give a model.' };
  }
  if (!isFilled(state))
    return { ok: false, message: 'Give a state to decide on.' };
  if (!isObject(questions) || Object.keys(questions).length === 0) {
    return { ok: false, message: 'Give at least one question.' };
  }
  for (const [name, q] of Object.entries(questions)) {
    const error = questionError(name, q);
    if (error) return { ok: false, message: error };
  }
  return {
    ok: true,
    request: {
      model: model.trim(),
      state: state as DecisionsRequest['state'],
      questions: questions as Questions,
    },
  };
}
