// The colors of syntax highlighting. Four tones, and no new hue: plain code, comments (the
// walnut and stone family), strings and numbers (the amber family), keywords and operators
// (the orange family). Each color has a contrast of 4.5 to 1 or more against the body of the
// Code Block in its theme. The light body is #EAE3D6. The dark body is #25201C, which is
// cream at 4% over espresso. The dark keyword is not the pure #FF4F00, because that color is
// the accent for links and focus and stays rare. The Shiki themes and tailwind.config.ts
// both read this file.
export const codePalette = {
  light: { plain: '#1C1714', comment: '#6A5F56', string: '#855A0E', keyword: '#B23A00' },
  dark: { plain: '#F4EFE6', comment: '#9E9386', string: '#CC922F', keyword: '#F0703A' },
} as const;
