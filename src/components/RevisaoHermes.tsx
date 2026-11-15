import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { revisarHermes } from "@/lib/assessoria.functions";
import { avaliacaoLiberada } from "@/lib/semanas";
import type { Feito } from "@/lib/treino";
import { AvaliacaoHermes } from "@/components/Hermes";
import { Button } from "@/components/ui/button";

export function RevisaoHermes({ feito }: { feito: Feito }) {
  const [agora, setAgora] = useState(() => Date.now());
  const [ocupado, setOcupado] = useState(false);
  const revisar = useServerFn(revisarHermes);
  const qc = useQueryClient();
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t); }, []);
  async function agir(acao: "avaliar" | "agora" | "cancelar") {
    if (ocupado) return;
    setOcupado(true);
    try { await revisar({ data: { id: feito.id, acao } }); await qc.invalidateQueries({ queryKey: ["aluno"] }); }
    catch { toast.error("Não deu para atualizar a avaliação."); }
    finally { setOcupado(false); }
  }
  if (!feito.avaliacao) return null;
  const falta = Math.max(0, Math.ceil(((feito.liberar_em ? new Date(feito.liberar_em).getTime() : agora) - agora) / 1000));
  if (avaliacaoLiberada(feito, new Date(agora))) return <p className="font-bold text-success">Resultado enviado pro aluno.</p>;
  return <Button variant="whatsapp" size="xl" className="h-auto min-h-16 w-full" disabled={ocupado} onClick={() => agir("agora")}>ENVIAR RESULTADO</Button>;
  return <div className="space-y-3">
    {!feito.revisado_em ? <><p className="flex items-center gap-2"><LoaderCircle className="shrink-0 animate-spin motion-reduce:animate-none" /> 🤖 Hermes está avaliando seu treino...</p><Button variant="hero" className="w-full" disabled={ocupado} onClick={() => agir("avaliar")}>AVALIAR COM HERMES / VER AVALIAÇÃO</Button></> : <>
      <AvaliacaoHermes avaliacao={feito.avaliacao} />
      {feito.envio_cancelado ? <><p>Envio cancelado. O aluno não vê a avaliação.</p><Button variant="outline" disabled={ocupado} onClick={() => agir("avaliar")}>AVALIAR COM HERMES</Button></> : avaliacaoLiberada(feito, new Date(agora)) ? <p className="font-bold text-success">Avaliação disponível para o aluno.</p> : <><p role="status" className="font-bold">Enviando pro aluno em {Math.floor(falta / 60)}:{String(falta % 60).padStart(2, "0")}...</p><div className="flex flex-wrap gap-2"><Button variant="whatsapp" disabled={ocupado} onClick={() => agir("agora")}>ENVIAR AGORA</Button><Button variant="outline" disabled={ocupado} onClick={() => agir("cancelar")}>CANCELAR ENVIO</Button></div></>}
    </>}
  </div>;
}