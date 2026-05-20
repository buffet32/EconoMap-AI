const ARABIC_RANGES = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];

const LATIN_REGEX = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;
const ALLOWED_PUNCTUATION = new Set(['-', '_', '.', ',', ';', ':', '/', '(', ')', '[', ']', '{', '}', "'", '"', '&', '+']);

const isArabicChar = (char) => {
  const code = char.codePointAt(0);
  return ARABIC_RANGES.some(([start, end]) => code >= start && code <= end);
};

const isAllowedChar = (char) => {
  if (char === ' ' || /\s/.test(char) || /\d/.test(char)) return true;
  if (ALLOWED_PUNCTUATION.has(char)) return true;
  return LATIN_REGEX.test(char) || isArabicChar(char);
};

export const sanitizeDisplayText = (value) => {
  if (value == null) return '';
  const text = String(value);
  const cleaned = [...text].filter(isAllowedChar).join('');
  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
};
