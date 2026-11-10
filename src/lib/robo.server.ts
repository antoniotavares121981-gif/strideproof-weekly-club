import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoObjectGeneratedError, Output, jsonSchema, streamText } from "ai";

import type { Dados, Resultado } from "./envios";
import type { Meta } from "./plano";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODELO = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const resp = await fetch(input, { ...init, headers });
    runId ??= resp.headers.get(RUN_ID)?.trim() || undefined;
    return resp;
  };
}

const ESQUEMA = jsonSchema<Resultado>({
  type: "object",
  additionalProperties: false,
  required: ["veredito", "fotoValida", "itens", "mensagem"],
  properties: {
    veredito: { type: "string", enum: ["CERTO", "ERRADO"] },
    fotoValida: { type: "boolean" },
    itens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["campo", "valorFoto", "status", "motivo"],
        properties: {
          campo: { type: "string", enum: ["Km", "Tempo", "Pace", "Tipo de treino"] },
          valorFoto: { type: ["string", "null"] },
          status: { type: "string", enum: ["CERTO", "ERRADO"] },
          motivo: { type: "string" },
        },
      },
    },
    mensagem: { type: "string" },
  },
});

const INSTRUCOES = `Você é o "Boneco Mágico" do Circuito Jaua: um treinador de corrida sério e profissional que avalia o treino do aluno.
Você recebe: o treino que o professor passou (nome, Km, Tempo, Pace e a descrição), os números que o aluno digitou e uma foto (print do relógio, Garmin, Strava, etc).

Sua tarefa:
1. Leia na foto: distância (Km), tempo total e pace médio (min/km). Se algo não aparece na foto, use valorFoto = null.
2. Para cada campo (Km, Tempo, Pace), nesta ordem, diga CERTO ou ERRADO:
   - ERRADO se o número digitado não bate com a foto (tolerância: Km ±0,1; Tempo ±30 s; Pace ±5 s/km).
   - ERRADO se não cumpriu o treino: Km abaixo de 95% da meta; Pace mais de 15 s/km mais lento OU mais de 20 s/km mais rápido que a meta; Tempo muito fora do esperado para a distância e pace.
   - Se o campo não aparece na foto, julgue só pelo digitado contra a meta e diga no motivo que não aparece na foto.
   - Se o aluno deixou o campo vazio, use o valor da foto para julgar a meta e diga no motivo que ele não preencheu.
3. Por último, o item "Tipo de treino": compare o tipo de treino da foto com o planejado (ex.: tiros intervalados, contínuo, regenerativo, longão).
   - Use os parciais/voltas, o gráfico de ritmo ou o nome da atividade, se aparecerem. Tiros aparecem como voltas alternando rápido e lento; contínuo tem ritmo parecido do começo ao fim.
   - ERRADO só quando a foto mostra claramente outro tipo de treino. valorFoto = o tipo visto na foto (ex.: "contínuo").
   - Se a foto não deixa ver o tipo, marque CERTO, valorFoto = null e motivo "a foto não mostra o tipo de treino".
4. fotoValida = false se a foto não for de um relógio/app de corrida. Nesse caso todos os itens ficam ERRADO com motivo "foto não é do relógio ou do Strava".
5. veredito = CERTO só se todos os itens estiverem CERTO.
6. "motivo": curto (até 12 palavras), português simples e direto. Ex.: "digitou 6,5 km, mas a foto mostra 5,2 km".
7. "mensagem": sua avaliação para o aluno, com 1 a 3 frases curtas. Tom sério e profissional de treinador. Trate o aluno por "você". Sem gírias, sem piadas, sem emojis, sem exclamações exageradas.
   - Se veredito = CERTO: diga que ele fez o treino certo e dê os parabéns. Ex.: "Você fez o treino certo: 6 km no pace 6:00, como planejado. Parabéns, continue assim."
   - Se veredito = ERRADO: diga que ele fez errado e explique exatamente o que corrigir. Ex.: "Você fez treino contínuo, mas o planejado era tiros intervalados. Na próxima, siga o plano." ou "Você correu 5,2 km, mas o plano era 6 km. Na próxima, complete a distância."`;

export type RespostaRobo = { ok: true; resultado: Resultado } | { ok: false; erro: string };

export async function conferirComRobo(meta: Meta, dados: Dados, foto: string): Promise<RespostaRobo> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, erro: "A avaliação está sem configuração. Avise o professor." };

  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });

  const texto = `TREINO DO PROFESSOR: ${meta.titulo} — ${meta.km} km, tempo ${meta.tempo}, pace ${meta.pace}/km. Descrição: ${meta.dica}
O QUE O ALUNO DIGITOU: Km "${dados.km}", Tempo "${dados.tempo}", Pace "${dados.pace}".
Confira com a foto abaixo.`;

  let erroStream: unknown = null;
  try {
    const result = streamText({
      model: provider.responses(MODELO),
      instructions: INSTRUCOES,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: texto },
            { type: "image", image: new URL(foto) },
          ],
        },
      ],
      output: Output.object({ schema: ESQUEMA }),
      onError: ({ error }) => {
        erroStream = error;
      },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    // Consome o stream até o fim e pega o resultado final.
    for await (const _ of result.textStream) void _;
    const resultado = await result.output;
    if (!resultado || !Array.isArray(resultado.itens)) {
      return { ok: false, erro: "Não consegui ler a foto. Envie de novo." };
    }
    return { ok: true, resultado };
  } catch (error) {
    const e = erroStream ?? error;
    console.error("Boneco Mágico falhou:", e);
    if (NoObjectGeneratedError.isInstance(error)) {
      return { ok: false, erro: "Não consegui ler os números da foto. Envie uma foto mais nítida." };
    }
    if (APICallError.isInstance(e)) {
      if (e.statusCode === 429) return { ok: false, erro: "Muitas avaliações agora. Aguarde 1 minuto e tente de novo." };
      if (e.statusCode === 402) return { ok: false, erro: "A avaliação está sem créditos. Avise o professor." };
      return { ok: false, erro: `Não foi possível avaliar (${e.statusCode ?? "erro"}). Tente de novo daqui a pouco.` };
    }
    return { ok: false, erro: "Não foi possível avaliar. Tente de novo daqui a pouco." };
  }
}
