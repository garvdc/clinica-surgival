export const esc = (x: unknown) =>
  String(x ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export const money = (x: number) => (x / 100).toFixed(2) + ' USD';
