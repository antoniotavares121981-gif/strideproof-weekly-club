import { createFileRoute } from "@tanstack/react-router";

import { TopoPagina } from "@/components/TopoPagina";

export const Route = createFileRoute("/assessoria")({
  head: () => ({
    meta: [
      { title: "Assessoria — GM Assessoria Esportiva" },
      { name: "description", content: "GM Assessoria Esportiva: treino de corrida com acompanhamento do professor e avaliação do Hermes." },
      { property: "og:title", content: "Assessoria — GM Assessoria Esportiva" },
      { property: "og:description", content: "GM Assessoria Esportiva: treino de corrida com acompanhamento do professor e avaliação do Hermes." },
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
      <p className="mx-5 rounded-2xl bg-paper p-4 text-paper-foreground">GM Assessoria Esportiva: treino de corrida com acompanhamento do professor e avaliação do Hermes.</p>
    </main>
  );
}
