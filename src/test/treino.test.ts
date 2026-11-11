import { describe, expect, it } from "vitest";
import { PLANO_PADRAO, completarSemana, resumoDia, mensagemEnvioAluno, planoValido } from "@/lib/treino";
import { linkAluno } from "@/lib/envios";

describe("treino da semana", () => {
  const T: Record<string, string> = { SEGUNDA: "20min", QUARTA: "42min", SEXTA: "58min" };
  const planoComTempo = PLANO_PADRAO.map((d) => ({ ...d, tempo: T[d.dia] ?? "" }));
  it("plano tem sempre 7 dias; dia vazio é descanso", () => {
    expect(planoValido(planoComTempo)).toBe(true);
    expect(planoValido(PLANO_PADRAO)).toBe(false);
    expect(planoValido(planoComTempo.slice(0, 3))).toBe(false);
    expect(planoComTempo.map((d) => d.dia)).toEqual(["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"]);
    expect(planoValido(PLANO_PADRAO.map((d, i) => (i === 0 ? { ...d, pace: "rapido" } : d)))).toBe(false);
  });
  it("envia distância, tempo e ritmo dos três dias sem alterar a saudação", () => {
    const mensagem = mensagemEnvioAluno("José", "https://x.app/a/abc", planoComTempo);
    const url = new URL(linkAluno("71 98888-7777", mensagem));
    expect(url.searchParams.get("text")).toBe(mensagem);
    expect(mensagem.split("\n")[0]).toBe("Olá, José! Seu treino da semana chegou!");
    expect(mensagem).toContain("*SEGUNDA* - 4 km - 20min a 4:59 /km");
    expect(mensagem).toContain("*QUARTA* - 7 km - 42min a 6:00 /km");
    expect(mensagem).toContain("*SEXTA* - 10 km - 58min a 5:50 /km");
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
    expect(PLANO_PADRAO.filter((d) => d.km).map(({ dia, km, pace }) => ({ dia, km, pace }))).toEqual([
      { dia: "SEGUNDA", km: "4", pace: "4:59" },
      { dia: "QUARTA", km: "7", pace: "6:00" },
      { dia: "SEXTA", km: "10", pace: "5:50" },
    ]);
  });
  it("plano antigo de 3 dias vira semana de 7 com descanso", () => {
    const s = completarSemana([{ dia: "QUARTA", km: "7", tempo: "40min", pace: "6:00", detalhes: "" }]);
    expect(s).toHaveLength(7);
    expect(s[2].km).toBe("7");
    expect(resumoDia(s[1])).toBe("Descanso");
  });
});
