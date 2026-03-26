import { ColorMappingPreset } from '../enums';

/**
 * Represents color mappings for note highlighting
 */
export interface ColorMapping {
  id: string;
  name: string;
  preset: ColorMappingPreset;
  colors: ColorMappingRules;
  createdAt: number;
  updatedAt: number;
}

/**
 * Color mapping rules based on preset type
 */
export interface ColorMappingRules {
  // For BY_HAND preset
  leftHand?: string; // hex color
  rightHand?: string; // hex color

  // For BY_OCTAVE preset
  octaveColors?: Record<number, string>; // octave number to hex color

  // For BY_RANGE preset
  rangeColors?: Array<{
    from: string; // e.g., "C4"
    to: string; // e.g., "E4"
    color: string; // hex
  }>;

  // For CUSTOM preset
  noteColors?: Record<string, string>; // noteId to hex color
}
