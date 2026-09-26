import { describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { validateRunInput } from '@/lib/jev/validate';
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

const ok: RunResult = { ok: true, response: RESPONSE };

// Clicks Run and returns the one request that the panel sent. Every request
// that the panel sends must also pass the server-side check in the Run module.
async function runAndCapture(send = vi.fn<SendRun>(async () => ok)) {
  fireEvent.click(runButton());
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  const request: DecisionsRequest = send.mock.calls[0][0];
  expect(validateRunInput(request)).toEqual({ ok: true, request });
  return request;
}

function panelWithSpy() {
  const send = vi.fn<SendRun>(async () => ok);
  renderPanel(send);
  return send;
}

function type(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

describe('Options panel: model', () => {
  it('starts the model at ~typesafe/jev-latest and sends the model that the User types', async () => {
    const send = panelWithSpy();
    const model = screen.getByLabelText('Model');
    expect(model).toHaveValue('~typesafe/jev-latest');
    type(model, '~typesafe/jev-2');
    const request = await runAndCapture(send);
    expect(request.model).toBe('~typesafe/jev-2');
    expect(Object.keys(request).sort()).toEqual([
      'model',
      'questions',
      'state',
    ]);
  });

  it('refuses a Run with an empty model', () => {
    const send = panelWithSpy();
    type(screen.getByLabelText('Model'), '  ');
    fireEvent.click(runButton());
    expect(screen.getByLabelText('Model')).toHaveAccessibleDescription(
      /give a model/i
    );
    expect(send).not.toHaveBeenCalled();
  });
});

describe('Options panel: settings after a Run', () => {
  async function editRunAndCheck(result: RunResult) {
    const send = vi.fn<SendRun>(async () => result);
    renderPanel(send);
    type(screen.getByLabelText('Model'), '~typesafe/jev-2');
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    type(stateBox(), '{"message": "Hi"}');
    type(within(question(1)).getByLabelText('Name'), 'needs_reply');
    fireEvent.click(
      within(question(2)).getByRole('button', { name: 'Remove label 3' })
    );
    type(within(question(3)).getByLabelText('Level 3'), 'Furious');

    const first = await runAndCapture(send);
    await waitFor(() => expect(runButton()).toBeEnabled());

    expect(screen.getByLabelText('Model')).toHaveValue('~typesafe/jev-2');
    expect(screen.getByRole('radio', { name: 'JSON' })).toBeChecked();
    expect(stateBox()).toHaveValue('{"message": "Hi"}');
    expect(within(question(1)).getByLabelText('Name')).toHaveValue(
      'needs_reply'
    );
    expect(within(question(2)).queryByLabelText('Label 3')).toBeNull();
    expect(within(question(3)).getByLabelText('Level 3')).toHaveValue(
      'Furious'
    );

    fireEvent.click(runButton());
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1][0]).toEqual(first);
  }

  it('keeps every setting after a Run that succeeds, so the next Run sends the same request', async () => {
    await editRunAndCheck(ok);
  });

  it('keeps every setting after a Run that fails', async () => {
    await editRunAndCheck({
      ok: false,
      error: { kind: 'upstream', message: 'The Jev model call failed' },
    });
  });
});

describe('Options panel: state', () => {
  it('sends the state as a string in plain text mode, even when it looks like JSON', async () => {
    const send = panelWithSpy();
    type(stateBox(), '{"a": 1}');
    const request = await runAndCapture(send);
    expect(request.state).toBe('{"a": 1}');
  });

  it('sends the parsed JSON value, not the string, in JSON mode', async () => {
    const send = panelWithSpy();
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    type(stateBox(), '{"message": "Refund me", "orders": [1, 2]}');
    const request = await runAndCapture(send);
    expect(request.state).toEqual({ message: 'Refund me', orders: [1, 2] });
  });

  it('refuses JSON that does not parse, shows the error at the state box, and sends nothing', async () => {
    const send = panelWithSpy();
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    type(stateBox(), '{"message": ');
    fireEvent.click(runButton());
    expect(stateBox()).toHaveAccessibleDescription(/not valid json/i);
    expect(stateBox()).toHaveAttribute('aria-invalid', 'true');
    expect(await screen.findByRole('alert')).toHaveTextContent(/fix/i);
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses JSON that is not an object or an array', async () => {
    const send = panelWithSpy();
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    type(stateBox(), '42');
    fireEvent.click(runButton());
    expect(stateBox()).toHaveAccessibleDescription(/object or an array/i);
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses an empty state in both modes', async () => {
    const send = panelWithSpy();
    type(stateBox(), '   ');
    fireEvent.click(runButton());
    expect(stateBox()).toHaveAccessibleDescription(/give a state/i);
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    type(stateBox(), '{}');
    expect(stateBox()).toHaveAccessibleDescription(/give a state/i);
    fireEvent.click(runButton());
    expect(send).not.toHaveBeenCalled();
  });

  it('removes the error as soon as the User fixes the JSON', async () => {
    const send = panelWithSpy();
    fireEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    type(stateBox(), '[1, 2');
    fireEvent.click(runButton());
    expect(stateBox()).toHaveAccessibleDescription(/not valid json/i);
    type(stateBox(), '[1, 2]');
    expect(stateBox()).not.toHaveAccessibleDescription(/not valid json/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const request = await runAndCapture(send);
    expect(request.state).toEqual([1, 2]);
  });
});

function question(n: number) {
  return screen.getByRole('group', { name: `Question ${n}` });
}

describe('Options panel: question builder', () => {
  it('edits the name and the instructions of a question', async () => {
    const send = panelWithSpy();
    const first = within(question(1));
    expect(first.getByLabelText('Name')).toHaveValue('is_urgent');
    type(first.getByLabelText('Name'), 'needs_reply');
    type(
      first.getByLabelText('Instructions'),
      'Does the customer ask for a reply?'
    );
    const request = await runAndCapture(send);
    expect(Object.keys(request.questions)).toEqual([
      'needs_reply',
      'department',
      'frustration',
    ]);
    expect(request.questions.needs_reply).toEqual({
      type: 'noul',
      instructions: 'Does the customer ask for a reply?',
      criteria: {
        true: 'Explicitly time-sensitive',
        false: 'No urgency expressed',
      },
    });
  });

  it('adds a question of each type and sends it after the samples', async () => {
    const send = panelWithSpy();
    fireEvent.click(screen.getByRole('button', { name: 'Add noul question' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Add choice question' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add score question' }));

    const noul = within(question(4));
    type(noul.getByLabelText('Name'), 'is_spam');
    type(noul.getByLabelText('Instructions'), 'Is this spam?');

    const choice = within(question(5));
    type(choice.getByLabelText('Name'), 'language');
    type(choice.getByLabelText('Instructions'), 'Which language is it in?');
    fireEvent.click(choice.getByRole('button', { name: 'Add label' }));
    type(choice.getByLabelText('Label 1'), 'en');
    type(choice.getByLabelText('Description 1'), 'English');

    const score = within(question(6));
    type(score.getByLabelText('Name'), 'politeness');
    type(score.getByLabelText('Instructions'), 'How polite is it?');
    fireEvent.click(score.getByRole('button', { name: 'Add level' }));
    type(score.getByLabelText('Level 1'), 'Rude');
    fireEvent.click(score.getByRole('button', { name: 'Add level' }));
    type(score.getByLabelText('Level 2'), 'Polite');

    const request = await runAndCapture(send);
    expect(Object.keys(request.questions)).toEqual([
      'is_urgent',
      'department',
      'frustration',
      'is_spam',
      'language',
      'politeness',
    ]);
    expect(request.questions.is_spam).toEqual({
      type: 'noul',
      instructions: 'Is this spam?',
    });
    expect(request.questions.language).toEqual({
      type: 'choice',
      instructions: 'Which language is it in?',
      criteria: { en: 'English' },
    });
    expect(request.questions.politeness).toEqual({
      type: 'score',
      instructions: 'How polite is it?',
      criteria: ['Rude', 'Polite'],
    });
  });

  it('removes a question so that the Run does not send it', async () => {
    const send = panelWithSpy();
    fireEvent.click(
      within(question(2)).getByRole('button', { name: 'Remove question' })
    );
    const request = await runAndCapture(send);
    expect(Object.keys(request.questions)).toEqual([
      'is_urgent',
      'frustration',
    ]);
  });

  it('refuses a Run with no questions', async () => {
    const send = panelWithSpy();
    for (let i = 0; i < 3; i++)
      fireEvent.click(
        within(question(1)).getByRole('button', { name: 'Remove question' })
      );
    expect(screen.queryByRole('group', { name: /question \d/i })).toBeNull();
    fireEvent.click(runButton());
    expect(screen.getByText(/add at least one question/i)).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses a Run when two questions share a name, and marks both', async () => {
    const send = panelWithSpy();
    type(within(question(2)).getByLabelText('Name'), ' is_urgent ');
    fireEvent.click(runButton());
    for (const n of [1, 2])
      expect(
        within(question(n)).getByLabelText('Name')
      ).toHaveAccessibleDescription(/two questions have the name "is_urgent"/i);
    expect(
      within(question(3)).getByLabelText('Name')
    ).not.toHaveAccessibleDescription();
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses a Run when a question has no name or no instructions', async () => {
    const send = panelWithSpy();
    type(within(question(3)).getByLabelText('Name'), '  ');
    type(within(question(3)).getByLabelText('Instructions'), '');
    fireEvent.click(runButton());
    expect(
      within(question(3)).getByLabelText('Name')
    ).toHaveAccessibleDescription(/give the question a name/i);
    expect(
      within(question(3)).getByLabelText('Instructions')
    ).toHaveAccessibleDescription(/give the question instructions/i);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('Options panel: choice questions', () => {
  it('adds, edits, and removes labels, and sends an empty description as null', async () => {
    const send = panelWithSpy();
    const choice = within(question(2));
    type(choice.getByLabelText('Label 1'), 'payments');
    type(choice.getByLabelText('Description 1'), 'Charges and refunds');
    fireEvent.click(choice.getByRole('button', { name: 'Remove label 3' }));
    fireEvent.click(choice.getByRole('button', { name: 'Add label' }));
    type(choice.getByLabelText('Label 3'), 'other');
    const request = await runAndCapture(send);
    expect(request.questions.department).toEqual({
      type: 'choice',
      instructions: 'Which team should handle this?',
      criteria: {
        payments: 'Charges and refunds',
        technical: 'Bugs, outages, integrations',
        other: null,
      },
    });
  });

  it('refuses a Run when a choice question has no labels', async () => {
    const send = panelWithSpy();
    const choice = within(question(2));
    for (let i = 0; i < 3; i++)
      fireEvent.click(choice.getByRole('button', { name: 'Remove label 1' }));
    fireEvent.click(runButton());
    expect(question(2)).toHaveTextContent(/add at least one label/i);
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses a Run when two labels are the same or a label is empty', async () => {
    const send = panelWithSpy();
    const choice = within(question(2));
    type(choice.getByLabelText('Label 2'), 'billing');
    fireEvent.click(choice.getByRole('button', { name: 'Add label' }));
    fireEvent.click(runButton());
    expect(choice.getByLabelText('Label 2')).toHaveAccessibleDescription(
      /two labels are "billing"/i
    );
    expect(choice.getByLabelText('Label 4')).toHaveAccessibleDescription(
      /give the label a name/i
    );
    expect(send).not.toHaveBeenCalled();
  });
});

describe('Options panel: score questions', () => {
  it('adds, edits, removes, and reorders the levels of the scale, and sends them in order', async () => {
    const send = panelWithSpy();
    const score = within(question(3));
    type(score.getByLabelText('Level 1'), 'Happy');
    fireEvent.click(score.getByRole('button', { name: 'Add level' }));
    type(score.getByLabelText('Level 4'), 'Furious');
    fireEvent.click(score.getByRole('button', { name: 'Remove level 2' }));
    // Now: Happy, Very angry, Furious. Move Furious up above Very angry.
    fireEvent.click(score.getByRole('button', { name: 'Move level 3 up' }));
    // Now: Happy, Furious, Very angry. Move Happy down one step.
    fireEvent.click(score.getByRole('button', { name: 'Move level 1 down' }));
    const request = await runAndCapture(send);
    expect(request.questions.frustration).toEqual({
      type: 'score',
      instructions: 'How frustrated is the customer?',
      criteria: ['Furious', 'Happy', 'Very angry'],
    });
  });

  it('cannot move the first level up or the last level down', () => {
    panelWithSpy();
    const score = within(question(3));
    expect(
      score.getByRole('button', { name: 'Move level 1 up' })
    ).toBeDisabled();
    expect(
      score.getByRole('button', { name: 'Move level 3 down' })
    ).toBeDisabled();
  });

  it('refuses a Run when a score question has no levels or an empty level', async () => {
    const send = panelWithSpy();
    const score = within(question(3));
    type(score.getByLabelText('Level 2'), ' ');
    fireEvent.click(runButton());
    expect(score.getByLabelText('Level 2')).toHaveAccessibleDescription(
      /fill in the level or remove it/i
    );
    for (let i = 0; i < 3; i++)
      fireEvent.click(score.getByRole('button', { name: 'Remove level 1' }));
    expect(question(3)).toHaveTextContent(/add at least one level/i);
    fireEvent.click(runButton());
    expect(send).not.toHaveBeenCalled();
  });
});

describe('Options panel: noul questions', () => {
  it('sends the true and false criteria that the User types', async () => {
    const send = panelWithSpy();
    const first = within(question(1));
    type(first.getByLabelText('True criteria'), 'Asks for a fix today');
    type(first.getByLabelText('False criteria'), 'Can wait a week');
    const request = await runAndCapture(send);
    expect(request.questions.is_urgent).toEqual({
      type: 'noul',
      instructions: 'Does this message convey urgency?',
      criteria: { true: 'Asks for a fix today', false: 'Can wait a week' },
    });
  });

  it('leaves out the criteria when both true and false are empty', async () => {
    const send = panelWithSpy();
    const first = within(question(1));
    type(first.getByLabelText('True criteria'), '');
    type(first.getByLabelText('False criteria'), ' ');
    const request = await runAndCapture(send);
    expect(request.questions.is_urgent).toEqual({
      type: 'noul',
      instructions: 'Does this message convey urgency?',
    });
  });

  it('refuses a Run when only one of the true and false criteria is filled', async () => {
    const send = panelWithSpy();
    const first = within(question(1));
    type(first.getByLabelText('False criteria'), '');
    fireEvent.click(runButton());
    expect(first.getByLabelText('False criteria')).toHaveAccessibleDescription(
      /fill in both true and false, or leave both empty/i
    );
    expect(send).not.toHaveBeenCalled();
  });
});
