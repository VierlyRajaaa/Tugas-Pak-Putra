export interface Plant {
  id: number;
  name: string;
  species: string;
  wateringInterval: number;
  lastWatered: string | null;
  notes?: string | null;
}

export type CareStatus = "Aman" | "Perlu Dirawat" | "Segera Disiram";