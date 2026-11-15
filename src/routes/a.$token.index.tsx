import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, CheckCircle2, ChevronRight, LoaderCircle } from "lucide-react";
import { linkProfessor } from "@/lib/envios";
import { SalvarTelaInicial } from "@/components/SalvarTelaInicial";
import { useState } from "react";

import { AvaliacaoHermes } from "@/components/Hermes";
import { treinoDoAluno } from "@/lib/assessoria.functions";
import { diaVazio, resumoDia } from "@/lib/treino";
import { ControleSemana } from "@/components/Semana";
import { ExcluirTreino } from "@/components/ExcluirTreino";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/a/$token/")({
  head: ({ params }) => ({
    links: [
      { rel: "manifest", href: `/api/public/manifest/${params.token}` },
      { rel: "apple-touch-icon", href: "/icone-180.png" },
    ],
    meta: [
      { title: "Meu treino — Assessoria de Corrida" },
      { name: "description", content: "Seu treino da semana enviado pelo professor." },
      { property: "og:title", content: "Meu treino — Assessoria de Corrida" },
      { property: "og:description", content: "Seu treino da semana enviado pelo professor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Meu Treino" },
    ],
  }),
  component: MeuTreino,
});

function MeuTreino() {
  const { token } = Route.useParams();
  const buscar = useServerFn(treinoDoAluno);
  const [semana, setSemana] = useState<string | undefined>();
  const { data, isLoading } = useQuery({ queryKey: ["meu", token, semana], queryFn: () => buscar({ data: { token, semana } }), refetchInterval: 1000 });


  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="p-6 text-muted-foreground">Link inválido. Peça um novo link ao professor.</p>;

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 pt-8">
      <Button variant="hero" size="xl" className="h-auto min-h-20 w-full whitespace-normal text-2xl" onClick={() => document.getElementById("dias-semana")?.scrollIntoView({ behavior: "smooth" })}><CalendarDays /> 📅 VER TREINO DA SEMANA</Button>
      <div>
        <p className="font-display text-lg text-primary">MEU TREINO</p>
        <h1 className="text-5xl leading-none text-foreground">OLÁ, {data.nome.toUpperCase()}</h1>
        {data.objetivo ? <p className="text-muted-foreground">Objetivo: {data.objetivo}</p> : null}
      </div>
      <SalvarTelaInicial />
      <ControleSemana semana={data.semana} atual={data.atual} mudar={setSemana} historico={data.historico} />
      <div className="border-l-2 border-primary pl-4"><p className="font-display text-xl">🎯 TEMA DA SEMANA</p><h2 className="font-display text-4xl">{data.tema || "Sem tema definido"}</h2></div>
      {!data.plano ? (
        <p className="rounded-2xl bg-secondary p-4 text-secondary-foreground">O professor ainda não mandou seu treino. Aguarde.</p>
      ) : (
        <ul id="dias-semana" className="space-y-3">
          {data.plano.map((d, i) => {
            const vazio = !d.descanso && diaVazio(d);
            const feito = data.feitos.find((f) => f.dia === d.dia);
            return (
              <li key={i}>
                <Link to="/a/$token/$dia" params={{ token, dia: String(i) }} search={{ semana: data.semana }} className="flex items-center justify-between rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
                  <span>
                    <span className="block font-display text-3xl leading-none">{d.dia}{d.tipo ? ` — ${d.tipo}` : ""}</span>
                    <span className="block text-lg font-bold">{vazio ? "Sem treino" : resumoDia(d)}</span>
                    {!feito ? <span className="mt-1 block text-sm font-bold">⏳ NÃO FEITO</span> : null}
                    {feito ? <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground"><CheckCircle2 className="h-4 w-4" /> ENVIADO</span> : null}
                  </span>
                  <ChevronRight />
                </Link>
                {!vazio && !d.descanso ? <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button asChild variant="hero" size="xl" className="h-auto min-h-16 whitespace-normal text-lg"><Link to="/a/$token/$dia" params={{ token, dia: String(i) }} search={{ semana: data.semana }}>ABRIR NO APLICATIVO</Link></Button>
                  <Button asChild variant="whatsapp" size="xl" className="h-auto min-h-16 whitespace-normal text-lg"><a href={linkProfessor(`Treino de ${d.dia}: ${resumoDia(d)}`)} target="_blank" rel="noopener noreferrer">ABRIR NO WHATSAPP</a></Button>
                </div> : null}
                {feito && !feito.avaliacao ? <p role="status" className="flex items-center gap-2 py-3 font-bold"><LoaderCircle className="h-6 w-6 shrink-0 animate-spin" /> 🤖 Hermes está analisando seu treino...</p> : null}
                {feito?.avaliacao ? <div className="mt-2 space-y-2"><AvaliacaoHermes avaliacao={feito.avaliacao} /><ExcluirTreino id={feito.id} token={token} /></div> : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
