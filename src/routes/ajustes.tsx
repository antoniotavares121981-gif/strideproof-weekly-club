import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHAVES, useGuardado } from "@/lib/armazenamento";
import { PROFESSOR_PADRAO, limparNumero, numeroDoProfessor } from "@/lib/envios";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes — Circuito Jaua" },
      { name: "description", content: "Nome do aluno e WhatsApp do professor no Circuito Jaua." },
      { property: "og:title", content: "Ajustes — Circuito Jaua" },
      { property: "og:description", content: "Nome do aluno e WhatsApp do professor no Circuito Jaua." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajustes,
});

function Ajustes() {
  const navigate = useNavigate();
  const [nome, setNome, nomeOk] = useGuardado<string>(CHAVES.nome, "Luiz");
  const [prof, setProf, profOk] = useGuardado<string>(CHAVES.professor, PROFESSOR_PADRAO);
  const [nomeTmp, setNomeTmp] = useState("");
  const [profTmp, setProfTmp] = useState("");

  useEffect(() => {
    if (nomeOk) setNomeTmp(nome);
  }, [nomeOk, nome]);
  useEffect(() => {
    if (profOk) setProfTmp(numeroDoProfessor(prof));
  }, [profOk, prof]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const numero = limparNumero(profTmp);
    if (profTmp && numero.length < 12) {
      toast.error("Confere o número do professor: DDD + número.");
      return;
    }
    setNome(nomeTmp.trim().slice(0, 40) || "Aluno");
    setProf(profTmp.trim());
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
        <div className="space-y-2">
          <Label htmlFor="prof" className="text-base">
            WhatsApp do professor
          </Label>
          <Input
            id="prof"
            inputMode="tel"
            placeholder="71 99999-9999"
            value={profTmp}
            onChange={(e) => setProfTmp(e.target.value)}
            className="h-14 text-lg"
          />
          <p className="text-sm text-muted-foreground">É pra esse número que o treino vai quando aperta "Mandar pro professor".</p>
        </div>
        <Button type="submit" variant="hero" size="xl">
          SALVAR
        </Button>
      </form>
    </main>
  );
}
