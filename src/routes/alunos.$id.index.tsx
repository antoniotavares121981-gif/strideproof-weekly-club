import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";

import { CartaoTreino } from "@/components/CartaoTreino";
import { BotaoVoltar, TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { useAlunos, useSemana } from "@/lib/armazenamento";
import { linkAluno, mensagemTreinoSemana } from "@/lib/envios";
import { DIAS, chaveSemana, dataCurta, dataDoDia } from "@/lib/plano";

export const Route = createFileRoute("/alunos/$id/")({
  head: () => ({
    meta: [
      { title: "Treinos do aluno — GM Assessoria Esportiva" },
      { name: "description", content: "Treinos da semana, de segunda a domingo." },
      { property: "og:title", content: "Treinos do aluno — GM Assessoria Esportiva" },
      { property: "og:description", content: "Treinos da semana, de segunda a domingo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TreinosAluno,
});

function TreinosAluno() {
  const { id } = Route.useParams();
  const [alunos, , ok] = useAlunos();
  const aluno = alunos.find((a) => a.id === id);
  const hoje = useSemana();

  if (!ok || !hoje) return null;
  if (!aluno) return <p className="p-6 text-muted-foreground">Aluno não encontrado.</p>;
  const semana = chaveSemana(hoje);

  return (
    <main className="mx-auto max-w-md">
      <TopoPagina voltar={<BotaoVoltar to="/alunos" />} titulo={aluno.nome.toUpperCase()} subtitulo={`Treinos da semana - ${aluno.whatsapp}`} />
      <div className="space-y-4 px-5">
        <Button asChild variant="whatsapp" size="xl">
          <a href={linkAluno(aluno.whatsapp, mensagemTreinoSemana(aluno.nome))} target="_blank" rel="noreferrer">
            <Send className="h-6 w-6" /> ENVIAR PARA O ALUNO
          </a>
        </Button>
        <ul className="space-y-4">
          {DIAS.map((d) => (
            <CartaoTreino key={d.id} alunoId={aluno.id} semana={semana} dia={d} data={dataCurta(dataDoDia(d.id, hoje))} />
          ))}
        </ul>
      </div>
    </main>
  );
}
