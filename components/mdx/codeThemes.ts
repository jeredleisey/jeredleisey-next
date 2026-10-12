import type { ThemeRegistration } from 'shiki/core';
import { codePalette } from './codePalette';

// The two Shiki themes of the Code Block. They hold only the four tones of codePalette.
// Any scope that no rule names keeps the plain tone.
export const LIGHT_THEME_NAME = 'site-light';
export const DARK_THEME_NAME = 'site-dark';

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
          // The shell separators between commands: &&, a background &, and ;. The names end in
          // .shell, so that the semicolon of JavaScript and other languages stays plain. The
          // pipe, || and the redirect already match keyword.operator.
          'punctuation.separator.statement.and.shell',
          'punctuation.separator.statement.background.shell',
          'punctuation.terminator.statement.semicolon.shell',
        ],
        settings: { foreground: tones.keyword },
      },
      // A shell argument that is not quoted, and an option flag, are plain. Only a quoted string
      // and a number are amber. The longer scopes beat the generic string rule above.
      {
        scope: ['string.unquoted.argument', 'constant.other.option'],
        settings: { foreground: tones.plain },
      },
      // JSON keys and YAML keys are names, so they keep the plain tone.
      {
        scope: ['support.type.property-name.json', 'entity.name.tag.yaml'],
        settings: { foreground: tones.plain },
      },
    ],
  };
}

export const lightTheme = makeTheme(LIGHT_THEME_NAME, 'light');
export const darkTheme = makeTheme(DARK_THEME_NAME, 'dark');
