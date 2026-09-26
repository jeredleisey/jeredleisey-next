import type { DecisionsResponse } from '@/lib/jev/types';

type Answer = DecisionsResponse['answers'][string];

const label =
  'text-my-walnut dark:text-my-stone text-xs uppercase tracking-widest';
const value = 'text-my-espresso dark:text-my-cream text-sm font-light';

function fixed(n: number) {
  return n.toFixed(2);
}

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className={`${label} w-24 shrink-0`}>{name}</dt>
      <dd className={value}>{children}</dd>
    </div>
  );
}

function Probabilities({
  probabilities,
}: {
  probabilities?: Record<string, number>;
}) {
  if (!probabilities) return null;
  return (
    <Row name="Probabilities">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(probabilities).map(([key, p]) => (
          <li key={key}>
            <span className="text-my-walnut dark:text-my-stone">{key}</span>{' '}
            {fixed(p)}
          </li>
        ))}
      </ul>
    </Row>
  );
}

function Confidence({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null;
  return <Row name="Confidence">{fixed(confidence)}</Row>;
}

function AnswerBody({ answer }: { answer: Answer }) {
  switch (answer.type) {
    case 'noul':
      return <Row name="Noul">{fixed(answer.noul)}</Row>;
    case 'choice':
      return (
        <>
          <Row name="Choice">{answer.choice}</Row>
          <Confidence confidence={answer.confidence} />
          <Probabilities probabilities={answer.probabilities} />
        </>
      );
    case 'score':
      return (
        <>
          <Row name="Score">{answer.score}</Row>
          <Confidence confidence={answer.confidence} />
          <Probabilities probabilities={answer.probabilities} />
        </>
      );
    default:
      return (
        <Row name="Answer">
          This answer type is not shown yet. See the raw JSON.
        </Row>
      );
  }
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function Usage({ usage }: { usage: DecisionsResponse['usage'] }) {
  return (
    <div
      role="group"
      aria-labelledby="jev-usage"
      className="border border-my-stone/40 dark:border-my-stone/20 p-4"
    >
      <h3 id="jev-usage" className={`${label} mb-3`}>
        Usage
      </h3>
      <dl className="flex flex-col gap-2">
        <Row name="Input tokens">{usage.inputTokens}</Row>
        <Row name="Output tokens">{usage.outputTokens}</Row>
        <Row name="Cost">
          {usage.cost === undefined ? 'Not reported' : usd.format(usage.cost)}
        </Row>
      </dl>
    </div>
  );
}

export function RunResults({ response }: { response: DecisionsResponse }) {
  return (
    <section aria-label="Results" className="flex flex-col gap-pad-1">
      {Object.entries(response.answers).map(([name, answer]) => {
        const headingId = `jev-answer-${name}`;
        return (
          <div
            key={name}
            role="group"
            aria-labelledby={headingId}
            className="border border-my-stone/40 dark:border-my-stone/20 p-4"
          >
            <h3
              id={headingId}
              className="text-my-orange text-xs uppercase tracking-widest mb-3"
            >
              {name}
            </h3>
            <dl className="flex flex-col gap-2">
              <AnswerBody answer={answer} />
            </dl>
          </div>
        );
      })}
      <Usage usage={response.usage} />
      <details className="border border-my-stone/40 dark:border-my-stone/20 p-4">
        <summary className={`${label} cursor-pointer hover:text-my-orange`}>
          Raw JSON
        </summary>
        <pre className="mt-3 overflow-x-auto text-xs text-my-espresso dark:text-my-cream">
          {JSON.stringify(response, null, 2)}
        </pre>
      </details>
    </section>
  );
}
