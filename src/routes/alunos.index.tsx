import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlunos } from "@/lib/armazenamento";
import { numeroValido } from "@/lib/envios";

export const Route = createFileRoute("/alunos/")({
  head: () => ({
    meta: [
      { title: "Alunos — GM Assessoria Esportiva" },
      { name: "description", content: "Lista de alunos da GM Assessoria Esportiva." },
      { property: "og:title", content: "Alunos — GM Assessoria Esportiva" },
      { property: "og:description", content: "Lista de alunos da GM Assessoria Esportiva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alunos,
});

function Alunos() {
  const [alunos, setAlunos, ok] = useAlunos();
  const [nome, setNome] = useState("");
  const [zap, setZap] = useState("");

  function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    const n = nome.trim().slice(0, 50);
    if (!n) return toast.error("Coloque o nome do aluno.");
    if (!numeroValido(zap)) return toast.error("Número inválido. Ex.: 71 98888-7777");
    if (!setAlunos([...alunos, { id: crypto.randomUUID(), nome: n, whatsapp: zap.trim() }])) return toast.error("Não deu pra salvar.");
    setNome("");
    setZap("");
    toast.success("Aluno cadastrado!");
  }

  function apagar(id: string, n: string) {
    if (confirm(`Apagar ${n}?`)) setAlunos(alunos.filter((a) => a.id !== id));
  }

  return (
    <main className="mx-auto max-w-md">
      <TopoPagina titulo={<>MEUS <span className="text-primary">ALUNOS</span></>} subtitulo="Toque no nome para abrir os treinos" />
      <div className="space-y-5 px-5">
        <ul className="space-y-2">
          {ok && alunos.length === 0 ? <li className="text-muted-foreground">Nenhum aluno ainda. Cadastre abaixo.</li> : null}
          {alunos.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-2xl bg-paper text-paper-foreground">
              <Link to="/alunos/$id" params={{ id: a.id }} className="flex flex-1 items-center justify-between p-4">
                <span>
                  <span className="block text-lg font-bold">{a.nome}</span>
                  <span className="text-sm text-paper-muted">{a.whatsapp}</span>
                </span>
                <ChevronRight />
              </Link>
              <button type="button" aria-label={`Apagar ${a.nome}`} onClick={() => apagar(a.id, a.nome)} className="p-4 text-destructive">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={cadastrar} className="space-y-3 rounded-2xl bg-secondary p-4">
          <p className="font-display text-2xl text-secondary-foreground">CADASTRAR ALUNO</p>
          <div className="space-y-1">
            <Label htmlFor="nome">NOME</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="zap">NÚMERO DO WHATSAPP</Label>
            <Input id="zap" inputMode="tel" placeholder="71 98888-7777" value={zap} onChange={(e) => setZap(e.target.value)} className="h-12" />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full"><UserPlus /> CADASTRAR</Button>
        </form>
      </div>
    </main>
  );
}
