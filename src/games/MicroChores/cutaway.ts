// Cutaways: the 1s mockery beat between microgames. While Ocho scrubs by hand,
// Tobias's family has the same chore handled by staff, robots, or an AI. Input
// is frozen during these (the orchestrator gates it). Pure rub-it-in.

export type CutawayKind = 'butler' | 'robot' | 'ai';

export type Cutaway = {
  kind: CutawayKind;
  caption: string;
};

const CUTAWAYS: Cutaway[] = [
  { kind: 'butler', caption: 'TOBIAS: “JEEVES, THE DISHES.”' },
  { kind: 'butler', caption: 'THE BUTLER FOLDS IT ALL.' },
  { kind: 'robot', caption: 'CHORE-BOT 9000: DONE IN 0.2s' },
  { kind: 'robot', caption: 'ROBO-MAID HANDLES IT.' },
  { kind: 'ai', caption: 'AI DID HIS HOMEWORK.' },
  { kind: 'ai', caption: 'AI ORDERED DINNER. AGAIN.' },
];

/** Pick a cutaway, avoiding an immediate repeat of the same line. */
export function pickCutaway(lastCaption: string | null): Cutaway {
  const pool = CUTAWAYS.filter((c) => c.caption !== lastCaption);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const CUTAWAY_MS = 1000;
