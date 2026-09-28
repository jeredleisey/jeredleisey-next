'use client';

import { useState } from 'react';
import {
  DEFAULT_MODEL,
  SAMPLE_QUESTIONS,
  SAMPLE_STATE,
} from '@/lib/jev/samples';
import type { DecisionsRequest, RunResult } from '@/lib/jev/types';
import { RunResults } from './RunResults';
import { buildRequest, draftsFrom, type StateMode } from './panelRequest';
import {
  FieldError,
  QuestionBuilder,
  box,
  errorProps,
  fieldLabel as label,
  input,
} from './QuestionBuilder';

export type SendRun = (request: DecisionsRequest) => Promise<RunResult>;

// Posts a Run to the server. The OpenRouter key never leaves the server.
export const sendToRunRoute: SendRun = async (request) => {
  const res = await fetch('/api/projects/jev/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  try {
    return (await res.json()) as RunResult;
  } catch {
    return {
      ok: false,
      error: {
        kind: 'upstream',
        message: `The server answered with status ${res.status}. Try again.`,
      },
    };
  }
};

function runsLeftText(n: number) {
  return `${n} ${n === 1 ? 'Run' : 'Runs'} left. Each Run counts for 24 hours.`;
}

export function OptionsPanel({
  send = sendToRunRoute,
  runsLeft: initialRunsLeft,
}: {
  send?: SendRun;
  // Runs left in the last 24 hours. null: no limit (the Admin). undefined: not shown.
  runsLeft?: number | null;
}) {
  const [runsLeft, setRunsLeft] = useState(initialRunsLeft);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [state, setState] = useState(SAMPLE_STATE);
  const [stateMode, setStateMode] = useState<StateMode>('text');
  const [questions, setQuestions] = useState(() =>
    draftsFrom(SAMPLE_QUESTIONS)
  );
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  // Errors show after the first refused Run, and then follow each edit.
  const [checked, setChecked] = useState(false);

  const built = buildRequest({
    model,
    stateMode,
    state,
    questions,
  });
  const errors = checked && !built.ok ? built.errors : {};

  async function onRun() {
    if (pending) return;
    if (!built.ok) {
      setChecked(true);
      return;
    }
    setPending(true);
    try {
      const next = await send(built.request);
      setResult(next);
      if (next.ok || next.error.kind === 'upstream') {
        // The call reached OpenRouter, so it counts.
        setRunsLeft((n) => (typeof n === 'number' ? Math.max(0, n - 1) : n));
      } else if (next.error.kind === 'limit-reached') {
        setRunsLeft((n) => (typeof n === 'number' ? 0 : n));
      }
    } catch {
      setResult({
        ok: false,
        error: {
          kind: 'upstream',
          message:
            'The Run could not reach the server. Check your connection and try again.',
        },
      });
    } finally {
      setPending(false);
    }
  }

  // Wide screens: the Model and Run row and the options on the left, the results on the
  // right, in view while the options scroll. Narrow screens: the row, the results, then
  // the options, so a User scrolls down only to change the options (#94).
  return (
    <div className="grid gap-pad-2 lg:grid-cols-2 lg:items-start">
      <div className="lg:col-start-1 lg:row-start-1">
        <label htmlFor="jev-model" className={label}>
          Model
        </label>
        <div className="flex items-stretch gap-3">
          <input
            id="jev-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            spellCheck={false}
            className={`${input} font-mono min-w-0 flex-1`}
            {...errorProps('jev-model-error', errors.model)}
          />
          <button
            type="button"
            onClick={onRun}
            disabled={pending}
            className={`${box} shrink-0 px-6 text-sm uppercase tracking-widest text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange disabled:opacity-50 disabled:hover:border-my-stone/40 disabled:hover:text-my-espresso transition-colors`}
          >
            {pending ? 'Running…' : 'Run'}
          </button>
        </div>
        <FieldError id="jev-model-error" message={errors.model} />
        {runsLeft !== undefined && (
          <p className="mt-3 text-xs text-my-walnut dark:text-my-stone">
            {runsLeft === null ? 'No Run limit on your account.' : runsLeftText(runsLeft)}
          </p>
        )}
      </div>

      {/* The result column. RunResults names its own Results region. */}
      <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-pad-2"
      >
        {checked && !built.ok && (
          <p role="alert" className="border border-my-orange p-4 text-sm text-my-orange">
            Fix the problems marked in the options, then Run again.
          </p>
        )}
        {result && !result.ok && (
          <p role="alert" className="border border-my-orange p-4 text-sm text-my-orange">
            {result.error.message}
          </p>
        )}
        {result?.ok && <RunResults response={result.response} />}
        {!result && !(checked && !built.ok) && (
          <p className="border border-dashed border-my-stone/50 dark:border-my-stone/25 p-6 text-sm font-light text-my-walnut dark:text-my-stone">
            {pending ? 'Running…' : 'The results of a Run show here.'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-pad-2 lg:col-start-1 lg:row-start-2">
        <div>
          <label htmlFor="jev-state" className={label}>
            State
          </label>
          <fieldset className="flex gap-4 mb-2">
            <legend className="sr-only">Format</legend>
            {(
              [
                ['text', 'Plain text'],
                ['json', 'JSON'],
              ] as const
            ).map(([mode, name]) => (
              <label
                key={mode}
                className="flex items-center gap-2 text-sm font-light text-my-espresso dark:text-my-cream"
              >
                <input
                  type="radio"
                  name="jev-state-mode"
                  value={mode}
                  checked={stateMode === mode}
                  onChange={() => setStateMode(mode)}
                  className="accent-my-orange"
                />
                {name}
              </label>
            ))}
          </fieldset>
          <textarea
            id="jev-state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            rows={stateMode === 'json' ? 8 : 4}
            spellCheck={stateMode === 'text'}
            className={`${input} ${stateMode === 'json' ? 'font-mono' : ''}`}
            {...errorProps('jev-state-error', errors.state)}
          />
          <FieldError id="jev-state-error" message={errors.state} />
        </div>

        <QuestionBuilder
          questions={questions}
          errors={errors.questions}
          listError={errors.list}
          onChange={setQuestions}
        />
      </div>
    </div>
  );
}
