'use client';

import { useState } from 'react';
import {
  DEFAULT_MODEL,
  SAMPLE_QUESTIONS,
  SAMPLE_STATE,
} from '@/lib/jev/samples';
import type { DecisionsRequest, RunResult } from '@/lib/jev/types';
import { RunResults } from './RunResults';

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

const label =
  'block text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest mb-2';
const box = 'border border-my-stone/40 dark:border-my-stone/20';

function criteriaText(q: DecisionsRequest['questions'][string]): string {
  if (q.type === 'choice') return Object.keys(q.criteria).join(', ');
  if (q.type === 'score')
    return q.criteria
      .map((c) => (typeof c === 'string' ? c : JSON.stringify(c)))
      .join(' < ');
  if (q.criteria)
    return `true: ${String(q.criteria.true)}. false: ${String(q.criteria.false)}.`;
  return '';
}

export function OptionsPanel({ send = sendToRunRoute }: { send?: SendRun }) {
  const [state, setState] = useState(SAMPLE_STATE);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  async function onRun() {
    if (pending) return;
    setPending(true);
    try {
      setResult(
        await send({ model: DEFAULT_MODEL, state, questions: SAMPLE_QUESTIONS })
      );
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

  return (
    <div className="flex flex-col gap-pad-2">
      <div>
        <span className={label}>Model</span>
        <p className="text-my-espresso dark:text-my-cream text-sm font-light font-mono">
          {DEFAULT_MODEL}
        </p>
      </div>

      <div>
        <label htmlFor="jev-state" className={label}>
          State
        </label>
        <textarea
          id="jev-state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          rows={4}
          className={`${box} w-full bg-transparent p-3 text-sm font-light text-my-espresso dark:text-my-cream focus:outline-none focus:border-my-orange`}
        />
      </div>

      <div>
        <span className={label}>Questions</span>
        <ul
          className={`${box} divide-y divide-my-stone/40 dark:divide-my-stone/20`}
        >
          {Object.entries(SAMPLE_QUESTIONS).map(([name, q]) => (
            <li key={name} className="p-3">
              <p className="text-sm text-my-espresso dark:text-my-cream">
                {name}{' '}
                <span className="text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest ml-2">
                  {q.type}
                </span>
              </p>
              <p className="text-xs font-light text-my-walnut dark:text-my-stone mt-1">
                {String(q.instructions)} {criteriaText(q)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button
          type="button"
          onClick={onRun}
          disabled={pending}
          className={`${box} px-6 py-3 text-sm uppercase tracking-widest text-my-espresso dark:text-my-cream hover:border-my-orange hover:text-my-orange disabled:opacity-50 disabled:hover:border-my-stone/40 disabled:hover:text-my-espresso transition-colors`}
        >
          {pending ? 'Running…' : 'Run'}
        </button>
      </div>

      {result && !result.ok && (
        <p
          role="alert"
          className="border border-my-orange p-4 text-sm text-my-orange"
        >
          {result.error.message}
        </p>
      )}
      {result?.ok && <RunResults response={result.response} />}
    </div>
  );
}
