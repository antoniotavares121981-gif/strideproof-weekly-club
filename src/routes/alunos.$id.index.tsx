import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AvaliacaoHermes } from "@/components/Hermes";
import { BotaoVoltar, TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { avaliarTreino, enviarPlano, salvarRascunho, verAluno } from "@/lib/assessoria.functions";
import { linkAluno } from "@/lib/envios";
import { PLANO_PADRAO, diaVazio, mensagemEnvioAluno, planoValido, resumoDia, type DiaPlano } from "@/lib/treino";

export const Route = createFileRoute("/alunos/$id/")({
  head: () => ({
    meta: [
      { title: "Ficha do aluno — Painel do Professor" },
      { name: "description", content: "Treino planejado da semana e treinos feitos do aluno." },
      { property: "og:title", content: "Ficha do aluno — Painel do Professor" },
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
  const avaliar = useServerFn(avaliarTreino);
  const [avaliando, setAvaliando] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["aluno", id], queryFn: () => ver({ data: { id } }) });
  const [plano, setPlano] = useState<DiaPlano[]>(PLANO_PADRAO);
  const [enviando, setEnviando] = useState(false);
  const envioEmCurso = useRef(false);

  useEffect(() => {
    if (data) setPlano(data.rascunho.some((d) => !diaVazio(d)) ? data.rascunho : data.enviado ?? PLANO_PADRAO);
  }, [data]);

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="p-6 text-muted-foreground">Aluno não encontrado.</p>;
  const { aluno, feitos } = data;

  const mudar = (i: number, campo: keyof DiaPlano, v: string) => setPlano(plano.map((d, j) => (j === i ? { ...d, [campo]: v } : d)));

  async function guardar() {
    if (!planoValido(plano)) { toast.error("Nos dias com treino, preencha distância, tempo e ritmo (ex.: 4:59). Dia vazio = descanso."); return; }
    try {
      await salvar({ data: { id, plano: plano.map((d) => ({ ...d, tempo: d.tempo ?? "" })) } });
      toast.success("Treino salvo. O aluno ainda não recebeu.");
    } catch { toast.error("Não deu pra salvar. Tente de novo."); }
  }

  async function pedirAvaliacao(feitoId: string) {
    setAvaliando(feitoId);
    try {
      await avaliar({ data: { id: feitoId } });
      toast.success("Avaliação salva. O aluno já pode ver.");
      qc.invalidateQueries({ queryKey: ["aluno", id] });
    } catch { toast.error("Não deu pra avaliar. Tente de novo."); }
    finally { setAvaliando(null); }
  }

  async function mandar(e: React.MouseEvent<HTMLAnchorElement>) {
    if (envioEmCurso.current) { e.preventDefault(); return; }
    if (!planoValido(plano)) { e.preventDefault(); toast.error("Nos dias com treino, preencha distância, tempo e ritmo (ex.: 4:59). Dia vazio = descanso."); return; }
    // O link abre diretamente; a página original permanece aberta para salvar o plano.
    envioEmCurso.current = true;
    setEnviando(true);
    try {
      await enviar({ data: { id, plano: plano.map((d) => ({ ...d, tempo: d.tempo ?? "" })) } });
      toast.success("Treino disponível no link do aluno. Confirme o envio no WhatsApp.");
      qc.invalidateQueries({ queryKey: ["aluno", id] });
    } catch {
      toast.error("Não deu pra salvar o treino. Volte e tente de novo antes de enviar a mensagem.");
    } finally {
      envioEmCurso.current = false;
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
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl">{d.dia}</h3>
                {diaVazio(d) ? <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Descanso / Sem treino</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`km${i}`} className="text-paper-muted">DISTÂNCIA (km)</Label>
                  <Input id={`km${i}`} inputMode="decimal" placeholder="4" value={d.km} onChange={(e) => mudar(i, "km", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tempo${i}`} className="text-paper-muted">TEMPO</Label>
                  <Input id={`tempo${i}`} placeholder="20min" maxLength={20} value={d.tempo ?? ""} onChange={(e) => mudar(i, "tempo", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`pace${i}`} className="text-paper-muted">RITMO (/km)</Label>
                  <Input id={`pace${i}`} placeholder="5:30" value={d.pace} onChange={(e) => mudar(i, "pace", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
              </div>
              <Textarea aria-label={`Detalhes do treino ${i + 1}`} maxLength={500} placeholder="Detalhes (opcional): aquecimento, tiros, dicas..." value={d.detalhes} onChange={(e) => mudar(i, "detalhes", e.target.value)} />
              <p className="font-bold">{d.dia} - {resumoDia(d)}</p>
            </div>
          ))}
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={guardar}>SALVAR SEM ENVIAR</Button>
          <p className="text-sm text-muted-foreground">
            {aluno.enviado_em ? `Último envio: ${new Date(aluno.enviado_em).toLocaleString("pt-BR")}` : "O aluno ainda não recebeu nenhum treino."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-3xl text-foreground">TREINOS FEITOS</h2>
          {feitos.length === 0 ? <p className="text-muted-foreground">Nenhum treino recebido ainda.</p> : null}
          {feitos.map((f) => {
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
                {f.avaliacao ? <AvaliacaoHermes avaliacao={f.avaliacao} /> : null}
                <Button type="button" variant="outline" size="lg" className="w-full" disabled={avaliando === f.id} onClick={() => pedirAvaliacao(f.id)}>
                  <Sparkles /> {avaliando === f.id ? "HERMES LENDO..." : f.avaliacao ? "AVALIAR DE NOVO COM HERMES" : "AVALIAR COM HERMES"}
                </Button>
              </div>
            );
          })}
        </section>
        <Button asChild variant="whatsapp" size="xl" className="min-h-16 h-auto whitespace-normal px-4 py-4 text-center">
          <a href={linkAluno(aluno.whatsapp, mensagemEnvioAluno(aluno.nome, `${typeof window === "undefined" ? "" : window.location.origin}/a/${aluno.token}`, plano))} target="_blank" rel="noopener noreferrer" onClick={mandar} aria-disabled={enviando}>
            <Send className="h-6 w-6" /> {enviando ? "SALVANDO..." : "ENVIAR PELO WHATSAPP"}
          </a>
        </Button>
      </div>
    </main>
  );
}
