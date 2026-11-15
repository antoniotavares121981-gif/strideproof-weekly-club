import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { revisarHermes } from "@/lib/assessoria.functions";
import { avaliacaoLiberada } from "@/lib/semanas";
import type { Feito } from "@/lib/treino";
import { Button } from "@/components/ui/button";

/** Professor só libera o resultado; a avaliação do Hermes aparece apenas para o aluno. */
export function RevisaoHermes({ feito }: { feito: Feito }) {
  const [agora, setAgora] = useState(() => Date.now());
  const [ocupado, setOcupado] = useState(false);
  const revisar = useServerFn(revisarHermes);
  const qc = useQueryClient();
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t); }, []);
  async function enviar() {
    if (ocupado) return;
    setOcupado(true);
    try { await revisar({ data: { id: feito.id, acao: "agora" } }); await qc.invalidateQueries({ queryKey: ["aluno"] }); }
    catch { toast.error("Não deu para enviar o resultado."); }
    finally { setOcupado(false); }
  }
  if (!feito.avaliacao) return null;
  if (avaliacaoLiberada(feito, new Date(agora))) return <p className="font-bold text-success">Resultado enviado pro aluno.</p>;
  return <Button variant="whatsapp" size="xl" className="h-auto min-h-16 w-full" disabled={ocupado} onClick={enviar}>ENVIAR RESULTADO</Button>;
}
