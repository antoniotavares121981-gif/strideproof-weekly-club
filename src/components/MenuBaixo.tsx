import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, Dumbbell, Home, Menu, Trophy } from "lucide-react";

const itens = [
  { to: "/", rotulo: "Início", Icone: Home },
  { to: "/alunos", rotulo: "Treinos", Icone: Dumbbell },
  { to: "/provas", rotulo: "Provas", Icone: Trophy },
  { to: "/assessoria", rotulo: "Assessoria", Icone: Building2 },
  { to: "/mais", rotulo: "Mais", Icone: Menu },
] as const;

export function MenuBaixo() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  if (caminho.startsWith("/a/")) return null; // tela do aluno não mostra o menu do professor
  return (
    <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {itens.map(({ to, rotulo, Icone }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-2 text-xs font-semibold text-muted-foreground data-[status=active]:text-primary"
            >
              <Icone className="h-5 w-5" />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
