import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MessageCircle, Users } from "lucide-react";

import hermes from "@/assets/hermes.jpg";
import { Button } from "@/components/ui/button";
import { LINK_PROFESSOR, PROFESSOR_PADRAO } from "@/lib/envios";
import { Alunos } from "./alunos.index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel do Professor — Assessoria de Corrida" },
      { name: "description", content: "Cadastro de alunos, objetivos e planejamento dos treinos de corrida." },
      { property: "og:title", content: "Painel do Professor — Assessoria de Corrida" },
      { property: "og:description", content: "Cadastro de alunos, objetivos e planejamento dos treinos de corrida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="px-5 pt-6"><Button asChild variant="hero" size="xl" className="h-auto min-h-20 w-full whitespace-normal text-2xl"><Link to="/alunos"><CalendarDays /> 📅 VER TREINO DA SEMANA</Link></Button></div>
      <Alunos mostrarBotao={false} />
      <div className="space-y-5 px-5">
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
      </div>
    </div>
  );
}
