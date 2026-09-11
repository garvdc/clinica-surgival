export const money = (c: number) =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(
    c / 100,
  );
export const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
