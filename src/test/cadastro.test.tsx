import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Alunos } from "@/routes/alunos.index";

const mocks = vi.hoisted(() => ({
  criar: vi.fn(() => new Promise(() => {})),
  listar: vi.fn(async () => []),
}));
vi.mock("@/lib/assessoria.functions", () => ({
  criarAluno: mocks.criar,
  listarAlunos: mocks.listar,
  apagarAluno: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));

it("salva o aluno uma única vez mesmo com duas submissões seguidas", async () => {
  render(<QueryClientProvider client={new QueryClient()}><Alunos /></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText("NOME"), { target: { value: "Aluno Teste" } });
  fireEvent.change(screen.getByLabelText("NÚMERO DO WHATSAPP"), { target: { value: "71 98888-7777" } });
  fireEvent.change(screen.getByLabelText("OBJETIVO"), { target: { value: "Correr 10 km" } });
  const form = screen.getByRole("button", { name: "SALVAR" }).closest("form");
  if (!form) throw new Error("Cadastro sem formulário");
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(mocks.criar).toHaveBeenCalledTimes(1));
  expect(mocks.criar).toHaveBeenCalledWith({ data: { nome: "Aluno Teste", whatsapp: "71 98888-7777", objetivo: "Correr 10 km" } });
});