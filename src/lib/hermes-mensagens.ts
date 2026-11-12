import { diasPreenchidos, resumoDia, type DiaPlano, type Feito } from "./treino";

/** Datas locais da Bahia; lembretes não confundem ausência de registro com ausência de treino. */
export function mensagemHermes(nome: string, plano: DiaPlano[], feitos: Pick<Feito, "dia" | "created_at">[], enviadoEm: string | null, agora: Date): string {
  const dias = diasPreenchidos(plano);
  const semana = dias.map((d) => `${d.dia}: ${resumoDia(d)}${d.detalhes ? `. Orientações do professor: ${d.detalhes}` : ""}.`).join("\n\n");
  const local = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const indice = (local.getUTCDay() + 6) % 7;
  const hoje = plano[indice];
  const dataLocal = (iso: string) => new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const hojeTexto = local.toISOString().slice(0, 10);
  const ontemTexto = new Date(local.getTime() - 86400000).toISOString().slice(0, 10);
  const ontem = plano[(indice + 6) % 7];
  const concluido = hoje && feitos.some((f) => f.dia === hoje.dia && dataLocal(f.created_at) === hojeTexto);
  const semRegistro = ontem && !ontem.descanso && Boolean(ontem.km) && enviadoEm && dataLocal(enviadoEm) <= ontemTexto && !feitos.some((f) => f.dia === ontem.dia && dataLocal(f.created_at) === ontemTexto);

  const abertura = concluido
    ? `${nome}, seu treino de hoje foi registrado. Muito bem por cumprir essa etapa e prestar contas ao professor. Disciplina não termina quando você aperta enviar: confira os dados, guarde a foto do relógio e leia a avaliação. O registro sozinho não comprova que todas as metas foram cumpridas; quem orienta os ajustes é a análise do treino.`
    : `${nome}, atenção ao seu planejamento. Aqui o compromisso é com constância, execução correta e respeito aos limites do seu corpo. Leia cada meta antes de sair: distância, tempo, ritmo e detalhes fazem parte da mesma orientação. Não transforme um treino controlado em uma disputa de velocidade e não mude o plano por conta própria.`;
  const cobranca = semRegistro
    ? `Não encontrei registro de ${ontem.dia}, quando havia ${resumoDia(ontem)}. Se você treinou, registre para o professor acompanhar; se não conseguiu, informe o motivo. Não deixe essa pendência virar hábito. Não acumule a sessão perdida com a de hoje e não tente compensar correndo em dobro: converse com o professor e siga a orientação atual.`
    : `Cumpra os dias que o professor escolheu. Organize seu horário e prepare o material com antecedência. Se surgir um impedimento, avise em vez de simplesmente desaparecer. Não transfira a sessão para outro dia e não acrescente quilômetros sem combinar. Nos dias de descanso, recuperação também é compromisso.`;
  const atual = hoje?.descanso
    ? `Hoje, ${hoje.dia}, o professor marcou descanso. Respeite essa decisão: não use o dia para acrescentar tiros ou uma corrida forte. Cuide do sono, da alimentação e da recuperação para chegar preparado à próxima sessão.`
    : hoje?.km
      ? `Hoje, ${hoje.dia}, sua meta é ${resumoDia(hoje)}. Confira também: ${hoje.detalhes || "siga os detalhes definidos pelo professor e mantenha a execução controlada"}. Execute a sessão no dia certo; se distância, tempo e ritmo parecerem incompatíveis, confirme com o professor, sem forçar o corpo para fechar números.`
      : `Hoje não há treino prescrito nesta semana. Isso não é uma falta e não autoriza inventar uma sessão. Confira os próximos dias e procure o professor se precisar de uma orientação.`;

  return [abertura, atual, semana ? `Seu planejamento enviado:\n\n${semana}` : "O professor ainda não preencheu sessões nesta semana. Aguarde as orientações antes de iniciar.",
    "Antes de correr, faça um aquecimento progressivo com caminhada leve e movimentos de mobilidade, conforme a orientação do professor. Comece sem arrancadas. Durante a corrida, respire de maneira natural e confortável, sem prender o ar nem forçar um padrão que cause desconforto. Ajuste o esforço ao ritmo prescrito e evite distrações com o celular.",
    "Beba água ao longo do dia e antes e depois da sessão, respeitando sua necessidade e o calor. Ao terminar, reduza o esforço gradualmente e caminhe para desacelerar. Se fizer alongamentos, mantenha movimentos suaves, sem dor e sem forçar; eles não substituem recuperação, alimentação e sono. Dor forte, tontura, falta de ar fora do habitual ou mal-estar exigem interromper a atividade e buscar orientação.",
    cobranca,
    `${nome}, a cobrança é por responsabilidade, não por ignorar sinais do corpo. Registre Km, Tempo, Pace e, quando possível, a foto do treino. Leia o retorno do Hermes, corrija o que ficou fora do plano e leve as dúvidas ao professor. Você evolui com trabalho consistente: compromisso no dia combinado, controle na execução e recuperação bem feita. Mantenha essa disciplina na próxima sessão.`].join("\n\n");
}