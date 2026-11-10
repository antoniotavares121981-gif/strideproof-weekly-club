import { useCallback, useEffect, useState } from "react";

import type { Aluno, Registro } from "./envios";
import type { DiaId } from "./plano";

const EVENTO = "gm-armazenamento";

export const CHAVES = {
  alunos: "gm:alunos",
  registro: (aluno: string, semana: string, dia: DiaId) => `gm:registro:${aluno}:${semana}:${dia}`,
};

function ler<T>(chave: string, inicial: T): T {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto == null ? inicial : (JSON.parse(bruto) as T);
  } catch {
    return inicial;
  }
}

export function gravar<T>(chave: string, valor: T): boolean {
  try {
    if (valor === null || valor === undefined) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, JSON.stringify(valor));
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: chave }));
    return true;
  } catch {
    return false;
  }
}

/** Valor guardado no celular. Lido só depois de abrir a página. */
export function useGuardado<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(inicial);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setValor(ler(chave, inicial));
    setCarregado(true);
    const atualizar = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (!d || d === chave) setValor(ler(chave, inicial));
    };
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const salvar = useCallback(
    (novo: T) => {
      setValor(novo);
      return gravar(chave, novo);
    },
    [chave],
  );

  return [valor, salvar, carregado] as const;
}

export function useAlunos() {
  return useGuardado<Aluno[]>(CHAVES.alunos, []);
}

export function useRegistro(aluno: string, semana: string, dia: DiaId) {
  return useGuardado<Registro | null>(CHAVES.registro(aluno, semana, dia), null);
}

export function useSemana() {
  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => setHoje(new Date()), []);
  return hoje;
}
