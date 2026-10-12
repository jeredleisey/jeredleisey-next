import type { ThemeRegistration } from 'shiki/core';
import { codePalette } from './codePalette';

// The two Shiki themes of the Code Block. They hold only the four tones of codePalette.
// Any scope that no rule names keeps the plain tone.
function makeTheme(name: string, type: 'light' | 'dark'): ThemeRegistration {
  const tones = codePalette[type];
  return {
    name,
    type,
    fg: tones.plain,
    bg: 'transparent',
    settings: [
      { settings: { foreground: tones.plain } },
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: tones.comment } },
      {
        scope: [
          'string',
          'punctuation.definition.string',
          'constant.numeric',
          'constant.language',
          'constant.character',
          'constant.other.symbol',
          'markup.inserted',
        ],
        settings: { foreground: tones.string },
      },
      {
        scope: [
          'keyword',
          'storage',
          'keyword.operator',
          'entity.name.tag',
          'markup.deleted',
        ],
        settings: { foreground: tones.keyword },
      },
      // JSON keys and YAML keys are names, so they keep the plain tone.
      {
        scope: ['support.type.property-name.json', 'entity.name.tag.yaml'],
        settings: { foreground: tones.plain },
      },
    ],
  };
}

export const lightTheme = makeTheme('site-light', 'light');
export const darkTheme = makeTheme('site-dark', 'dark');
