'use client';

import {
  emptyQuestion,
  newId,
  type ChoiceLabelDraft,
  type ScoreLevelDraft,
  type QuestionDraft,
  type QuestionErrors,
} from './panelRequest';

export const fieldLabel =
  'block text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-2';
export const box = 'border border-my-stone/40 dark:border-my-stone/20';
export const input = `${box} w-full bg-transparent p-3 text-sm font-light text-my-espresso dark:text-my-cream focus:outline-none focus:border-my-orange`;

export const smallButton =
  'text-xs uppercase tracking-widest text-my-walnut dark:text-my-stone hover:text-my-orange disabled:opacity-40 disabled:hover:text-my-walnut transition-colors';

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-xs text-my-orange">
      {message}
    </p>
  );
}

// Props that link an input to the error shown next to it.
export function errorProps(id: string, message?: string) {
  return message ? { 'aria-invalid': true, 'aria-describedby': id } : {};
}

export function QuestionBuilder({
  questions,
  errors = {},
  listError,
  onChange,
}: {
  questions: QuestionDraft[];
  errors?: Record<string, QuestionErrors>;
  listError?: string;
  onChange: (questions: QuestionDraft[]) => void;
}) {
  function update(id: string, patch: Partial<QuestionDraft>) {
    onChange(
      questions.map((q) =>
        q.id === id ? ({ ...q, ...patch } as QuestionDraft) : q
      )
    );
  }

  return (
    <div>
      <span className={fieldLabel}>Questions</span>
      <FieldError id="jev-questions-error" message={listError} />
      <ol className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const e = errors[q.id] ?? {};
          return (
            <li key={q.id}>
              <fieldset
                aria-label={`Question ${i + 1}`}
                className={`${box} p-3`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest">
                    Question {i + 1}
                    <span className="ml-2 text-my-orange">{q.type}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(questions.filter((x) => x.id !== q.id))
                    }
                    className={`${smallButton} shrink-0`}
                  >
                    Remove question
                  </button>
                </div>
                <label htmlFor={`${q.id}-name`} className={fieldLabel}>
                  Name
                </label>
                <input
                  id={`${q.id}-name`}
                  value={q.name}
                  onChange={(ev) => update(q.id, { name: ev.target.value })}
                  className={`${input} font-mono`}
                  {...errorProps(`${q.id}-name-error`, e.name)}
                />
                <FieldError id={`${q.id}-name-error`} message={e.name} />
                <label
                  htmlFor={`${q.id}-instructions`}
                  className={`${fieldLabel} mt-3`}
                >
                  Instructions
                </label>
                <textarea
                  id={`${q.id}-instructions`}
                  value={q.instructions}
                  onChange={(ev) =>
                    update(q.id, { instructions: ev.target.value })
                  }
                  rows={2}
                  className={input}
                  {...errorProps(`${q.id}-instructions-error`, e.instructions)}
                />
                <FieldError
                  id={`${q.id}-instructions-error`}
                  message={e.instructions}
                />
                {q.type === 'noul' && (
                  <div className="grid gap-3 sm:grid-cols-2 mt-3">
                    <div>
                      <label htmlFor={`${q.id}-true`} className={fieldLabel}>
                        True criteria
                      </label>
                      <input
                        id={`${q.id}-true`}
                        value={q.whenTrue}
                        placeholder="Optional"
                        onChange={(ev) =>
                          update(q.id, { whenTrue: ev.target.value })
                        }
                        className={input}
                        {...errorProps(`${q.id}-criteria-error`, e.criteria)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${q.id}-false`} className={fieldLabel}>
                        False criteria
                      </label>
                      <input
                        id={`${q.id}-false`}
                        value={q.whenFalse}
                        placeholder="Optional"
                        onChange={(ev) =>
                          update(q.id, { whenFalse: ev.target.value })
                        }
                        className={input}
                        {...errorProps(`${q.id}-criteria-error`, e.criteria)}
                      />
                    </div>
                  </div>
                )}
                {q.type === 'choice' && (
                  <ChoiceLabels
                    question={q}
                    errors={e.items ?? {}}
                    onChange={(labels) => update(q.id, { labels })}
                  />
                )}
                {q.type === 'score' && (
                  <ScoreLevels
                    question={q}
                    errors={e.items ?? {}}
                    onChange={(levels) => update(q.id, { levels })}
                  />
                )}
                <FieldError
                  id={`${q.id}-criteria-error`}
                  message={e.criteria}
                />
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-3 mt-3">
        {(['noul', 'choice', 'score'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange([...questions, emptyQuestion(type)])}
            className={`${box} px-4 py-2 text-xs uppercase tracking-widest text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange transition-colors`}
          >
            Add {type} question
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceLabels({
  question,
  errors,
  onChange,
}: {
  question: QuestionDraft & { type: 'choice' };
  errors: Record<string, string>;
  onChange: (labels: ChoiceLabelDraft[]) => void;
}) {
  const labels = question.labels;
  function update(id: string, patch: Partial<ChoiceLabelDraft>) {
    onChange(labels.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  return (
    <div className="mt-3">
      <span className={fieldLabel}>Labels</span>
      <ol className="flex flex-col gap-3">
        {labels.map((l, i) => {
          const n = i + 1;
          const errorId = `${l.id}-error`;
          return (
            <li
              key={l.id}
              className="border-l border-my-stone/40 dark:border-my-stone/20 pl-3"
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div>
                  <label htmlFor={`${l.id}-label`} className="sr-only">
                    Label {n}
                  </label>
                  <input
                    id={`${l.id}-label`}
                    value={l.label}
                    placeholder="Label"
                    onChange={(ev) => update(l.id, { label: ev.target.value })}
                    className={`${input} font-mono`}
                    {...errorProps(errorId, errors[l.id])}
                  />
                </div>
                <div>
                  <label htmlFor={`${l.id}-description`} className="sr-only">
                    Description {n}
                  </label>
                  <input
                    id={`${l.id}-description`}
                    value={l.description}
                    placeholder="Description (optional)"
                    onChange={(ev) =>
                      update(l.id, { description: ev.target.value })
                    }
                    className={input}
                  />
                </div>
              </div>
              <FieldError id={errorId} message={errors[l.id]} />
              <button
                type="button"
                onClick={() => onChange(labels.filter((x) => x.id !== l.id))}
                aria-label={`Remove label ${n}`}
                className={`${smallButton} mt-2`}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() =>
          onChange([...labels, { id: newId(), label: '', description: '' }])
        }
        className={`${smallButton} mt-3`}
      >
        Add label
      </button>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ScoreLevels({
  question,
  errors,
  onChange,
}: {
  question: QuestionDraft & { type: 'score' };
  errors: Record<string, string>;
  onChange: (levels: ScoreLevelDraft[]) => void;
}) {
  const levels = question.levels;
  return (
    <div className="mt-3">
      <span className={fieldLabel}>Scale, lowest first</span>
      <ol className="flex flex-col gap-3">
        {levels.map((l, i) => {
          const n = i + 1;
          const errorId = `${l.id}-error`;
          return (
            <li
              key={l.id}
              className="border-l border-my-stone/40 dark:border-my-stone/20 pl-3"
            >
              <label htmlFor={`${l.id}-text`} className="sr-only">
                Level {n}
              </label>
              <input
                id={`${l.id}-text`}
                value={l.text}
                placeholder={`Level ${n}`}
                onChange={(ev) =>
                  onChange(
                    levels.map((x) =>
                      x.id === l.id ? { ...x, text: ev.target.value } : x
                    )
                  )
                }
                className={input}
                {...errorProps(errorId, errors[l.id])}
              />
              <FieldError id={errorId} message={errors[l.id]} />
              <div className="flex flex-wrap gap-4 mt-2">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => onChange(move(levels, i, i - 1))}
                  aria-label={`Move level ${n} up`}
                  className={smallButton}
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={i === levels.length - 1}
                  onClick={() => onChange(move(levels, i, i + 1))}
                  aria-label={`Move level ${n} down`}
                  className={smallButton}
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => onChange(levels.filter((x) => x.id !== l.id))}
                  aria-label={`Remove level ${n}`}
                  className={smallButton}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...levels, { id: newId(), text: '' }])}
        className={`${smallButton} mt-3`}
      >
        Add level
      </button>
    </div>
  );
}
