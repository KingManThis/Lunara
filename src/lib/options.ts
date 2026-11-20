import type { Flow } from "./cycle.ts";

export const FLOWS: { value: Flow; label: string; drops: number }[] = [
  { value: "spotting", label: "Spotting", drops: 0 },
  { value: "light", label: "Light", drops: 1 },
  { value: "medium", label: "Medium", drops: 2 },
  { value: "heavy", label: "Heavy", drops: 3 },
];

export const SYMPTOMS = [
  "Cramps", "Headache", "Bloating", "Tender breasts", "Acne", "Back pain", "Fatigue",
  "Nausea", "Cravings", "Insomnia", "Dizziness", "Diarrhea", "Constipation", "Discharge",
];

export const MOODS = [
  "😊 Happy", "😌 Calm", "⚡ Energetic", "🥰 Loving", "😢 Sad", "😟 Anxious",
  "😠 Irritable", "😩 Stressed", "🙃 Mood swings", "😴 Tired",
];
