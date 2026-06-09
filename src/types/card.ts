import { z } from 'zod';

export const CardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  cost: z.number().min(0),
  attack: z.number().min(0),
  health: z.number().min(0),
  maxHealth: z.number().min(0),
  type: z.enum(['minion', 'spell', 'weapon']),
  element: z.enum(['fire', 'water', 'earth', 'air', 'shadow', 'light']).optional(),
  image: z.string().optional(),
  effects: z.array(z.string()).optional(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  version: z.string().default('1.0'),
});

export type Card = z.infer<typeof CardSchema>;

export const DeckSchema = z.array(CardSchema);
export type Deck = z.infer<typeof DeckSchema>;

export const CardZone = z.enum(['deck', 'hand', 'board', 'graveyard', 'play']);
export type CardZone = z.infer<typeof CardZone>;