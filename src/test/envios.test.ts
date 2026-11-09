import { describe, expect, it } from "vitest";

import { linkProfessor, montarMensagem, podeCorrigir, type EnvioDia, type Tentativa } from "@/lib/envios";
import { DIAS } from "@/lib/plano";

function tentativa(veredito: "CERTO" | "ERRADO", km: string): Tentativa {
  return {
    dados: { km, tempo: "36:00", pace: "6:00", fc: "148", sentiu: "bem", comentario: "" },
    foto: "data:image/jpeg;base64,AAAA",
    resultado: {
      veredito,
      fotoValida: true,
      itens: [{ campo: "Km", valorFoto: "6,0", status: veredito, motivo: veredito === "ERRADO" ? "km não bate" : "ok" }],
      mensagem: "",
    },
    em: "2026-11-09T10:00:00Z",
  };
}

describe("correção do treino", () => {
  it("deixa corrigir quando o robô disse ERRADO e ainda não corrigiu", () => {
    expect(podeCorrigir({ antes: tentativa("ERRADO", "8") })).toBe(true);
  });

  it("não deixa corrigir uma segunda vez", () => {
    expect(podeCorrigir({ antes: tentativa("ERRADO", "8"), depois: tentativa("ERRADO", "7") })).toBe(false);
  });

  it("não precisa corrigir quando o robô disse CERTO", () => {
    expect(podeCorrigir({ antes: tentativa("CERTO", "6") })).toBe(false);
  });
});

describe("mensagem pro professor", () => {
  const meta = DIAS[0]!.meta;

  it("depois da correção mostra o ANTES e o DEPOIS", () => {
    const envio: EnvioDia = { antes: tentativa("ERRADO", "8"), depois: tentativa("CERTO", "6") };
    const msg = montarMensagem({ nomeAluno: "Luiz", diaNome: "Segunda", data: "09/11", meta, envio });
    expect(msg).toContain("*ANTES:*");
    expect(msg).toContain("*DEPOIS:*");
    expect(msg.indexOf("Km: 8")).toBeLessThan(msg.indexOf("Km: 6"));
  });

  it("sem correção não fala em antes e depois", () => {
    const msg = montarMensagem({ nomeAluno: "Luiz", diaNome: "Segunda", data: "09/11", meta, envio: { antes: tentativa("CERTO", "6") } });
    expect(msg).not.toContain("ANTES");
  });

  it("o botão sempre abre o WhatsApp do professor 71 99676-9048", () => {
    expect(linkProfessor("oi")).toBe("https://wa.me/5571996769048?text=oi");
  });

  it("a mensagem pro professor não tem emoji nem acento", () => {
    const envio: EnvioDia = { antes: tentativa("ERRADO", "8"), depois: tentativa("CERTO", "6") };
    const msg = montarMensagem({ nomeAluno: "João 🔥", diaNome: "Sábado", data: "14/11", meta, envio });
    expect(msg).toMatch(/^[\x20-\x7E\n]+$/);
    expect(msg).toContain("Aluno: *Joao*");
    expect(msg).toContain("Sabado");
  });

  it("o link sai só com letras e números simples", () => {
    expect(linkProfessor("Treino ✅ certo")).toBe("https://wa.me/5571996769048?text=Treino%20certo");
  });
});
