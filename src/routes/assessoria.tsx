import { createFileRoute } from "@tanstack/react-router";

import { TopoPagina } from "@/components/TopoPagina";

export const Route = createFileRoute("/assessoria")({
  head: () => ({
    meta: [
      { title: "Assessoria — Assessoria de Corrida" },
      { name: "description", content: "Assessoria de Corrida: treino de corrida com acompanhamento do professor e avaliação do Hermes." },
      { property: "og:title", content: "Assessoria — Assessoria de Corrida" },
      { property: "og:description", content: "Assessoria de Corrida: treino de corrida com acompanhamento do professor e avaliação do Hermes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <main className="mx-auto max-w-md">
      <TopoPagina titulo="ASSESSORIA" />
      <p className="mx-5 rounded-2xl bg-paper p-4 text-paper-foreground">Assessoria de Corrida: treino de corrida com acompanhamento do professor e avaliação do Hermes.</p>
    </main>
  );
}
