import { describe, expect, it } from "vitest";
import { PLANO_PADRAO, mensagemEnvioAluno, planoValido } from "@/lib/treino";
import { linkAluno } from "@/lib/envios";

describe("treino da semana", () => {
  it("plano tem exatamente 3 dias com distância e pace", () => {
    expect(planoValido(PLANO_PADRAO)).toBe(true);
    expect(planoValido(PLANO_PADRAO.slice(0, 2))).toBe(false);
    expect(planoValido(PLANO_PADRAO.map((d, i) => (i === 0 ? { ...d, pace: "rapido" } : d)))).toBe(false);
  });
  it("mensagem pro aluno tem os 3 dias e o link dele", () => {
    const m = mensagemEnvioAluno("Luiz", "https://x.app/a/abc", PLANO_PADRAO);
    expect(m).toContain("SEGUNDA* - 4 km a 4:59 /km");
    expect(m).toContain("SEXTA* - 10 km a 5:50 /km");
    expect(m).toContain("https://x.app/a/abc");
  });
  it("abre somente wa.me com número brasileiro e mensagem pronta", () => {
    const mensagem = mensagemEnvioAluno("José", "https://x.app/a/abc", PLANO_PADRAO);
    const url = new URL(linkAluno("71 98888-7777", mensagem));
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/5571988887777");
    expect([...url.searchParams.keys()]).toEqual(["text"]);
    expect(url.searchParams.get("text")).toBe(mensagem);
    expect(mensagem.split("\n")[0]).toBe("Olá, José! Seu treino da semana chegou!");
  });
  it("mantém segunda quarta e sexta com as metas fornecidas", () => {
    expect(PLANO_PADRAO.map(({ dia, km, pace }) => ({ dia, km, pace }))).toEqual([
      { dia: "SEGUNDA", km: "4", pace: "4:59" },
      { dia: "QUARTA", km: "7", pace: "6:00" },
      { dia: "SEXTA", km: "10", pace: "5:50" },
    ]);
  });
});
