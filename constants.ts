import { Position } from "./types";

export const POSITIONS = [Position.GK, Position.DC, Position.MC, Position.ST];

export const NATIONS = [
  "Argentina", "Brasil", "Inglaterra", "Francia", "Alemania", "Italia", "España", "Países Bajos", "Portugal", "Bélgica"
];

export const GAME_SPEED_MS = 200; // ms per match minute simulation

export const ATTRIBUTE_COLORS = {
  LOW: "text-gray-500",      // 1-10: Light gray
  AVG: "text-black",         // 11-15: Black
  HIGH: "text-blue-600"      // 16-20: Electric blue
};

export const ATTRIBUTE_BG_COLORS = {
  LOW: "bg-gray-200",        // 1-10: Light gray background
  AVG: "bg-gray-400",        // 11-15: Medium gray background
  HIGH: "bg-blue-600 text-white"  // 16-20: Blue background with white text
};

export const getAttributeColor = (value: number) => {
  if (value >= 16) return ATTRIBUTE_COLORS.HIGH;
  if (value >= 11) return ATTRIBUTE_COLORS.AVG;
  return ATTRIBUTE_COLORS.LOW;
};

export const getAttributeBgClass = (value: number) => {
  if (value >= 16) return ATTRIBUTE_BG_COLORS.HIGH;
  if (value >= 11) return ATTRIBUTE_BG_COLORS.AVG;
  return ATTRIBUTE_BG_COLORS.LOW;
};