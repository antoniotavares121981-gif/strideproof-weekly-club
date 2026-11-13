import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), aluno: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    validator: (validate: (input: unknown) => unknown) => ({
      handler: (handler: (args: { data: unknown }) => unknown) => (args: { data: unknown }) => handler({ data: validate(args.data) }),
    }),
    handler: (handler: unknown) => handler,
  }),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (table: string) => table === "alunos"
      ? { select: () => ({ eq: () => ({ maybeSingle: mocks.aluno }) }) }
      : { insert: mocks.insert },
  },
}));

import { enviarFeito } from "@/lib/assessoria.functions";

describe("envio com Hermes automático", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.aluno.mockResolvedValue({ data: { id: "aluno", nome: "Ana", plano_enviado: [
      { dia: "QUARTA", km: "7", tempo: "43min", pace: "6:08", detalhes: "" },
    ] } });
    mocks.insert.mockResolvedValue({ error: null });
  });

  it("salva 7 km em 43 min e pace 6:08 com a mesma avaliação entregue ao aluno", async () => {
    const resposta = await enviarFeito({ data: { token: "a".repeat(24), dia_index: 2, km: "7", tempo: "43min", pace: "6:08", foto: null } });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      aluno_id: "aluno", dia: "QUARTA", dia_index: 2, km: "7", tempo: "43min", pace: "6:08", avaliacao: resposta.avaliacao,
    }));
    expect(resposta.avaliacao.erros).toEqual([]);
    expect(resposta.avaliacao.texto).toContain("✅ Fez 7 km em 43 min, pace 6:08.");
  });

  it("não informa sucesso se o treino não puder ser salvo", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "Falha ao salvar" } });
    await expect(enviarFeito({ data: { token: "a".repeat(24), dia_index: 2, km: "7", tempo: "43min", pace: "6:08", foto: null } })).rejects.toThrow("Falha ao salvar");
  });
});