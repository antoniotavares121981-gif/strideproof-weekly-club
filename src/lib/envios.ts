import { DIAS, km, resumoMeta, type Meta } from "./plano";

export type Aluno = { id: string; nome: string; whatsapp: string };
export type Registro = { km: string; tempo: string; pace: string; em: string };

export const NOME_APP = "Assessoria de Corrida";
/** WhatsApp fixo do professor. Nunca muda. */
export const PROFESSOR_PADRAO = "71 99676-9048";
export const LINK_PROFESSOR = "https://wa.me/5571996769048?text=";

/** Só letras, números e sinais simples (sem emoji e sem acento), pra abrir liso no WhatsApp. */
export function textoSimples(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014\u2022]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n +/g, "\n")
    .trim();
}

export function linkProfessor(texto: string): string {
  return LINK_PROFESSOR + encodeURIComponent(textoSimples(texto));
}

/** Número do aluno no formato do WhatsApp (com 55 do Brasil). */
export function numeroWhatsApp(numero: string): string {
  const d = numero.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}

export function numeroValido(numero: string): boolean {
  const n = numeroWhatsApp(numero);
  return n.length >= 12 && n.length <= 13;
}

export function linkAluno(numero: string, texto: string): string {
  return `https://wa.me/${numeroWhatsApp(numero)}?text=${encodeURIComponent(texto)}`;
}

export function mensagemTreinoSemana(nome: string): string {
  const linhas = [`Olá, ${nome}! Seu treino da semana chegou!`, ""];
  for (const d of DIAS) linhas.push(`*${d.curto}* - ${d.meta.tipo}: ${resumoMeta(d.meta)}`);
  linhas.push("", `Duvidas: professor ${PROFESSOR_PADRAO}`);
  return textoSimples(linhas.join("\n"));
}

// ---------- Avaliação do Hermes ----------

export function paraSegundos(t: string): number | null {
  const s = t.trim().toLowerCase().replace(",", ".");
  let m = s.match(/^(\d+)h\s*(\d{1,2})?(?:m(?:in)?)?$/);
  if (m) return Number(m[1]) * 3600 + Number(m[2] ?? 0) * 60;
  m = s.match(/^(\d+)\s*min$/);
  if (m) return Number(m[1]) * 60;
  const [a = 0, b = 0, c = 0] = s.split(":").map(Number);
  const p = s.split(":").map(Number);
  if (p.some((x) => Number.isNaN(x))) return null;
  if (p.length === 3) return a * 3600 + b * 60 + c;
  if (p.length === 2) return a * 60 + b;
  if (p.length === 1 && s) return a * 60;
  return null;
}

export function formatarPace(seg: number): string {
  const r = Math.round(seg);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
}

export type Avaliacao = { acertos: string[]; erros: string[]; melhorar: string; texto: string };

/** Avaliação curta: no máximo 2 frases. Pace sempre = tempo total / distância. */
export function avaliarHermes(meta: Meta, reg: Registro, _nome?: string): Avaliacao {
  const kmFeito = Number(reg.km.replace(",", "."));
  const tempoSeg = paraSegundos(reg.tempo) ?? 0;
  const minutos = Math.round(tempoSeg / 60);
  const paceSeg = kmFeito > 0 && tempoSeg > 0 ? tempoSeg / kmFeito : (paraSegundos(reg.pace) ?? 0);
  const pace = formatarPace(paceSeg);
  const acertos: string[] = [];
  const erros: string[] = [];
  const faixa = meta.paceMin && meta.paceMax && meta.paceMin !== meta.paceMax ? `faixa de ${meta.paceMin} a ${meta.paceMax}` : meta.paceMin || meta.paceMax ? `pedido de ${meta.paceMin || meta.paceMax}` : "";

  if (meta.km === 0) erros.push("Era dia de descanso.");
  else {
    const dif = (kmFeito - meta.km) / meta.km;
    if (Math.abs(dif) <= 0.1) acertos.push("Distância certa.");
    else erros.push(`Distância ${dif < 0 ? "abaixo" : "acima"} dos ${km(meta.km)} km pedidos.`);
    if (faixa) {
      const min = paraSegundos(meta.paceMin || meta.paceMax) ?? 0;
      const max = paraSegundos(meta.paceMax || meta.paceMin) ?? 0;
      if (paceSeg >= min - 5 && paceSeg <= max + 5) acertos.push("Pace certo.");
      else if (paceSeg < min) erros.push(`Pace ficou mais rápido que o ${faixa}.`);
      else erros.push(`Pace ficou acima do ${faixa}.`);
    }
  }

  const ok = erros.length === 0;
  const melhorar = ok
    ? "Mantém assim no próximo."
    : meta.km === 0 ? "Respeita o descanso no próximo."
    : erros.some((e) => e.includes("rápido")) ? "Segura mais no próximo."
    : erros.some((e) => e.includes("acima do")) ? "Acelera um pouco no próximo."
    : "Segue o que foi pedido no próximo.";
  const resultado = `Fez ${km(kmFeito)} km em ${minutos} min, pace ${pace}.`;
  const fraseDist = meta.km === 0 ? "Hoje era dia de descanso, e o corpo também evolui parado." : acertos.includes("Distância certa.") ? `A distância ficou certinha com os ${km(meta.km)} km que eu pedi.` : `A distância não bateu com os ${km(meta.km)} km que eu pedi.`;
  const frasePace = !faixa ? `Seu pace médio foi ${pace} por km, guarde esse número pra comparar na próxima semana.` : acertos.includes("Pace certo.") ? `O pace de ${pace} ficou dentro do ${faixa}, ritmo bem controlado.` : `O pace de ${pace} saiu do ${faixa}.`;
  const fraseTempo = minutos > 0 ? `Foram ${minutos} minutos correndo, tempo ${ok ? "bem administrado do começo ao fim" : "que mostra onde dá pra ajustar"}.` : "Anote sempre o tempo total pra eu poder conferir o ritmo.";
  const fraseFim = ok ? "Parabéns pelo treino, continue com essa constância e capriche na água e no alongamento." : "Parabéns por ter ido treinar, isso já conta muito; agora é ajustar e seguir firme.";
  const texto = `${ok ? "✅" : "⚠️"} ${resultado} ${fraseDist} ${frasePace} ${fraseTempo} ${ok ? "Dentro do pedido, mantém assim no próximo." : `${erros.join(" ")} ${melhorar}`} ${fraseFim}`;
  return { acertos, erros, melhorar, texto };
}
