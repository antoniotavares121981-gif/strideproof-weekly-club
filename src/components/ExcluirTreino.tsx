import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { excluirTreino, limparSemana } from "@/lib/assessoria.functions";

export function ExcluirTreino({ id, token, semana, limpar = false }: { id: string; token?: string; semana?: string; limpar?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const excluir = useServerFn(excluirTreino);
  const limparFn = useServerFn(limparSemana);
  const qc = useQueryClient();
  async function confirmar() {
    if (ocupado) return;
    setOcupado(true);
    try {
      if (limpar && semana) await limparFn({ data: { id, semana, codigo } });
      else await excluir({ data: { id, ...(token ? { token } : { codigo }) } });
      await qc.invalidateQueries();
      setAberto(false); setCodigo("");
      toast.success("Treino apagado para os dois lados.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não deu para apagar."); }
    finally { setOcupado(false); }
  }
  return <>
    <Button variant="outline" className="text-destructive" onClick={() => setAberto(true)}><Trash2 /> {limpar ? "LIMPAR SEMANA" : token ? "APAGAR MEU TREINO" : "EXCLUIR"}</Button>
    {aberto ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-5" role="dialog" aria-modal="true" aria-label="Confirmar exclusão"><div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-5 text-card-foreground">
      <h2 className="font-display text-3xl">Tem certeza que quer apagar?</h2>
      <p>{limpar ? "Vai apagar os treinos feitos desta semana para você e para o aluno. O planejamento será mantido." : "Vai apagar pra você e pro professor."}</p>
      {!token ? <Input type="password" autoComplete="off" aria-label="Código do professor" placeholder="Código do professor" value={codigo} onChange={(e) => setCodigo(e.target.value)} /> : null}
      <div className="flex flex-wrap gap-2"><Button variant="destructive" disabled={ocupado} onClick={confirmar}>SIM, APAGAR</Button><Button variant="outline" disabled={ocupado} onClick={() => setAberto(false)}>CANCELAR</Button></div>
    </div></div> : null}
  </>;
}