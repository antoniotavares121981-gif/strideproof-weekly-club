// Treino da semana montado pelo professor (exemplo inicial — trocar pelo treino real).

export type DiaId = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

export type Meta = {
  titulo: string;
  km: number;
  tempo: string; // h:mm:ss ou mm:ss
  pace: string; // mm:ss por km
  fcMax: number; // batimentos por minuto
  dica: string;
};

export type Dia = { id: DiaId; nome: string; curto: string; meta: Meta };

export const DIAS: Dia[] = [
  {
    id: "segunda",
    nome: "Segunda",
    curto: "SEG",
    meta: { titulo: "Rodagem leve", km: 6, tempo: "36:00", pace: "6:00", fcMax: 150, dica: "Ritmo de conversa, sem forçar." },
  },
  {
    id: "terca",
    nome: "Terça",
    curto: "TER",
    meta: { titulo: "Intervalado", km: 8, tempo: "44:00", pace: "5:30", fcMax: 168, dica: "6 tiros de 800 m com 2 min de trote." },
  },
  {
    id: "quarta",
    nome: "Quarta",
    curto: "QUA",
    meta: { titulo: "Regenerativo", km: 5, tempo: "32:30", pace: "6:30", fcMax: 140, dica: "Bem tranquilo, só soltar as pernas." },
  },
  {
    id: "quinta",
    nome: "Quinta",
    curto: "QUI",
    meta: { titulo: "Ritmo forte", km: 7, tempo: "38:30", pace: "5:30", fcMax: 165, dica: "Segura o pace do começo ao fim." },
  },
  {
    id: "sexta",
    nome: "Sexta",
    curto: "SEX",
    meta: { titulo: "Trote + educativos", km: 4, tempo: "26:00", pace: "6:30", fcMax: 145, dica: "Trote leve e 10 min de educativos." },
  },
  {
    id: "sabado",
    nome: "Sábado",
    curto: "SÁB",
    meta: { titulo: "Longão", km: 12, tempo: "1:18:00", pace: "6:30", fcMax: 155, dica: "Hidrata a cada 4 km." },
  },
  {
    id: "domingo",
    nome: "Domingo",
    curto: "DOM",
    meta: { titulo: "Leve na praia", km: 5, tempo: "32:30", pace: "6:30", fcMax: 145, dica: "Areia firme, perto da água." },
  },
];

export function acharDia(id: string): Dia | undefined {
  return DIAS.find((d) => d.id === id);
}

/** Segunda-feira da semana de `hoje`, em horário local. */
export function segundaDaSemana(hoje: Date = new Date()): Date {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diaSemana = d.getDay(); // 0 = domingo
  const voltar = diaSemana === 0 ? 6 : diaSemana - 1;
  d.setDate(d.getDate() - voltar);
  return d;
}

export function dataDoDia(id: DiaId, hoje: Date = new Date()): Date {
  const seg = segundaDaSemana(hoje);
  const idx = DIAS.findIndex((d) => d.id === id);
  const d = new Date(seg);
  d.setDate(seg.getDate() + idx);
  return d;
}

export function chaveSemana(hoje: Date = new Date()): string {
  const s = segundaDaSemana(hoje);
  const mm = String(s.getMonth() + 1).padStart(2, "0");
  const dd = String(s.getDate()).padStart(2, "0");
  return `${s.getFullYear()}-${mm}-${dd}`;
}

export function dataCurta(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
