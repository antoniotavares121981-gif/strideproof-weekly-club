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
          campo: { type: "string", enum: ["Km", "Tempo", "Pace", "FC"] },
          valorFoto: { type: ["string", "null"] },
          status: { type: "string", enum: ["CERTO", "ERRADO"] },
          motivo: { type: "string" },
        },
      },
    },
    mensagem: { type: "string" },
  },
});

const INSTRUCOES = `Você é o "Robozinho" do Circuito Jaua, assistente de um professor de corrida na Bahia.
Você recebe: o treino que o professor passou, os números que o aluno digitou e uma foto (print do relógio, Garmin, Strava, etc).

Sua tarefa:
1. Leia na foto: distância (Km), tempo total, pace médio (min/km) e FC média (bpm). Se algo não aparece na foto, use valorFoto = null.
2. Para cada campo (Km, Tempo, Pace, FC), nesta ordem, diga CERTO ou ERRADO:
   - ERRADO se o número digitado não bate com a foto (tolerância: Km ±0,1; Tempo ±30 s; Pace ±5 s/km; FC ±3 bpm).
   - ERRADO se não cumpriu o treino: Km abaixo de 95% da meta; Pace mais de 15 s/km mais lento OU mais de 20 s/km mais rápido que a meta; FC média acima da FC máxima pedida; Tempo muito fora do esperado para a distância e pace.
   - Se o campo não aparece na foto, julgue só pelo digitado contra a meta e diga no motivo que não aparece na foto.
   - Se o aluno deixou o campo vazio, use o valor da foto para julgar a meta e diga no motivo que ele esqueceu de preencher.
3. fotoValida = false se a foto não for de um relógio/app de corrida. Nesse caso todos os itens ficam ERRADO com motivo "foto não é do relógio/Strava".
4. veredito = CERTO só se todos os itens estiverem CERTO.
5. "motivo": curto (até 12 palavras), em português simples. Ex.: "digitou 6,5 km mas a foto mostra 5,2 km".
6. "mensagem": 1 ou 2 frases para o aluno, animadas, jeito baiano leve ("Boa, meu rei!"), dizendo o que acertou ou o que precisa corrigir.`;

export type RespostaRobo = { ok: true; resultado: Resultado } | { ok: false; erro: string };

export async function conferirComRobo(meta: Meta, dados: Dados, foto: string): Promise<RespostaRobo> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, erro: "O robô está sem configuração. Avisa o professor." };

  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });

  const texto = `TREINO DO PROFESSOR: ${meta.titulo} — ${meta.km} km, tempo ${meta.tempo}, pace ${meta.pace}/km, FC máxima ${meta.fcMax} bpm.
O QUE O ALUNO DIGITOU: Km "${dados.km}", Tempo "${dados.tempo}", Pace "${dados.pace}", FC "${dados.fc}".
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
      return { ok: false, erro: "O robô não conseguiu ler a foto. Tenta mandar de novo." };
    }
    return { ok: true, resultado };
  } catch (error) {
    const e = erroStream ?? error;
    console.error("Robô falhou:", e);
    if (NoObjectGeneratedError.isInstance(error)) {
      return { ok: false, erro: "O robô não entendeu a foto. Tenta uma foto mais nítida." };
    }
    if (APICallError.isInstance(e)) {
      if (e.statusCode === 429) return { ok: false, erro: "O robô está ocupado agora. Espera 1 minutinho e tenta de novo." };
      if (e.statusCode === 402) return { ok: false, erro: "O robô ficou sem créditos. Avisa o professor." };
      return { ok: false, erro: `O robô teve um problema (${e.statusCode ?? "erro"}). Tenta de novo daqui a pouco.` };
    }
    return { ok: false, erro: "O robô teve um problema. Tenta de novo daqui a pouco." };
  }
}
