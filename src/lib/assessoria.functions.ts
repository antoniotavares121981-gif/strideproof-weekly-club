import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { avaliarHermes } from "./envios";
import { avaliacaoLiberada, horarioLiberacao, semanaAtual } from "./semanas";
import { completarSemana, diasPreenchidos, diaVazio, erroPlano, type AvaliacaoSalva, type DiaPlano, type Feito } from "./treino";

const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const diaSchema = z.object({
  dia: z.string().min(1).max(20),
  tipo: z.string().trim().max(60).optional(),
  km: z.string().max(10),
  tempo: z.string().trim().max(20),
  pace: z.string().trim().max(20),
  detalhes: z.string().max(500),
  descanso: z.boolean().optional(),
});

const semanaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => { const d = new Date(`${v}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && d.getUTCDay() === 1; }, "Semana inválida.");
const escolhaSemana = { semana: semanaSchema.optional() };

// ---------- Professor ----------

export const verProfessor = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("professor").select("nome, whatsapp").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? { nome: "", whatsapp: "" };
});

export const salvarProfessor = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ nome: z.string().trim().min(1).max(60), whatsapp: z.string().trim().min(10).max(20) }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("professor").upsert({ id: 1, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
  .validator((i: unknown) => z.object({ id: z.string().uuid(), codigo: z.string().min(8).max(200) }).parse(i))
  .handler(async ({ data }) => {
    const esperado = process.env["PROFESSOR_ACTION_CODE"];
    if (!esperado || data.codigo !== esperado) throw new Error("Código do professor inválido ou não configurado.");
    const { error } = await (await db()).from("alunos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verAluno = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), ...escolhaSemana }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: a, error } = await sb.from("alunos").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) return null;
    const semana = data.semana ?? semanaAtual();
    const { data: s, error: es } = await sb.from("semanas_aluno").select("*").eq("aluno_id", a.id).eq("semana", semana).maybeSingle();
    if (es) throw new Error(es.message);
    const { data: historico, error: eh } = await sb.from("semanas_aluno").select("semana, tema").eq("aluno_id", a.id).order("semana", { ascending: false });
    if (eh) throw new Error(eh.message);
    const { data: f, error: e2 } = await sb.from("treinos_feitos").select("*").eq("aluno_id", a.id).eq("semana", semana).order("created_at", { ascending: false });
    if (e2) throw new Error(e2.message);
    return {
      aluno: { id: a.id, nome: a.nome, whatsapp: a.whatsapp, objetivo: a.objetivo, token: a.token, enviado_em: a.enviado_em },
      semana, atual: semanaAtual(), tema: s?.tema ?? "", historico: historico ?? [],
      rascunho: completarSemana(s?.rascunho as unknown as DiaPlano[]),
      enviado: s?.plano_enviado ? completarSemana(s.plano_enviado as unknown as DiaPlano[]) : null,
      feitos: (f ?? []) as unknown as Feito[],
    };
  });

export const salvarRascunho = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), plano: z.array(diaSchema).length(7), tema: z.string().trim().max(120).default(""), ...escolhaSemana }).parse(i))
  .handler(async ({ data }) => {
    const aviso = erroPlano(data.plano);
    if (aviso) throw new Error(aviso);
    const { error } = await (await db()).from("semanas_aluno").upsert({ aluno_id: data.id, semana: data.semana ?? semanaAtual(), tema: data.tema, rascunho: diasPreenchidos(data.plano) }, { onConflict: "aluno_id,semana" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Só aqui o aluno passa a ver o treino. */
export const enviarPlano = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), plano: z.array(diaSchema).length(7), tema: z.string().trim().max(120).default(""), ...escolhaSemana }).parse(i))
  .handler(async ({ data }) => {
    const aviso = erroPlano(data.plano);
    if (aviso) throw new Error(aviso);
    const plano = diasPreenchidos(data.plano);
    const { error } = await (await db())
      .from("semanas_aluno")
      .upsert({ aluno_id: data.id, semana: data.semana ?? semanaAtual(), tema: data.tema, rascunho: plano, plano_enviado: plano, enviado_em: new Date().toISOString() }, { onConflict: "aluno_id,semana" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Aluno (pelo link próprio) ----------

const tokenSchema = z.string().regex(/^[a-f0-9]{24}$/);

export const treinoDoAluno = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ token: tokenSchema, ...escolhaSemana }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: a, error } = await sb.from("alunos").select("id, nome, objetivo").eq("token", data.token).maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) return null;
    const semana = data.semana ?? semanaAtual();
    const { data: s, error: es } = await sb.from("semanas_aluno").select("*").eq("aluno_id", a.id).eq("semana", semana).maybeSingle();
    if (es) throw new Error(es.message);
    const { data: h, error: eh } = await sb.from("semanas_aluno").select("semana, tema").eq("aluno_id", a.id).not("plano_enviado", "is", null).order("semana", { ascending: false });
    if (eh) throw new Error(eh.message);
    const { data: f, error: ef } = await sb.from("treinos_feitos").select("id, dia_index, dia, km, tempo, pace, created_at, avaliacao, semana, revisado_em, liberar_em, envio_cancelado, onde_errei, onde_acertei").eq("aluno_id", a.id).eq("semana", semana).order("created_at", { ascending: false });
    if (ef) throw new Error(ef.message);
    // Never serialize a held evaluation to the student's browser.
    const feitos = (f ?? []).map((x) => ({ ...x, avaliacao: avaliacaoLiberada(x) ? x.avaliacao : null }));
    return { nome: a.nome, objetivo: a.objetivo, semana, atual: semanaAtual(), tema: s?.plano_enviado ? s.tema : "", historico: h ?? [], enviado_em: s?.enviado_em ?? null, plano: completarSemana(s?.plano_enviado as unknown as DiaPlano[]), feitos: feitos as unknown as Omit<Feito, "foto">[] };
  });

export const enviarFeito = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        token: tokenSchema,
        ...escolhaSemana,
        dia_index: z.number().int().min(0).max(6),
        km: z.string().trim().min(1).max(10),
        tempo: z.string().trim().min(1).max(10),
        pace: z.string().trim().max(10),
        foto: z.string().startsWith("data:image/").max(1_500_000).nullable(),
        onde_errei: z.string().trim().max(1000).default(""),
        onde_acertei: z.string().trim().max(1000).default(""),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: a, error: ea } = await sb.from("alunos").select("id, nome").eq("token", data.token).maybeSingle();
    if (ea) throw new Error(ea.message);
    if (!a) throw new Error("Aluno não encontrado.");
    const semana = data.semana ?? semanaAtual();
    if (semana !== semanaAtual()) throw new Error("Registre o treino na semana atual.");
    const { data: s, error: es } = await sb.from("semanas_aluno").select("plano_enviado").eq("aluno_id", a.id).eq("semana", semana).maybeSingle();
    if (es) throw new Error(es.message);
    const plano = s?.plano_enviado ? completarSemana(s.plano_enviado as unknown as DiaPlano[]) : null;
    const diaPlano = plano?.[data.dia_index];
    if (!a || !diaPlano || diaPlano.descanso || diaVazio(diaPlano)) throw new Error("Treino não encontrado.");
    const em = new Date().toISOString();
    const avaliacao: AvaliacaoSalva = {
      ...avaliarHermes(
        { tipo: "", km: Number(diaPlano.km.replace(",", ".")), tempo: diaPlano.tempo ?? "", paceMin: diaPlano.pace, paceMax: diaPlano.pace, detalhes: diaPlano.detalhes },
        { km: data.km, tempo: data.tempo, pace: data.pace, em },
        a.nome,
      ),
      em,
    };
    // Uma gravação disponibiliza o treino e a mesma avaliação nos dois lados.
    const { error } = await sb.from("treinos_feitos").insert({
      aluno_id: a.id, semana, dia_index: data.dia_index, dia: diaPlano.dia, km: data.km, tempo: data.tempo, pace: data.pace, foto: data.foto, onde_errei: data.onde_errei, onde_acertei: data.onde_acertei,
      avaliacao: avaliacao as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revisarHermes = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), acao: z.enum(["avaliar", "agora", "cancelar"]) }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: f, error: ef } = await sb.from("treinos_feitos").select("id, avaliacao, revisado_em").eq("id", data.id).maybeSingle();
    if (ef) throw new Error(ef.message);
    if (!f?.avaliacao) throw new Error("Avaliação não encontrada.");
    const agora = new Date();
    const alteracao = data.acao === "cancelar" ? { envio_cancelado: true, liberar_em: null } : { revisado_em: f.revisado_em ?? agora.toISOString(), liberar_em: data.acao === "agora" ? agora.toISOString() : horarioLiberacao(agora), envio_cancelado: false };
    const { error } = await sb.from("treinos_feitos").update(alteracao).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirTreino = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), token: tokenSchema.optional(), codigo: z.string().min(8).max(200).optional() }).parse(i))
  .handler(async ({ data }) => {
    const sb = await db();
    let alunoId: string | undefined;
    if (data.token) {
      const { data: a, error } = await sb.from("alunos").select("id").eq("token", data.token).maybeSingle();
      if (error) throw new Error(error.message);
      if (!a) throw new Error("Link inválido.");
      alunoId = a.id;
    } else {
      const esperado = process.env["PROFESSOR_ACTION_CODE"];
      if (!esperado || data.codigo !== esperado) throw new Error("Código do professor inválido ou não configurado.");
    }
    let q = sb.from("treinos_feitos").delete().eq("id", data.id);
    if (alunoId) q = q.eq("aluno_id", alunoId);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const limparSemana = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ id: z.string().uuid(), semana: semanaSchema, codigo: z.string().min(8).max(200) }).parse(i))
  .handler(async ({ data }) => {
    const esperado = process.env["PROFESSOR_ACTION_CODE"];
    if (!esperado || data.codigo !== esperado) throw new Error("Código do professor inválido ou não configurado.");
    const { error } = await (await db()).from("treinos_feitos").delete().eq("aluno_id", data.id).eq("semana", data.semana);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
