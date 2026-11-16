import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, CheckCircle2, Copy, Send, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ControleSemana } from "@/components/Semana";
import { ExcluirTreino } from "@/components/ExcluirTreino";
import { RevisaoHermes } from "@/components/RevisaoHermes";
import { BotaoVoltar, TopoPagina } from "@/components/TopoPagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enviarPlano, salvarRascunho, verAluno } from "@/lib/assessoria.functions";
import { linkAluno } from "@/lib/envios";
import { completarSemana, erroPlano, linkDoAluno, mensagemEnvioAluno, resumoDia, type DiaPlano } from "@/lib/treino";

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
  const [semana, setSemana] = useState<string | undefined>();
  const [tema, setTema] = useState("");
  const qc = useQueryClient();
  const ver = useServerFn(verAluno);
  const salvar = useServerFn(salvarRascunho);
  const enviar = useServerFn(enviarPlano);
  const { data, isLoading } = useQuery({ queryKey: ["aluno", id, semana], queryFn: () => ver({ data: { id, semana } }), refetchInterval: 5000 });
  const rascunho = data?.rascunho;
  const [plano, setPlano] = useState<DiaPlano[]>(() => completarSemana([]));
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const envioEmCurso = useRef(false);

  useEffect(() => {
    if (rascunho) setPlano(rascunho);
  }, [rascunho]);
  useEffect(() => { if (data) setTema(data.tema); }, [data?.tema, data?.semana]);
  function escolherSemana(s: string) { setErro(null); setSemana(s); }

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="p-6 text-muted-foreground">Aluno não encontrado.</p>;
  const { aluno, feitos } = data;

  const mudar = (i: number, campo: keyof DiaPlano, v: string) => {
    setErro(null);
    setPlano((p) => p.map((d, j) => (j === i ? { ...d, [campo]: v } : d)));
  };

  function alternarDescanso(i: number) {
    setErro(null);
    setPlano((p) => p.map((d, j) => j === i ? { dia: d.dia, km: "", tempo: "", pace: "", detalhes: d.detalhes, descanso: !d.descanso } : d));
  }

  async function guardar() {
    const aviso = erroPlano(plano);
    setErro(aviso);
    if (aviso) return;
    try {
      await salvar({ data: { id, semana: data?.semana, tema, plano: plano.map((d) => ({ ...d, tempo: d.tempo ?? "" })) } });
      toast.success("Treino salvo. O aluno ainda não recebeu.");
    } catch { toast.error("Não deu pra salvar. Tente de novo."); }
  }

  async function mandar(e: React.MouseEvent<HTMLAnchorElement>) {
    if (envioEmCurso.current) { e.preventDefault(); return; }
    const aviso = erroPlano(plano);
    setErro(aviso);
    if (aviso) { e.preventDefault(); return; }
    // O link abre diretamente; a página original permanece aberta para salvar o plano.
    envioEmCurso.current = true;
    setEnviando(true);
    try {
      await enviar({ data: { id, semana: data?.semana, tema, plano: plano.map((d) => ({ ...d, tempo: d.tempo ?? "" })) } });
      toast.success("Treino disponível no link do aluno. Confirme o envio no WhatsApp.");
      qc.invalidateQueries({ queryKey: ["aluno", id] });
    } catch {
      toast.error("Não deu pra salvar o treino. Volte e tente de novo antes de enviar a mensagem.");
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  }

  async function mandarPeloApp() {
    if (envioEmCurso.current) return;
    const aviso = erroPlano(plano);
    setErro(aviso);
    if (aviso) return;
    envioEmCurso.current = true;
    setEnviando(true);
    try {
      await enviar({ data: { id, semana: data?.semana, tema, plano: plano.map((d) => ({ ...d, tempo: d.tempo ?? "" })) } });
      toast.success("Treino enviado para o app do aluno.");
      qc.invalidateQueries({ queryKey: ["aluno", id] });
    } catch { toast.error("Não deu pra enviar. Tente de novo."); }
    finally { envioEmCurso.current = false; setEnviando(false); }
  }

  async function copiarLink() {
    try { await navigator.clipboard.writeText(linkDoAluno(aluno.token)); toast.success("Link copiado."); }
    catch { toast.error("Não deu pra copiar o link."); }
  }

  return (
    <main className="mx-auto max-w-md">
      <TopoPagina voltar={<BotaoVoltar to="/alunos" />} titulo={aluno.nome.toUpperCase()} subtitulo={`${aluno.whatsapp}${aluno.objetivo ? ` - Objetivo: ${aluno.objetivo}` : ""}`} />
      <div className="space-y-5 px-5">
        <Button variant="hero" size="xl" className="h-auto min-h-20 w-full whitespace-normal text-2xl" onClick={() => document.getElementById("plano-semana")?.scrollIntoView({ behavior: "smooth" })}><CalendarDays /> 📅 VER TREINO DA SEMANA</Button>
        <ControleSemana semana={data.semana} atual={data.atual} mudar={escolherSemana} historico={data.historico} />
        <ExcluirTreino id={id} semana={data.semana} limpar />
        <div className="space-y-2"><Label htmlFor="tema" className="font-display text-3xl">🎯 TEMA DA SEMANA</Label><Input id="tema" value={tema} maxLength={120} onChange={(e) => setTema(e.target.value)} className="h-16 text-xl" placeholder="Semana de Base" /></div>
        <section id="plano-semana" className="space-y-3">
          <h2 className="font-display text-3xl text-foreground">TREINO PLANEJADO DA SEMANA</h2>
          {plano.map((d, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-paper p-4 text-paper-foreground shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl">{d.dia}</h3>
                <Button type="button" variant={d.descanso ? "secondary" : "outline"} size="sm" aria-label={`Descanso / Sem treino - ${d.dia}`} aria-pressed={Boolean(d.descanso)} onClick={() => alternarDescanso(i)}>Descanso / Sem treino</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`km${i}`} className="text-paper-muted">DISTÂNCIA (km)</Label>
                  <Input id={`km${i}`} disabled={d.descanso} inputMode="decimal" placeholder="4" value={d.km} onChange={(e) => mudar(i, "km", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tempo${i}`} className="text-paper-muted">TEMPO</Label>
                  <Input id={`tempo${i}`} disabled={d.descanso} placeholder="20min" maxLength={20} value={d.tempo ?? ""} onChange={(e) => mudar(i, "tempo", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`pace${i}`} className="text-paper-muted">RITMO (/km)</Label>
                  <Input id={`pace${i}`} disabled={d.descanso} placeholder="5:30" value={d.pace} onChange={(e) => mudar(i, "pace", e.target.value)} className="h-12 text-lg font-bold" />
                </div>
              </div>
              <Textarea aria-label={`Detalhes do treino ${i + 1}`} maxLength={500} placeholder="Detalhes (opcional): aquecimento, tiros, dicas..." value={d.detalhes} onChange={(e) => mudar(i, "detalhes", e.target.value)} />
              {resumoDia(d) ? <p className="font-bold">{d.dia} - {resumoDia(d)}</p> : null}
            </div>
          ))}
          {erro ? <p role="alert" className="text-destructive">{erro}</p> : null}
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
                  {f.onde_acertei ? <p className="mt-2"><b>Onde eu acertei:</b> {f.onde_acertei}</p> : null}
                  {f.onde_errei ? <p className="mt-1"><b>Onde eu errei:</b> {f.onde_errei}</p> : null}
                  <p className="mt-2 font-semibold">{f.km.replace(".", ",")} km - {f.tempo}{f.pace ? ` - ${f.pace} /km` : ""}</p>
                  {f.foto ? <img src={f.foto} alt={`Foto do treino de ${f.dia}`} className="mt-3 w-full rounded-xl" loading="lazy" /> : <p className="mt-2 text-sm text-paper-muted">Sem foto.</p>}
                </div>
                <RevisaoHermes feito={f} />
              </div>
            );
          })}
        </section>
        <Button asChild variant="whatsapp" size="xl" className="min-h-16 h-auto whitespace-normal px-4 py-4 text-center">
          <a href={linkAluno(aluno.whatsapp, mensagemEnvioAluno(aluno.nome, linkDoAluno(aluno.token), plano, feitos))} target="_blank" rel="noopener noreferrer" onClick={mandar} aria-disabled={enviando}>
            <Send className="h-6 w-6" /> {enviando ? "SALVANDO..." : "MANDAR PELO WHATSAPP"}
          </a>
        </Button>
        <Button type="button" variant="hero" size="xl" className="h-auto min-h-16 w-full whitespace-normal" onClick={mandarPeloApp} disabled={enviando}><Smartphone className="h-6 w-6" /> MANDAR PELO APP</Button>
        <Button type="button" variant="outline" size="xl" className="mb-8 h-auto min-h-16 w-full whitespace-normal" onClick={copiarLink}><Copy className="h-6 w-6" /> COPIAR LINK</Button>
      </div>
    </main>
  );
}
