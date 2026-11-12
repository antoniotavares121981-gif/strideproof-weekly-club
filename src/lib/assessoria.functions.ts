import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { avaliarHermes } from "./envios";
import { completarSemana, diasPreenchidos, diaVazio, erroPlano, type AvaliacaoSalva, type DiaPlano, type Feito } from "./treino";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const diaSchema = z.object({
  dia: z.string().min(1).max(20),
  km: z.string().max(10),
  tempo: z.string().trim().max(20),
  pace: z.string().trim().max(20),
  detalhes: z.string().max(500),
  descanso: z.boolean().optional(),
});

// ---------- Professor ----------

export const listarAlunos = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("alunos").select("id, nome, whatsapp, objetivo, enviado_em").order("nome");
  if (error) throw new Error(error.message);
  return data;
});

export const criarAluno = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ nome: z.string().trim().min(1).max(50), whatsapp: z.string().trim().min(10).max(20), objetivo: z.string().trim().max(120) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("alunos").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const apagarAluno = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("alunos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verAluno = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: a, error } = await sb.from("alunos").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) return null;
    const { data: f, error: e2 } = await sb.from("treinos_feitos").select("*").eq("aluno_id", a.id).order("created_at", { ascending: false }).limit(30);
    if (e2) throw new Error(e2.message);
    return {
      aluno: { id: a.id, nome: a.nome, whatsapp: a.whatsapp, objetivo: a.objetivo, token: a.token, enviado_em: a.enviado_em },
      rascunho: completarSemana(a.rascunho as unknown as DiaPlano[]),
      enviado: a.plano_enviado ? completarSemana(a.plano_enviado as unknown as DiaPlano[]) : null,
      feitos: (f ?? []) as unknown as Feito[],
    };
  });

export const salvarRascunho = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), plano: z.array(diaSchema).length(7) }).parse(i))
  .handler(async ({ data }) => {
    const aviso = erroPlano(data.plano);
    if (aviso) throw new Error(aviso);
    const { error } = await (await db()).from("alunos").update({ rascunho: diasPreenchidos(data.plano) }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Só aqui o aluno passa a ver o treino. */
export const enviarPlano = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), plano: z.array(diaSchema).length(7) }).parse(i))
  .handler(async ({ data }) => {
    const aviso = erroPlano(data.plano);
    if (aviso) throw new Error(aviso);
    const plano = diasPreenchidos(data.plano);
    const { error } = await (await db())
      .from("alunos")
      .update({ rascunho: plano, plano_enviado: plano, enviado_em: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Aluno (pelo link próprio) ----------

const tokenSchema = z.string().regex(/^[a-f0-9]{24}$/);

export const treinoDoAluno = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ token: tokenSchema }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: a, error } = await sb.from("alunos").select("id, nome, objetivo, plano_enviado, enviado_em").eq("token", data.token).maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) return null;
    const { data: f } = await sb.from("treinos_feitos").select("id, dia_index, dia, km, tempo, pace, created_at, avaliacao").eq("aluno_id", a.id).order("created_at", { ascending: false }).limit(20);
    return { nome: a.nome, objetivo: a.objetivo, enviado_em: a.enviado_em, plano: a.plano_enviado ? completarSemana(a.plano_enviado as unknown as DiaPlano[]) : null, feitos: (f ?? []) as unknown as Omit<Feito, "foto">[] };
  });

export const enviarFeito = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        token: tokenSchema,
        dia_index: z.number().int().min(0).max(6),
        km: z.string().trim().min(1).max(10),
        tempo: z.string().trim().min(1).max(10),
        pace: z.string().trim().max(10),
        foto: z.string().startsWith("data:image/").max(1_500_000).nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: a } = await sb.from("alunos").select("id, plano_enviado").eq("token", data.token).maybeSingle();
    const plano = a?.plano_enviado ? completarSemana(a.plano_enviado as unknown as DiaPlano[]) : null;
    const diaPlano = plano?.[data.dia_index];
    if (!a || !diaPlano || diaPlano.descanso || diaVazio(diaPlano)) throw new Error("Treino não encontrado.");
    const { error } = await sb.from("treinos_feitos").insert({
      aluno_id: a.id, dia_index: data.dia_index, dia: diaPlano.dia, km: data.km, tempo: data.tempo, pace: data.pace, foto: data.foto,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Professor aperta o Hermes: a avaliação fica salva no treino e o aluno vê a mesma. */
export const avaliarTreino = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: f, error } = await sb.from("treinos_feitos").select("id, dia, km, tempo, pace, created_at, aluno_id").eq("id", data.id).maybeSingle();
    if (error || !f) throw new Error("Treino não encontrado.");
    const { data: a } = await sb.from("alunos").select("plano_enviado").eq("id", f.aluno_id).maybeSingle();
    const meta = completarSemana(a?.plano_enviado as unknown as DiaPlano[] | null).find((d) => d.dia === f.dia);
    const r = avaliarHermes(
      !meta || diaVazio(meta)
        ? { tipo: "Descanso", km: 0, tempo: "", paceMin: "", paceMax: "", detalhes: "" }
        : { tipo: "", km: Number(meta.km.replace(",", ".")), tempo: meta.tempo ?? "", paceMin: meta.pace, paceMax: meta.pace, detalhes: meta.detalhes },
      { km: f.km, tempo: f.tempo, pace: f.pace, em: f.created_at },
    );
    const avaliacao: AvaliacaoSalva = { ...r, em: new Date().toISOString() };
    const { error: e2 } = await sb.from("treinos_feitos").update({ avaliacao: avaliacao as never }).eq("id", f.id);
    if (e2) throw new Error(e2.message);
    return avaliacao;
  });
