export function calculateWidth(value: string, minWidth: number): number {
  const text = value || '';
  const maxChars = 40;
  const charWidth = 9;
  const calculatedWidth = Math.min(text.length, maxChars) * charWidth;
  return Math.max(minWidth, calculatedWidth);
}
