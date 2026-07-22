export const allFonts = [
  { name: 'Bold', category: 'bold', map: {} },
  { name: 'Italic', category: 'italic', map: {} },
  { name: 'Bold Italic', category: 'bold', map: {} },
  { name: 'Strikethrough', category: 'strikethrough', map: {} },
];

export function transformText(text, fontDef) {
  return [...text].map((char) => fontDef.map[char] ?? char).join('');
}
