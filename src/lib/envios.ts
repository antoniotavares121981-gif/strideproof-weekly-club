import type { Meta } from "./plano";

export type Veredito = "CERTO" | "ERRADO";
export type Campo = "Km" | "Tempo" | "Pace" | "FC";

export type Dados = {
  km: string;
  tempo: string;
  pace: string;
  fc: string;
  sentiu: string;
  comentario: string;
};

export type ItemConferido = {
  campo: Campo;
  valorFoto: string | null;
  status: Veredito;
  motivo: string;
};

export type Resultado = {
  veredito: Veredito;
  fotoValida: boolean;
  itens: ItemConferido[];
  mensagem: string;
};

export type Tentativa = {
  dados: Dados;
  foto: string; // imagem reduzida (data URL)
  resultado: Resultado;
  em: string; // ISO
};

export type EnvioDia = {
  antes: Tentativa;
  depois?: Tentativa;
};

export const SENTIMENTOS = [
  { id: "otimo", emoji: "🔥", texto: "Voando" },
  { id: "bem", emoji: "😄", texto: "Bem" },
  { id: "normal", emoji: "🙂", texto: "Normal" },
  { id: "cansado", emoji: "😮‍💨", texto: "Cansado" },
  { id: "dor", emoji: "🤕", texto: "Com dor" },
] as const;

export const DADOS_VAZIOS: Dados = { km: "", tempo: "", pace: "", fc: "", sentiu: "", comentario: "" };

/** O aluno só pode corrigir 1 vez, e só quando o robô disse ERRADO. */
export function podeCorrigir(envio: EnvioDia | null | undefined): boolean {
  if (!envio) return false;
  if (envio.depois) return false;
  return envio.antes.resultado.veredito === "ERRADO";
}

export function sentimentoTexto(id: string): string {
  const s = SENTIMENTOS.find((x) => x.id === id);
  return s ? `${s.emoji} ${s.texto}` : "—";
}

const marca = (v: Veredito) => (v === "CERTO" ? "CERTO ✅" : "ERRADO ❌");

function blocoTentativa(t: Tentativa): string {
  const d = t.dados;
  const linhas = [
    `Km: ${d.km || "—"} | Tempo: ${d.tempo || "—"} | Pace: ${d.pace || "—"} | FC: ${d.fc || "—"}`,
    `Como se sentiu: ${sentimentoTexto(d.sentiu)}${d.comentario ? ` — "${d.comentario}"` : ""}`,
    `🤖 Robô: ${marca(t.resultado.veredito)}`,
    ...t.resultado.itens.map((i) => `• ${i.campo}: ${marca(i.status)}${i.status === "ERRADO" ? ` (${i.motivo})` : ""}`),
  ];
  if (!t.resultado.fotoValida) linhas.push("⚠️ A foto não parece do relógio/Strava.");
  return linhas.join("\n");
}

export function montarMensagem(args: {
  nomeAluno: string;
  diaNome: string;
  data: string;
  meta: Meta;
  envio: EnvioDia;
}): string {
  const { nomeAluno, diaNome, data, meta, envio } = args;
  const cabecalho = [
    `🏃 *CIRCUITO JAUA* — ${diaNome} (${data})`,
    `Aluno: *${nomeAluno || "Aluno"}*`,
    `Treino: ${meta.titulo} — ${meta.km} km | ${meta.tempo} | pace ${meta.pace} | FC até ${meta.fcMax}`,
    "",
  ];

  if (envio.depois) {
    return [
      ...cabecalho,
      "✏️ *O aluno CORRIGIU o treino*",
      "",
      "*ANTES:*",
      blocoTentativa(envio.antes),
      "",
      "*DEPOIS:*",
      blocoTentativa(envio.depois),
    ].join("\n");
  }

  return [...cabecalho, blocoTentativa(envio.antes)].join("\n");
}

/** WhatsApp fixo do professor. O botão sempre abre esse número; o aluno não troca. */
export const PROFESSOR_PADRAO = "71 99676-9048";

/** Link do botão "Mandar pro professor": sempre o WhatsApp do professor. */
export function linkProfessor(texto: string): string {
  return linkWhatsApp(PROFESSOR_PADRAO, texto);
}

/** Só os números, com 55 na frente quando o aluno digita só DDD + número. */
export function limparNumero(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  if (!digitos) return "";
  if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith("55")) return `55${digitos}`;
  return digitos;
}

export function linkWhatsApp(numero: string, texto: string): string {
  const n = limparNumero(numero);
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
