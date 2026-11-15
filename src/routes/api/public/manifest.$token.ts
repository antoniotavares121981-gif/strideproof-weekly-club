import { createFileRoute } from "@tanstack/react-router";

// Manifesto por aluno: o ícone da tela inicial abre direto o treino dele.
export const Route = createFileRoute("/api/public/manifest/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = /^[A-Za-z0-9_-]{16,64}$/.test(params.token) ? params.token : "";
        const inicio = token ? `/a/${token}` : "/";
        return new Response(JSON.stringify({
          name: "Meu Treino", short_name: "Meu Treino", start_url: inicio, scope: inicio, id: inicio,
          display: "standalone", background_color: "#0f1a2e", theme_color: "#0f1a2e",
          icons: [{ src: "/icone-192.png", sizes: "192x192", type: "image/png" }, { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
        }), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } });
      },
    },
  },
});
