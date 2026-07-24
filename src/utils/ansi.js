import AnsiConverter from 'ansi-to-html';

const converter = new AnsiConverter({
  fg: '#e2e8f0',
  bg: '#090d16',
  newline: true,
  escapeXML: true,
  colors: {
    0: '#0f172a',
    1: '#f87171',
    2: '#4ade80',
    3: '#facc15',
    4: '#60a5fa',
    5: '#c084fc',
    6: '#38bdf8',
    7: '#f1f5f9',
  }
});

export function renderAnsiToHtml(text) {
  if (!text) return '';
  try {
    return converter.toHtml(text);
  } catch (err) {
    return text;
  }
}
