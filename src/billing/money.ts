export function cents(value: unknown) {
  const s = String(value);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(s))
    throw new Error('Importe inválido: usa como máximo dos decimales.');
  const [whole, fraction = ''] = s.split('.');
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (n <= 0) throw new Error('El importe debe ser mayor que cero.');
  return n;
}
export function toUSD(amount: number, currency: string, rate: unknown) {
  if (currency === 'USD') return { usdCents: amount, rate: '1' };
  if (currency !== 'VES') throw new Error('Moneda no admitida.');
  const text = String(rate);
  if (!/^\d{1,8}(\.\d{1,6})?$/.test(text) || Number(text) <= 0)
    throw new Error('Ingresa una tasa Bs por USD válida.');
  const [w, f = ''] = text.split('.');
  const units = BigInt(w) * 1000000n + BigInt(f.padEnd(6, '0'));
  const numerator = BigInt(amount) * 1000000n;
  const usdCents = Number((numerator + units / 2n) / units);
  if (usdCents <= 0)
    throw new Error('El pago convertido debe ser de al menos USD 0,01.');
  return { usdCents, rate: text };
}
