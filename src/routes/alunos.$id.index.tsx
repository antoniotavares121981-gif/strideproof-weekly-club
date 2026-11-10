import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AvaliacaoHermes } from "@/components/Hermes";
import { BotaoVoltar, TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enviarPlano, salvarRascunho, verAluno } from "@/lib/assessoria.functions";
import { linkAluno } from "@/lib/envios";
import { DIAS_SEMANA, PLANO_PADRAO, mensagemEnvioAluno, planoValido, resumoDia, type DiaPlano } from "@/lib/treino";

export const Route = createFileRoute("/alunos/$id/")({
  head: () => ({
    meta: [
      { title: "Tela do aluno — GM Assessoria Esportiva" },
      { name: "description", content: "Treino planejado da semana e treinos feitos do aluno." },
      { property: "og:title", content: "Tela do aluno — GM Assessoria Esportiva" },
      { property: "og:description", content: "Treino planejado da semana e treinos feitos do aluno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TelaAluno,
});

function TelaAluno() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const ver = useServerFn(verAluno);
  const salvar = useServerFn(salvarRascunho);
  const enviar = useServerFn(enviarPlano);
  const { data, isLoading } = useQuery({ queryKey: ["aluno", id], queryFn: () => ver({ data: { id } }) });
  const [plano, setPlano] = useState<DiaPlano[]>(PLANO_PADRAO);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (data) setPlano(data.rascunho.length === 3 ? data.rascunho : data.enviado ?? PLANO_PADRAO);
  }, [data]);

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="p-6 text-muted-foreground">Aluno não encontrado.</p>;
  const { aluno, feitos } = data;

  const mudar = (i: number, campo: keyof DiaPlano, v: string) => setPlano(plano.map((d, j) => (j === i ? { ...d, [campo]: v } : d)));

  async function guardar() {
    if (!planoValido(plano)) { toast.error("Preencha distância e pace (ex.: 5:30) dos 3 dias."); return; }
    await salvar({ data: { id, plano } });
    toast.success("Treino salvo. O aluno ainda não recebeu.");
  }

  async function mandar() {
    if (!planoValido(plano)) { toast.error("Preencha distância e pace (ex.: 5:30) dos 3 dias."); return; }
    // Abre a janela antes de esperar, pra o celular não bloquear.
    const janela = window.open("about:blank", "_blank");
    setEnviando(true);
    try {
      await enviar({ data: { id, plano } });
      const link = `${window.location.origin}/a/${aluno.token}`;
      const url = linkAluno(aluno.whatsapp, mensagemEnvioAluno(aluno.nome, link, plano));
      if (janela) janela.location.href = url; else window.location.href = url;
      toast.success("Treino enviado! Agora o aluno já vê no link dele.");
      qc.invalidateQueries({ queryKey: ["aluno", id] });
    } catch {
      janela?.close();
      toast.error("Não deu pra enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md">
      <TopoPagina voltar={<BotaoVoltar to="/alunos" />} titulo={aluno.nome.toUpperCase()} subtitulo={`${aluno.whatsapp}${aluno.objetivo ? ` - Objetivo: ${aluno.objetivo}` : ""}`} />
      <div className="space-y-5 px-5">
        <section className="space-y-3">
          <h2 className="font-display text-3xl text-foreground">TREINO PLANEJADO DA SEMANA</h2>
          {plano.map((d, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
              <select
                aria-label={`Dia do treino ${i + 1}`}
                value={d.dia}
                onChange={(e) => mudar(i, "dia", e.target.value)}
                className="w-full rounded-lg border-2 border-paper-foreground/15 bg-paper p-2 font-display text-2xl"
              >
                {DIAS_SEMANA.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`km${i}`} className="text-paper-muted">DISTÂNCIA (km)</Label>
                  <Input id={`km${i}`} inputMode="decimal" value={d.km} onChange={(e) => mudar(i, "km", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`pace${i}`} className="text-paper-muted">PACE (/km)</Label>
                  <Input id={`pace${i}`} placeholder="5:30" value={d.pace} onChange={(e) => mudar(i, "pace", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
              </div>
              <Textarea aria-label={`Detalhes do treino ${i + 1}`} maxLength={500} placeholder="Detalhes (opcional): aquecimento, tiros, dicas..." value={d.detalhes} onChange={(e) => mudar(i, "detalhes", e.target.value)} />
              <p className="font-bold">{d.dia} - {resumoDia(d)}</p>
            </div>
          ))}
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={guardar}>SALVAR SEM ENVIAR</Button>
          <Button type="button" variant="whatsapp" size="xl" onClick={mandar} disabled={enviando}>
            <Send className="h-6 w-6" /> ENVIAR TREINO PARA O ALUNO
          </Button>
          <p className="text-sm text-muted-foreground">
            {aluno.enviado_em ? `Último envio: ${new Date(aluno.enviado_em).toLocaleString("pt-BR")}` : "O aluno ainda não recebeu nenhum treino."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-3xl text-foreground">TREINOS FEITOS</h2>
          {feitos.length === 0 ? <p className="text-muted-foreground">Nenhum treino recebido ainda.</p> : null}
          {feitos.map((f) => {
            const meta = data.enviado?.[f.dia_index];
            return (
              <div key={f.id} className="space-y-2">
                <div className="rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-2xl leading-none">{f.dia}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground"><CheckCircle2 className="h-4 w-4" /> CONCLUÍDO</span>
                  </div>
                  <p className="mt-1 text-sm text-paper-muted">{new Date(f.created_at).toLocaleString("pt-BR")}</p>
                  <p className="mt-2 font-semibold">{f.km.replace(".", ",")} km - {f.tempo}{f.pace ? ` - ${f.pace} /km` : ""}</p>
                  {f.foto ? <img src={f.foto} alt={`Foto do treino de ${f.dia}`} className="mt-3 w-full rounded-xl" loading="lazy" /> : <p className="mt-2 text-sm text-paper-muted">Sem foto.</p>}
                </div>
                {meta ? (
                  <AvaliacaoHermes
                    meta={{ tipo: "", km: Number(meta.km.replace(",", ".")), tempo: "", paceMin: meta.pace, paceMax: meta.pace, detalhes: meta.detalhes }}
                    registro={{ km: f.km, tempo: f.tempo, pace: f.pace, em: f.created_at }}
                  />
                ) : null}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
