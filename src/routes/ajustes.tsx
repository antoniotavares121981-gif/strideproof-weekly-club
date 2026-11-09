import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHAVES, useGuardado } from "@/lib/armazenamento";
import { PROFESSOR_PADRAO } from "@/lib/envios";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes — Circuito Jaua" },
      { name: "description", content: "Nome do aluno no Circuito Jaua." },
      { property: "og:title", content: "Ajustes — Circuito Jaua" },
      { property: "og:description", content: "Nome do aluno no Circuito Jaua." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajustes,
});

function Ajustes() {
  const navigate = useNavigate();
  const [nome, setNome, nomeOk] = useGuardado<string>(CHAVES.nome, "Luiz");
  const [nomeTmp, setNomeTmp] = useState("");

  useEffect(() => {
    if (nomeOk) setNomeTmp(nome);
  }, [nomeOk, nome]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setNome(nomeTmp.trim().slice(0, 40) || "Aluno");
    toast.success("Pronto, guardado!");
    navigate({ to: "/" });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md pb-10">
      <TopoPagina voltarPara="/" titulo="AJUSTES" />
      <form onSubmit={salvar} className="space-y-6 px-5">
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-base">
            Nome do aluno
          </Label>
          <Input id="nome" value={nomeTmp} onChange={(e) => setNomeTmp(e.target.value)} className="h-14 text-lg" />
        </div>
        <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
          <p className="text-sm font-semibold">WhatsApp do professor</p>
          <p className="font-display text-2xl">{PROFESSOR_PADRAO}</p>
          <p className="text-sm text-muted-foreground">O botão "Mandar pro professor" abre direto esse número.</p>
        </div>
        <Button type="submit" variant="hero" size="xl">
          SALVAR
        </Button>
      </form>
    </main>
  );
}
