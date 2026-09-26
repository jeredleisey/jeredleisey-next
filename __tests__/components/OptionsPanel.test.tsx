import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptionsPanel, type SendRun } from '@/components/jev/OptionsPanel';
import type {
  DecisionsRequest,
  DecisionsResponse,
  RunResult,
} from '@/lib/jev/types';

const RESPONSE: DecisionsResponse = {
  id: 'dec-1',
  model: '~typesafe/jev-latest',
  answers: {
    is_urgent: { type: 'noul', noul: 0.87 },
    department: {
      type: 'choice',
      choice: 'billing',
      confidence: 0.9,
      probabilities: { billing: 0.9, technical: 0.08, sales: 0.02 },
    },
    frustration: {
      type: 'score',
      score: 2,
      confidence: 0.7,
      probabilities: { '1': 0.1, '2': 0.7, '3': 0.2 },
    },
  },
  usage: { inputTokens: 312, outputTokens: 9, cost: 0.00042 },
};

function renderPanel(send: SendRun) {
  render(<OptionsPanel send={send} />);
}

function stateBox() {
  return screen.getByLabelText(/state/i);
}

function runButton() {
  return screen.getByRole('button', { name: /run/i });
}

describe('Options panel', () => {
  it('sends the state, the default model, and the three sample questions', async () => {
    const send = vi.fn<SendRun>(async () => ({ ok: true, response: RESPONSE }));
    renderPanel(send);
    fireEvent.change(stateBox(), { target: { value: 'My invoice is wrong.' } });
    fireEvent.click(runButton());
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const request: DecisionsRequest = send.mock.calls[0][0];
    expect(request.model).toBe('~typesafe/jev-latest');
    expect(request.state).toBe('My invoice is wrong.');
    expect(request.questions).toEqual({
      is_urgent: {
        type: 'noul',
        instructions: 'Does this message convey urgency?',
        criteria: {
          true: 'Explicitly time-sensitive',
          false: 'No urgency expressed',
        },
      },
      department: {
        type: 'choice',
        instructions: 'Which team should handle this?',
        criteria: {
          billing: 'Payments, invoicing, refunds',
          technical: 'Bugs, outages, integrations',
          sales: 'Pricing, upgrades, new accounts',
        },
      },
      frustration: {
        type: 'score',
        instructions: 'How frustrated is the customer?',
        criteria: ['Calm', 'Frustrated', 'Very angry'],
      },
    });
  });

  it('shows that a Run is in progress and cannot be clicked twice', async () => {
    let finish!: (result: RunResult) => void;
    const send = vi.fn<SendRun>(
      () => new Promise((resolve) => (finish = resolve))
    );
    renderPanel(send);
    fireEvent.click(runButton());
    const busy = await screen.findByRole('button', { name: /running/i });
    expect(busy).toBeDisabled();
    fireEvent.click(busy);
    expect(send).toHaveBeenCalledTimes(1);
    finish({ ok: true, response: RESPONSE });
    await waitFor(() => expect(runButton()).toBeEnabled());
  });

  it('shows each answer by question name: the noul value, the choice label, and the score, with probabilities and confidence', async () => {
    renderPanel(async () => ({ ok: true, response: RESPONSE }));
    fireEvent.click(runButton());
    const urgent = await screen.findByRole('group', { name: 'is_urgent' });
    expect(urgent).toHaveTextContent(/noul\s*0\.87/i);

    const department = screen.getByRole('group', { name: 'department' });
    expect(department).toHaveTextContent(/choice\s*billing/i);
    expect(department).toHaveTextContent(/confidence\s*0\.90/i);
    expect(department).toHaveTextContent(/billing\s*0\.90/);
    expect(department).toHaveTextContent(/technical\s*0\.08/);
    expect(department).toHaveTextContent(/sales\s*0\.02/);

    const frustration = screen.getByRole('group', { name: 'frustration' });
    expect(frustration).toHaveTextContent(/score\s*2/i);
    expect(frustration).toHaveTextContent(/confidence\s*0\.70/i);
    expect(frustration).toHaveTextContent(/3\s*0\.20/);
  });

  it('shows the input tokens, the output tokens, the cost, and the raw JSON', async () => {
    renderPanel(async () => ({ ok: true, response: RESPONSE }));
    fireEvent.click(runButton());
    const usage = await screen.findByRole('group', { name: /usage/i });
    expect(usage).toHaveTextContent(/input tokens\s*312/i);
    expect(usage).toHaveTextContent(/output tokens\s*9/i);
    expect(usage).toHaveTextContent(/cost\s*\$0\.00042/i);
    const raw = screen.getByText(/raw json/i).closest('details')!;
    expect(JSON.parse(raw.querySelector('pre')!.textContent!)).toEqual(
      RESPONSE
    );
  });

  it('says that the cost was not reported when the response has no cost', async () => {
    const noCost = { ...RESPONSE, usage: { inputTokens: 10, outputTokens: 2 } };
    renderPanel(async () => ({ ok: true, response: noCost }));
    fireEvent.click(runButton());
    const usage = await screen.findByRole('group', { name: /usage/i });
    expect(usage).toHaveTextContent(/cost\s*not reported/i);
  });

  it('shows an answer of an unknown type by name without breaking the other answers', async () => {
    const withUnknown = {
      ...RESPONSE,
      answers: {
        ...RESPONSE.answers,
        ranking: { type: 'UNKNOWN', isUnknown: true, raw: {} },
      },
    } as unknown as DecisionsResponse;
    renderPanel(async () => ({ ok: true, response: withUnknown }));
    fireEvent.click(runButton());
    expect(
      await screen.findByRole('group', { name: 'ranking' })
    ).toHaveTextContent(/raw json/i);
    expect(screen.getByRole('group', { name: 'is_urgent' })).toHaveTextContent(
      /0\.87/
    );
  });

  it('shows a clear error when the Run fails', async () => {
    renderPanel(async () => ({
      ok: false,
      error: {
        kind: 'upstream',
        message: 'The Jev model call failed: Provider returned 503',
      },
    }));
    fireEvent.click(runButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The Jev model call failed: Provider returned 503'
    );
    expect(
      screen.queryByRole('region', { name: /results/i })
    ).not.toBeInTheDocument();
  });

  it('shows a clear error when the Run route cannot be reached', async () => {
    renderPanel(async () => {
      throw new TypeError('Failed to fetch');
    });
    fireEvent.click(runButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not reach the server/i
    );
    expect(runButton()).toBeEnabled();
  });

  it('clears the last error when a new Run succeeds', async () => {
    const send = vi
      .fn<SendRun>()
      .mockResolvedValueOnce({
        ok: false,
        error: { kind: 'upstream', message: 'Failed once' },
      })
      .mockResolvedValueOnce({ ok: true, response: RESPONSE });
    renderPanel(send);
    fireEvent.click(runButton());
    await screen.findByRole('alert');
    fireEvent.click(runButton());
    await screen.findByRole('group', { name: 'is_urgent' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
