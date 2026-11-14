/** Calendar weeks use Bahia dates, not the browser timezone. */
export function semanaAtual(agora = new Date()): string {
  const data = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}

export function moverSemana(semana: string, offset: number): string {
  const d = new Date(`${semana}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset * 7);
  return d.toISOString().slice(0, 10);
}

export function tituloSemana(semana: string): string {
  const ini = new Date(`${semana}T12:00:00Z`);
  const fim = new Date(ini);
  fim.setUTCDate(fim.getUTCDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
  return `Semana ${fmt(ini)} a ${fmt(fim)}`;
}

export const ESPERA_HERMES_MS = 120_000;
export function horarioLiberacao(agora: Date): string {
  return new Date(agora.getTime() + ESPERA_HERMES_MS).toISOString();
}
export function avaliacaoLiberada(f: { revisado_em?: string | null; liberar_em?: string | null; envio_cancelado?: boolean }, agora = new Date()): boolean {
  return Boolean(f.revisado_em && f.liberar_em && !f.envio_cancelado && new Date(f.liberar_em).getTime() <= agora.getTime());
}