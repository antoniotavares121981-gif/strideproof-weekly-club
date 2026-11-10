import type { Meta } from "./plano";

export type Veredito = "CERTO" | "ERRADO";
export type Campo = "Km" | "Tempo" | "Pace" | "Tipo de treino";

export type Dados = {
  km: string;
  tempo: string;
  pace: string;
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

export const DADOS_VAZIOS: Dados = { km: "", tempo: "", pace: "" };

/** O aluno só pode corrigir 1 vez, e só quando o Boneco Mágico disse ERRADO. */
export function podeCorrigir(envio: EnvioDia | null | undefined): boolean {
  if (!envio) return false;
  if (envio.depois) return false;
  return envio.antes.resultado.veredito === "ERRADO";
}

const marca = (v: Veredito) => (v === "CERTO" ? "CERTO" : "ERRADO");

function blocoTentativa(t: Tentativa): string {
  const d = t.dados;
  const linhas = [
    `Km: ${d.km || "-"} | Tempo: ${d.tempo || "-"} | Pace: ${d.pace || "-"}`,
    `Boneco Magico: ${marca(t.resultado.veredito)}`,
    ...t.resultado.itens.map((i) => `- ${i.campo}: ${marca(i.status)}${i.status === "ERRADO" ? ` (${i.motivo})` : ""}`),
  ];
  if (!t.resultado.fotoValida) linhas.push("Atencao: a foto nao parece do relogio/Strava.");
  return linhas.join("\n");
}

/** Deixa só letras, números e sinais simples (sem emoji e sem acento), pra abrir liso no WhatsApp. */
export function textoSimples(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014\u2022]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n +/g, "\n")
    .trim();
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
    `*CIRCUITO JAUA* - ${diaNome} (${data})`,
    `Aluno: *${textoSimples(nomeAluno) || "Aluno"}*`,
    `Treino: ${meta.titulo} - ${meta.km} km | ${meta.tempo} | pace ${meta.pace}`,
    "",
  ];

  if (envio.depois) {
    return textoSimples(
      [
        ...cabecalho,
        "*O aluno CORRIGIU o treino*",
        "",
        "*ANTES:*",
        blocoTentativa(envio.antes),
        "",
        "*DEPOIS:*",
        blocoTentativa(envio.depois),
      ].join("\n"),
    );
  }

  return textoSimples([...cabecalho, blocoTentativa(envio.antes)].join("\n"));
}

/** WhatsApp fixo do professor. O botão sempre abre esse número; o aluno não troca. */
export const PROFESSOR_PADRAO = "71 99676-9048";

/** Começo fixo do link do professor. */
export const LINK_PROFESSOR = "https://wa.me/5571996769048?text=";

/** Link do botão "Mandar pro professor": sempre o WhatsApp do professor, com texto simples. */
export function linkProfessor(texto: string): string {
  return LINK_PROFESSOR + encodeURIComponent(textoSimples(texto));
}
