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

export function avaliarHermes(meta: Meta, reg: Registro, nome?: string): Avaliacao {
  const kmFeito = Number(reg.km.replace(",", "."));
  const tempoSeg = paraSegundos(reg.tempo) ?? 0;
  const minutos = Math.round(tempoSeg / 60);
  const paceSeg = paraSegundos(reg.pace) ?? (kmFeito > 0 ? tempoSeg / kmFeito : 0);
  const pace = formatarPace(paceSeg);
  const acertos: string[] = [];
  const erros: string[] = [];

  if (meta.km === 0) {
    erros.push("O dia era de descanso e você correu.");
  } else {
    const dif = (kmFeito - meta.km) / meta.km;
    if (Math.abs(dif) <= 0.1) acertos.push(`Distância dentro do planejado (${km(meta.km)} km).`);
    else if (dif < 0) erros.push(`Correu ${km(kmFeito)} km, abaixo dos ${km(meta.km)} km planejados.`);
    else erros.push(`Correu ${km(kmFeito)} km, acima dos ${km(meta.km)} km planejados.`);

    const min = paraSegundos(meta.paceMin) ?? 0;
    const max = paraSegundos(meta.paceMax) ?? 0;
    if (paceSeg >= min - 5 && paceSeg <= max + 5) acertos.push(`Pace médio dentro da faixa de ${meta.paceMin} a ${meta.paceMax} /km.`);
    else if (paceSeg < min) erros.push(`Pace de ${pace} /km, mais rápido que a faixa de ${meta.paceMin} a ${meta.paceMax} /km.`);
    else erros.push(`Pace de ${pace} /km, mais lento que a faixa de ${meta.paceMin} a ${meta.paceMax} /km.`);
  }

  const dentro = erros.length === 0;
  const conselho = dentro
    ? "Conselho: mantenha essa regularidade e cuide da recuperação para o próximo treino."
    : erros.some((e) => e.includes("rápido"))
      ? "Conselho: segure o ritmo no começo. Correr mais forte que o planejado aumenta o risco de lesão."
      : erros.some((e) => e.includes("descanso"))
        ? "Conselho: respeite o descanso. É nele que o corpo evolui."
        : "Conselho: siga a faixa de pace e a distância do plano para tirar o máximo do treino.";

  const abertura = `Aqui na ${NOME_APP}, vimos que você concluiu seu treino de ${minutos} minutos correndo ${km(kmFeito)} km com pace médio de ${pace} /km, ${
    dentro
      ? "mantendo seus quilômetros constantes dentro da faixa que o professor planejou."
      : "mas alguns pontos ficaram fora do que o professor planejou."
  }`;

  const texto = [
    nome ? `${nome}, leia esta avaliação com atenção. O treino precisa ser executado com disciplina, não apenas registrado. Compare seus números com a meta e leve ao professor qualquer dificuldade que apareceu durante a sessão.` : "Leia esta avaliação com atenção. O treino precisa ser executado com disciplina, não apenas registrado. Compare seus números com a meta e leve ao professor qualquer dificuldade que apareceu durante a sessão.",
    abertura,
    `O tempo informado foi ${reg.tempo}, para ${km(kmFeito)} km, com pace médio de ${pace} /km. ${meta.tempo ? `O tempo planejado era ${meta.tempo}.` : "Este plano não informa uma meta de tempo; não vou inventar uma duração."} Esta análise usa os números registrados: eles não permitem afirmar se você parou, acelerou no final ou cumpriu tiros e aquecimento. Confira os detalhes da sessão e comunique ao professor o que aconteceu.`,
    acertos.length ? `Acertou: ${acertos.join(" ")}` : "",
    erros.length ? `Precisa ajustar: ${erros.join(" ")}` : "",
    conselho,
    dentro ? "Muito bem por manter os números dentro das metas analisadas. Esse resultado merece reconhecimento, mas não é autorização para aumentar a carga sozinho. Repita o controle, mantenha a regularidade e continue registrando com precisão. Disciplina é cumprir o plano, inclusive quando a orientação pede um ritmo mais leve." : "Os pontos fora da meta precisam de correção, não de desculpas nem de pressa para compensar. Reveja distância e ritmo antes da próxima sessão, escolha um percurso adequado e acompanhe o esforço durante o treino. Se a meta estiver difícil ou os valores parecerem incompatíveis, converse com o professor para ajustar a orientação com segurança.",
    "Antes da próxima corrida, prepare-se com caminhada leve e mobilidade, aumentando o esforço gradualmente conforme a orientação do professor. Respire naturalmente, sem prender o ar, e mantenha o esforço controlado. Beba água ao longo do dia, antes e depois da atividade, especialmente no calor, respeitando suas necessidades.",
    "Ao terminar, desacelere aos poucos. Alongamentos, quando orientados, devem ser suaves e sem dor; cuide também do sono e da alimentação. Não force uma sessão diante de dor forte, tontura ou mal-estar: interrompa e procure orientação. Cobrança de disciplina não significa ignorar o corpo.",
    "Cumpra a próxima sessão no dia combinado, sem acumular treinos perdidos e sem correr em dobro para compensar. Registre Km, Tempo e Pace com cuidado e anexe a foto quando possível. Leia as orientações, aplique as correções e mantenha o professor informado. A evolução exige constância, responsabilidade e recuperação, não uma corrida isolada feita a qualquer custo.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { acertos, erros, melhorar: conselho.replace(/^Conselho: /, ""), texto };
}
