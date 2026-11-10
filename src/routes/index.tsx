import { Link, createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Users } from "lucide-react";

import hermes from "@/assets/hermes.jpg";
import { Button } from "@/components/ui/button";
import { LINK_PROFESSOR, PROFESSOR_PADRAO } from "@/lib/envios";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — GM Assessoria Esportiva" },
      { name: "description", content: "Treinos de corrida dos alunos da GM Assessoria Esportiva." },
      { property: "og:title", content: "Início — GM Assessoria Esportiva" },
      { property: "og:description", content: "Treinos de corrida dos alunos da GM Assessoria Esportiva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  return (
    <main className="mx-auto max-w-md space-y-5 px-5 pt-8">
      <div>
        <p className="font-display text-lg text-primary">GM</p>
        <h1 className="text-5xl leading-none text-foreground">ASSESSORIA ESPORTIVA</h1>
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-secondary p-4">
        <img src={hermes} alt="Hermes, treinador" width={816} height={816} className="h-20 w-20 rounded-xl object-cover object-top" />
        <p className="text-sm text-secondary-foreground">Cadastre seus alunos, acompanhe os treinos e receba a avaliação do Hermes.</p>
      </div>
      <Button asChild variant="hero" size="xl">
        <Link to="/alunos"><Users className="h-6 w-6" /> MEUS ALUNOS</Link>
      </Button>
      <a href={LINK_PROFESSOR + "Ola"} target="_blank" rel="noreferrer" className="block rounded-2xl bg-paper p-4 text-paper-foreground">
        <p className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="h-4 w-4" /> WhatsApp do professor</p>
        <p className="font-display text-3xl">{PROFESSOR_PADRAO}</p>
      </a>
    </main>
  );
}
