import { Position } from "./types";

export const POSITIONS = [Position.GK, Position.DC, Position.MC, Position.ST];

export const NATIONS = [
  "Argentina", "Brasil", "Inglaterra", "Francia", "Alemania", "Italia", "España", "Países Bajos", "Portugal", "Bélgica"
];

export const GAME_SPEED_MS = 200; // ms per match minute simulation

export const ATTRIBUTE_COLORS = {
  LOW: "text-slate-600",    // 1-9 Deep Gray
  AVG: "text-blue-800",     // 10-15 Navy Blue
  HIGH: "text-orange-700",  // 16-20 Burnt Orange/Amber for better light visibility
};

export const getAttributeColor = (value: number) => {
  if (value >= 16) return ATTRIBUTE_COLORS.HIGH;
  if (value >= 10) return ATTRIBUTE_COLORS.AVG;
  return ATTRIBUTE_COLORS.LOW;
};