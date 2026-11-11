import { PROFESSOR_PADRAO } from "./envios";

export type DiaPlano = { dia: string; km: string; tempo?: string; pace: string; detalhes: string };
export type AvaliacaoSalva = { acertos: string[]; erros: string[]; melhorar: string; texto: string; em: string };
export type Feito = { id: string; dia_index: number; dia: string; km: string; tempo: string; pace: string; foto: string | null; created_at: string; avaliacao: AvaliacaoSalva | null };

export const DIAS_SEMANA = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

const EXEMPLO: Record<string, Omit<DiaPlano, "dia">> = {
  SEGUNDA: { km: "4", pace: "4:59", detalhes: "" },
  QUARTA: { km: "7", pace: "6:00", detalhes: "" },
  SEXTA: { km: "10", pace: "5:50", detalhes: "" },
};

/** Sempre 7 dias, de SEGUNDA a DOMINGO; dias sem treino ficam vazios (descanso). */
export function completarSemana(p: DiaPlano[] | null | undefined): DiaPlano[] {
  return DIAS_SEMANA.map((dia) => {
    const d = p?.find((x) => x.dia === dia);
    return d ? { ...d, tempo: d.tempo ?? "" } : { dia, km: "", tempo: "", pace: "", detalhes: "" };
  });
}

export const PLANO_PADRAO: DiaPlano[] = DIAS_SEMANA.map((dia) => ({ dia, tempo: "", ...(EXEMPLO[dia] ?? { km: "", pace: "", detalhes: "" }) }));

export function diaVazio(d: DiaPlano): boolean {
  return !d.km.trim() && !d.tempo?.trim() && !d.pace.trim();
}

/** 7 dias; cada dia ou fica vazio (descanso) ou tem distância, tempo e ritmo. */
export function planoValido(p: DiaPlano[]): boolean {
  return (
    p.length === 7 &&
    p.some((d) => !diaVazio(d)) &&
    p.every((d) => d.dia && (diaVazio(d) || (d.km.trim() && d.tempo?.trim() && /^\d{1,2}:\d{2}$/.test(d.pace.trim()))))
  );
}

/** Ex.: "4 km a 4:59 /km" */
export function resumoDia(d: DiaPlano): string {
  if (diaVazio(d)) return "Descanso";
  return `${d.km.replace(".", ",")} km${d.tempo?.trim() ? ` - ${d.tempo.trim()}` : ""} a ${d.pace} /km`;
}

export function mensagemEnvioAluno(nome: string, link: string, plano: DiaPlano[]): string {
  const linhas = [`Olá, ${nome}! Seu treino da semana chegou!`, ""];
  for (const d of plano) linhas.push(`*${d.dia}* - ${resumoDia(d)}`);
  linhas.push("", "Abra seu treino e registre o que fez:", link, "", `Duvidas: professor ${PROFESSOR_PADRAO}`);
  return linhas.join("\n");
}
