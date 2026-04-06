/**
 * Formata qualquer valor de data para string DD/MM/YYYY HH:mm.
 * Seguro para: string ISO, objeto Date, input type="date" (YYYY-MM-DD).
 */
export const formatDateBR = (value: string | Date | null | undefined): string => {
  if (!value) return '';

  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) return String(value);

  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh   = String(date.getHours()).padStart(2, '0');
  const min  = String(date.getMinutes()).padStart(2, '0');
  const sec  = String(date.getSeconds()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
};

/**
 * Formata input type="date" (YYYY-MM-DD) para DD/MM/YYYY HH:mm:ss.
 * Não passa pelo construtor Date() para evitar deslocamento de timezone.
 */
export const formatDateInputBR = (value: string | null | undefined): string => {
  if (!value) return '';

  const [yyyy, mm, dd] = value.split('-');
  if (!yyyy || !mm || !dd) return value;

  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
};
