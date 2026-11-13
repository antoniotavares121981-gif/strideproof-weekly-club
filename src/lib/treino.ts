import { PROFESSOR_PADRAO } from "./envios";

export type DiaPlano = { dia: string; km: string; tempo?: string; pace: string; detalhes: string; descanso?: boolean | undefined };
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
    return d?.descanso ? { dia, km: "", tempo: "", pace: "", detalhes: "", descanso: true } : d ? { ...d, tempo: d.tempo ?? "" } : { dia, km: "", tempo: "", pace: "", detalhes: "" };
  });
}

export const PLANO_PADRAO: DiaPlano[] = DIAS_SEMANA.map((dia) => ({ dia, tempo: "", ...(EXEMPLO[dia] ?? { km: "", pace: "", detalhes: "" }) }));

export function diaVazio(d: DiaPlano): boolean {
  return !d.km.trim() && !d.tempo?.trim() && !d.pace.trim() && !d.detalhes.trim();
}

/** 7 dias; cada dia ou fica vazio (descanso) ou tem distância, tempo e ritmo. */
export function erroPlano(p: DiaPlano[]): string | null {
  for (const d of p) {
    if (d.descanso || diaVazio(d)) continue;
    const faltam = [!d.km.trim() && "distância", !d.tempo?.trim() && "tempo", !d.pace.trim() && "ritmo"].filter(Boolean);
    if (faltam.length) return `${d.dia}: preencha ${faltam.join(" e ")}.`;
    if (!/^\d{1,2}:[0-5]\d$/.test(d.pace.trim())) return `${d.dia}: use ritmo no formato 5:30.`;
  }
  return null;
}

export function planoValido(p: DiaPlano[]): boolean {
  return p.length === 7 && erroPlano(p) === null;
}

/** Persiste somente decisões do professor; campos vazios continuam livres no editor. */
export function diasPreenchidos(p: DiaPlano[]): DiaPlano[] {
  return p.filter((d) => d.descanso || !diaVazio(d));
}

/** Ex.: "4 km a 4:59 /km" */
export function resumoDia(d: DiaPlano): string {
  if (d.descanso) return "Descanso";
  if (diaVazio(d)) return "";
  return `${d.km.replace(".", ",")} km${d.tempo?.trim() ? ` - ${d.tempo.trim()}` : ""} a ${d.pace} /km`;
}

export function mensagemEnvioAluno(nome: string, link: string, plano: DiaPlano[], feitos: Pick<Feito, "dia" | "avaliacao">[] = []): string {
  const linhas = [`Olá, ${nome}! Seu treino da semana chegou!`, ""];
  for (const d of diasPreenchidos(plano)) linhas.push(`*${d.dia}* - ${resumoDia(d)}`);
  const avaliados = feitos.filter((f) => f.avaliacao);
  if (avaliados.length) {
    linhas.push("", "*AVALIAÇÃO DO HERMES*");
    for (const f of avaliados) {
      const a = f.avaliacao!;
      linhas.push("", `*${f.dia}*`);
      if (a.acertos.length) linhas.push(`O que você acertou: ${a.acertos.join(" ")}`);
      if (a.erros.length) linhas.push(`O que você errou: ${a.erros.join(" ")}`);
      if (a.melhorar) linhas.push(`O que melhorar: ${a.melhorar}`);
    }
  }
  linhas.push("", "Abra seu treino e registre o que fez:", link, "", `Duvidas: professor ${PROFESSOR_PADRAO}`);
  return linhas.join("\n");
}
