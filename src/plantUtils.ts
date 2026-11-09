import { Plant, CareStatus } from "../types/Plant";

export function getNextWateringDate(
  plant: Plant
): Date | null {
  if (!plant.lastWatered) {
    return null;
  }

  const lastDate = new Date(plant.lastWatered);

  if (isNaN(lastDate.getTime())) {
    return null;
  }

  const nextDate = new Date(lastDate);

  nextDate.setDate(
    nextDate.getDate() + plant.wateringInterval
  );

  return nextDate;
}

export function getCareStatus(
  plant: Plant
): CareStatus {
  const nextDate = getNextWateringDate(plant);

  if (!nextDate) {
    return "Perlu Dirawat";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  nextDate.setHours(0, 0, 0, 0);

  const difference =
    nextDate.getTime() - today.getTime();

  const daysRemaining = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining <= 0) {
    return "Segera Disiram";
  }

  if (daysRemaining <= 2) {
    return "Perlu Dirawat";
  }

  return "Aman";
}

export function formatDate(
  date: Date | null
): string {
  if (!date || isNaN(date.getTime())) {
    return "Belum tersedia";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}