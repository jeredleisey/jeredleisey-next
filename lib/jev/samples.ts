import type { DecisionsRequest } from './types';

export const DEFAULT_MODEL = '~typesafe/jev-latest';

export const SAMPLE_STATE = 'Help! My payouts have been failing for 3 days.';

// The three sample questions from the POC: one of each type.
export const SAMPLE_QUESTIONS: DecisionsRequest['questions'] = {
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
};
