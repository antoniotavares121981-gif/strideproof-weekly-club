import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apagarAluno, criarAluno, listarAlunos } from "@/lib/assessoria.functions";
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
  const qc = useQueryClient();
  const listar = useServerFn(listarAlunos);
  const criar = useServerFn(criarAluno);
  const apagar = useServerFn(apagarAluno);
  const { data: alunos, isLoading } = useQuery({ queryKey: ["alunos"], queryFn: () => listar() });
  const [f, setF] = useState({ nome: "", whatsapp: "", objetivo: "" });

  const cadastro = useMutation({
    mutationFn: () => criar({ data: f }),
    onSuccess: () => { setF({ nome: "", whatsapp: "", objetivo: "" }); toast.success("Aluno cadastrado!"); qc.invalidateQueries({ queryKey: ["alunos"] }); },
    onError: () => toast.error("Não deu pra salvar. Tente de novo."),
  });

  function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome.trim()) { toast.error("Coloque o nome do aluno."); return; }
    if (!numeroValido(f.whatsapp)) { toast.error("Número inválido. Ex.: 71 98888-7777"); return; }
    cadastro.mutate();
  }

  async function remover(id: string, n: string) {
    if (!confirm(`Apagar ${n}?`)) return;
    await apagar({ data: { id } });
    qc.invalidateQueries({ queryKey: ["alunos"] });
  }

  return (
    <main className="mx-auto max-w-md">
      <TopoPagina titulo={<>MEUS <span className="text-primary">ALUNOS</span></>} subtitulo="Toque no nome para abrir a tela do aluno" />
      <div className="space-y-5 px-5">
        <ul className="space-y-2">
          {isLoading ? <li className="text-muted-foreground">Carregando...</li> : null}
          {alunos && alunos.length === 0 ? <li className="text-muted-foreground">Nenhum aluno ainda. Cadastre abaixo.</li> : null}
          {alunos?.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-2xl bg-paper text-paper-foreground">
              <Link to="/alunos/$id" params={{ id: a.id }} className="flex flex-1 items-center justify-between p-4">
                <span>
                  <span className="block text-lg font-bold">{a.nome}</span>
                  <span className="block text-sm text-paper-muted">{a.whatsapp}{a.objetivo ? ` - ${a.objetivo}` : ""}</span>
                </span>
                <ChevronRight />
              </Link>
              <button type="button" aria-label={`Apagar ${a.nome}`} onClick={() => remover(a.id, a.nome)} className="p-4 text-destructive">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={cadastrar} className="space-y-3 rounded-2xl bg-secondary p-4">
          <p className="font-display text-2xl text-secondary-foreground">CADASTRAR ALUNO</p>
          <div className="space-y-1">
            <Label htmlFor="nome">NOME</Label>
            <Input id="nome" maxLength={50} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className="h-12" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="zap">NÚMERO DO WHATSAPP</Label>
            <Input id="zap" inputMode="tel" placeholder="71 98888-7777" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} className="h-12" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="obj">OBJETIVO</Label>
            <Input id="obj" maxLength={120} placeholder="Ex.: correr 10 km" value={f.objetivo} onChange={(e) => setF({ ...f, objetivo: e.target.value })} className="h-12" />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={cadastro.isPending}><UserPlus /> CADASTRAR</Button>
        </form>
      </div>
    </main>
  );
}
