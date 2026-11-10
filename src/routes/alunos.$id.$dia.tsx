import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AvaliacaoHermes } from "@/components/Hermes";
import { TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlunos, useRegistro, useSemana } from "@/lib/armazenamento";
import { acharDia, chaveSemana, resumoMeta } from "@/lib/plano";

type Busca = { editar?: boolean };

export const Route = createFileRoute("/alunos/$id/$dia")({
  validateSearch: (s: Record<string, unknown>): Busca => (s["editar"] === true || s["editar"] === "true" ? { editar: true } : {}),
  loader: ({ params }) => {
    const dia = acharDia(params.dia);
    if (!dia) throw notFound();
    return { dia };
  },
  head: () => ({
    meta: [
      { title: "Detalhes do treino — GM Assessoria Esportiva" },
      { name: "description", content: "Detalhes e registro do treino do aluno." },
      { property: "og:title", content: "Detalhes do treino — GM Assessoria Esportiva" },
      { property: "og:description", content: "Detalhes e registro do treino do aluno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detalhe,
});

function Detalhe() {
  const { dia } = Route.useLoaderData();
  const { id } = Route.useParams();
  const { editar } = Route.useSearch();
  const navigate = useNavigate();
  const [alunos] = useAlunos();
  const aluno = alunos.find((a) => a.id === id);
  const hoje = useSemana();
  const [registro, setRegistro, ok] = useRegistro(id, hoje ? chaveSemana(hoje) : "x", dia.id);
  const [f, setF] = useState({ km: "", tempo: "", pace: "" });

  useEffect(() => {
    if (ok && registro) setF({ km: registro.km, tempo: registro.tempo, pace: registro.pace });
  }, [ok, registro]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.km || !f.tempo) { toast.error("Preencha Km e Tempo."); return; }
    if (!setRegistro({ ...f, em: new Date().toISOString() })) { toast.error("Não deu pra salvar."); return; }
    toast.success("Registro salvo!");
    navigate({ to: "/alunos/$id", params: { id } });
  }

  const m = dia.meta;
  return (
    <main className="mx-auto max-w-md">
      <TopoPagina voltar titulo={`${dia.curto.toUpperCase()} - ${m.tipo.toUpperCase()}`} subtitulo={aluno?.nome} />
      <div className="space-y-4 px-5">
        <section className="rounded-2xl bg-paper p-4 text-paper-foreground">
          <p className="text-sm font-bold text-paper-muted">TREINO PLANEJADO</p>
          <p className="text-xl font-bold">{resumoMeta(m)}</p>
          <p className="mt-2">{m.detalhes}</p>
        </section>

        {editar || !registro ? (
          <form onSubmit={salvar} className="space-y-3 rounded-2xl bg-secondary p-4">
            <p className="font-display text-2xl text-secondary-foreground">{registro ? "EDITAR REGISTRO" : "REGISTRAR TREINO FEITO"}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["km", "tempo", "pace"] as const).map((c) => (
                <div key={c} className="space-y-1">
                  <Label htmlFor={c}>{c === "km" ? "Km" : c === "tempo" ? "Tempo" : "Pace"}</Label>
                  <Input
                    id={c}
                    inputMode={c === "km" ? "decimal" : "text"}
                    placeholder={c === "km" ? "9,7" : c === "tempo" ? "1h00" : "6:11"}
                    maxLength={10}
                    value={f[c]}
                    onChange={(e) => setF({ ...f, [c]: e.target.value })}
                    className="h-12 text-lg font-semibold"
                  />
                </div>
              ))}
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full">SALVAR REGISTRO</Button>
          </form>
        ) : null}

        {registro ? <AvaliacaoHermes meta={m} registro={registro} /> : null}
      </div>
    </main>
  );
}
