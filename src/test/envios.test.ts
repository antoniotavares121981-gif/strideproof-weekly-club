import { describe, expect, it } from "vitest";

import { avaliarHermes, linkAluno, linkProfessor, mensagemTreinoSemana, numeroWhatsApp, paraSegundos } from "@/lib/envios";
import { DIAS, resumoMeta } from "@/lib/plano";

const seg = DIAS[0].meta;

describe("regras", () => {
  it("professor sempre 71 99676-9048", () => {
    expect(linkProfessor("oi")).toBe("https://wa.me/5571996769048?text=oi");
  });
  it("enviar para o aluno abre o número daquele aluno", () => {
    expect(numeroWhatsApp("(71) 98888-7777")).toBe("5571988887777");
    expect(linkAluno("71 98888-7777", "x").startsWith("https://wa.me/5571988887777?text=")).toBe(true);
  });
  it("mensagem do treino não tem emoji nem acento e tem os 7 dias", () => {
    const m = mensagemTreinoSemana("José");
    expect(m).toMatch(/^[\x20-\x7E\n]+$/);
    for (const d of ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]) expect(m).toContain(`*${d}*`);
  });
  it("resumo no formato 9,7 km - 1h00 - 5:48-6:34 /km", () => {
    expect(resumoMeta(seg)).toBe("9,7 km - 1h00 - 5:48-6:34 /km");
  });
  it("lê tempos", () => {
    expect(paraSegundos("1h00")).toBe(3600);
    expect(paraSegundos("58:30")).toBe(3510);
  });
  it("Hermes: dentro da faixa = sem erros", () => {
    const a = avaliarHermes(seg, { km: "9,7", tempo: "1h00", pace: "6:11", em: "" });
    expect(a.erros).toHaveLength(0);
    expect(a.texto).toContain("Aqui na GM Assessoria Esportiva, vimos que você concluiu seu treino de 60 minutos correndo 9,7 km");
  });
  it("Hermes: pace rápido demais = erro", () => {
    const a = avaliarHermes(seg, { km: "9,7", tempo: "50:00", pace: "5:09", em: "" });
    expect(a.erros.join()).toContain("mais rápido");
  });
});
