import { PROFESSOR_PADRAO } from "./envios";

export type DiaPlano = { dia: string; km: string; pace: string; detalhes: string };
export type Feito = { id: string; dia_index: number; dia: string; km: string; tempo: string; pace: string; foto: string | null; created_at: string };

export const DIAS_SEMANA = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];

export const PLANO_PADRAO: DiaPlano[] = [
  { dia: "SEGUNDA", km: "4", pace: "4:59", detalhes: "" },
  { dia: "QUARTA", km: "7", pace: "6:00", detalhes: "" },
  { dia: "SEXTA", km: "10", pace: "5:50", detalhes: "" },
];

/** Plano precisa ter 3 dias, cada um com distância e pace. */
export function planoValido(p: DiaPlano[]): boolean {
  return p.length === 3 && p.every((d) => d.dia && d.km.trim() && /^\d{1,2}:\d{2}$/.test(d.pace.trim()));
}

/** Ex.: "4 km a 4:59 /km" */
export function resumoDia(d: DiaPlano): string {
  return `${d.km.replace(".", ",")} km a ${d.pace} /km`;
}

export function mensagemEnvioAluno(nome: string, link: string, plano: DiaPlano[]): string {
  const linhas = [`Olá, ${nome}! Seu treino da semana chegou!`, ""];
  for (const d of plano) linhas.push(`*${d.dia}* - ${resumoDia(d)}`);
  linhas.push("", "Abra seu treino e registre o que fez:", link, "", `Duvidas: professor ${PROFESSOR_PADRAO}`);
  return linhas.join("\n");
}
