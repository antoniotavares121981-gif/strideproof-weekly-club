import { createFileRoute } from "@tanstack/react-router";

import { TopoPagina } from "@/components/TopoPagina";

export const Route = createFileRoute("/provas")({
  head: () => ({
    meta: [
      { title: "Provas — GM Assessoria Esportiva" },
      { name: "description", content: "Calendário de provas da assessoria. Em breve o professor coloca as próximas corridas aqui." },
      { property: "og:title", content: "Provas — GM Assessoria Esportiva" },
      { property: "og:description", content: "Calendário de provas da assessoria. Em breve o professor coloca as próximas corridas aqui." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <main className="mx-auto max-w-md">
      <TopoPagina titulo="PROVAS" />
      <p className="mx-5 rounded-2xl bg-paper p-4 text-paper-foreground">Calendário de provas da assessoria. Em breve o professor coloca as próximas corridas aqui.</p>
    </main>
  );
}
