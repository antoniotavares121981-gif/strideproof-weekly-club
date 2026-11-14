import { describe, expect, it } from "vitest";
import { avaliacaoLiberada, horarioLiberacao, moverSemana, semanaAtual } from "@/lib/semanas";

describe("semanas e liberação pelo professor", () => {
  it("vira a semana na segunda à meia-noite da Bahia", () => {
    expect(semanaAtual(new Date("2026-11-16T02:59:59Z"))).toBe("2026-11-09");
    expect(semanaAtual(new Date("2026-11-16T03:00:00Z"))).toBe("2026-11-16");
  });
  it("navega por semanas sem misturar dias", () => {
    expect(moverSemana("2026-11-09", 1)).toBe("2026-11-16");
    expect(moverSemana("2026-11-09", -1)).toBe("2026-11-02");
  });
  it("espera exatamente 2 minutos após revisão", () => {
    expect(horarioLiberacao(new Date("2026-11-14T01:00:00Z"))).toBe("2026-11-14T01:02:00.000Z");
  });
  it("oculta avaliação até o professor revisar", () => {
    expect(avaliacaoLiberada({ liberar_em: "2026-11-14T01:00:00Z" }, new Date("2026-11-14T02:00:00Z"))).toBe(false);
  });
  it("oculta antes do prazo e libera depois dele", () => {
    const f = { revisado_em: "2026-11-14T01:00:00Z", liberar_em: "2026-11-14T01:02:00Z" };
    expect(avaliacaoLiberada(f, new Date("2026-11-14T01:01:59Z"))).toBe(false);
    expect(avaliacaoLiberada(f, new Date("2026-11-14T01:02:00Z"))).toBe(true);
  });
  it("cancelar mantém avaliação oculta após o prazo", () => {
    expect(avaliacaoLiberada({ revisado_em: "2026-11-14T01:00:00Z", liberar_em: "2026-11-14T01:02:00Z", envio_cancelado: true }, new Date("2026-11-14T02:00:00Z"))).toBe(false);
  });
});