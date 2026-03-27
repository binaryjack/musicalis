/**
 * Note velocity constants - strict validation
 */
export const noteVelocity = {
  min: 1,
  max: 127,
  default: 80,
} as const;

export type NoteVelocity = typeof noteVelocity[keyof typeof noteVelocity];