export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function whatsappLink(phone: string, text?: string): string {
  const clean = normalizePhone(phone);
  const withCountry = clean.startsWith('55') ? clean : `55${clean}`;
  const base = `https://wa.me/${withCountry}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
