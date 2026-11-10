// Treino da semana passado pelo professor (exemplo — trocar pelo treino real).

export type DiaId = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type Meta = {
  tipo: string; // ex.: Fácil, Descanso, Intervalado, Longão
  km: number; // 0 = descanso
  tempo: string; // ex.: 1h00 ou 45min
  paceMin: string; // mm:ss /km
  paceMax: string;
  detalhes: string;
};

export type Dia = { id: DiaId; nome: string; curto: string; meta: Meta };

const descanso: Meta = { tipo: "Descanso", km: 0, tempo: "-", paceMin: "", paceMax: "", detalhes: "Dia de descanso. Durma bem e hidrate-se." };

export const DIAS: Dia[] = [
  { id: "seg", nome: "Segunda", curto: "Seg", meta: { tipo: "Fácil", km: 9.7, tempo: "1h00", paceMin: "5:48", paceMax: "6:34", detalhes: "Rodagem leve, ritmo de conversa do começo ao fim." } },
  { id: "ter", nome: "Terça", curto: "Ter", meta: { tipo: "Intervalado", km: 8, tempo: "45min", paceMin: "4:50", paceMax: "6:30", detalhes: "Aquecer 2 km. 6 tiros de 800 m forte com 2 min de trote. Soltar 2 km." } },
  { id: "qua", nome: "Quarta", curto: "Qua", meta: descanso },
  { id: "qui", nome: "Quinta", curto: "Qui", meta: { tipo: "Ritmo", km: 7, tempo: "40min", paceMin: "5:30", paceMax: "5:50", detalhes: "Segurar o pace constante do começo ao fim." } },
  { id: "sex", nome: "Sexta", curto: "Sex", meta: { tipo: "Fácil", km: 5, tempo: "32min", paceMin: "6:10", paceMax: "6:40", detalhes: "Trote leve e 10 min de educativos." } },
  { id: "sab", nome: "Sábado", curto: "Sáb", meta: { tipo: "Longão", km: 14, tempo: "1h30", paceMin: "6:00", paceMax: "6:40", detalhes: "Hidratar a cada 4 km. Ritmo confortável." } },
  { id: "dom", nome: "Domingo", curto: "Dom", meta: descanso },
];

export function acharDia(id: string): Dia | undefined {
  return DIAS.find((d) => d.id === id);
}

export function km(n: number): string {
  return String(n).replace(".", ",");
}

/** Ex.: "9,7 km - 1h00 - 5:48-6:34 /km" */
export function resumoMeta(m: Meta): string {
  if (m.km === 0) return "Sem corrida";
  return `${km(m.km)} km - ${m.tempo} - ${m.paceMin}-${m.paceMax} /km`;
}

export function segundaDaSemana(hoje: Date = new Date()): Date {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const ds = d.getDay();
  d.setDate(d.getDate() - (ds === 0 ? 6 : ds - 1));
  return d;
}

export function chaveSemana(hoje: Date = new Date()): string {
  const s = segundaDaSemana(hoje);
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`;
}

export function dataDoDia(id: DiaId, hoje: Date = new Date()): Date {
  const seg = segundaDaSemana(hoje);
  const d = new Date(seg);
  d.setDate(seg.getDate() + DIAS.findIndex((x) => x.id === id));
  return d;
}

export function dataCurta(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
