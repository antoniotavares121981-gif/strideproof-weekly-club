import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { AvaliacaoHermes } from "@/components/Hermes";
import { treinoDoAluno } from "@/lib/assessoria.functions";
import { resumoDia } from "@/lib/treino";

export const Route = createFileRoute("/a/$token/")({
  head: () => ({
    meta: [
      { title: "Meu treino — Assessoria de Corrida" },
      { name: "description", content: "Seu treino da semana enviado pelo professor." },
      { property: "og:title", content: "Meu treino — Assessoria de Corrida" },
      { property: "og:description", content: "Seu treino da semana enviado pelo professor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeuTreino,
});

function MeuTreino() {
  const { token } = Route.useParams();
  const buscar = useServerFn(treinoDoAluno);
  const { data, isLoading } = useQuery({ queryKey: ["meu", token], queryFn: () => buscar({ data: { token } }) });

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="p-6 text-muted-foreground">Link inválido. Peça um novo link ao professor.</p>;

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 pt-8">
      <div>
        <p className="font-display text-lg text-primary">MEU TREINO</p>
        <h1 className="text-5xl leading-none text-foreground">OLÁ, {data.nome.toUpperCase()}</h1>
        {data.objetivo ? <p className="text-muted-foreground">Objetivo: {data.objetivo}</p> : null}
      </div>
      {!data.plano ? (
        <p className="rounded-2xl bg-secondary p-4 text-secondary-foreground">O professor ainda não mandou seu treino. Aguarde.</p>
      ) : (
        <ul className="space-y-3">
          {data.plano.map((d, i) => {
            const feito = data.feitos.find((f) => f.dia === d.dia);
            return (
              <li key={i}>
                <Link to="/a/$token/$dia" params={{ token, dia: String(i) }} className="flex items-center justify-between rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
                  <span>
                    <span className="block font-display text-3xl leading-none">{d.dia}</span>
                    <span className="block text-lg font-bold">{resumoDia(d)}</span>
                    {feito ? <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground"><CheckCircle2 className="h-4 w-4" /> ENVIADO</span> : null}
                  </span>
                  <ChevronRight />
                </Link>
                {feito?.avaliacao ? <div className="mt-2"><AvaliacaoHermes avaliacao={feito.avaliacao} /></div> : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
