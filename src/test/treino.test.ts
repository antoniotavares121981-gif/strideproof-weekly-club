import { describe, expect, it } from "vitest";
import { PLANO_PADRAO, mensagemEnvioAluno, planoValido } from "@/lib/treino";

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
});
