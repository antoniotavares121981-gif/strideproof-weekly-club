import { createFileRoute } from "@tanstack/react-router";

import { TopoPagina } from "@/components/TopoPagina";

export const Route = createFileRoute("/mais")({
  head: () => ({
    meta: [
      { title: "Mais — Assessoria de Corrida" },
      { name: "description", content: "Professor: 71 99676-9048. Os dados ficam salvos neste celular." },
      { property: "og:title", content: "Mais — Assessoria de Corrida" },
      { property: "og:description", content: "Professor: 71 99676-9048. Os dados ficam salvos neste celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <main className="mx-auto max-w-md">
      <TopoPagina titulo="MAIS" />
      <p className="mx-5 rounded-2xl bg-paper p-4 text-paper-foreground">Professor: 71 99676-9048. Os dados ficam salvos neste celular.</p>
    </main>
  );
}
