import { atom } from 'jotai';
import { z } from 'zod';

// Shape do GET /api/users/me do backend Spring (tasks/plan.md)
export const profileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;

// null = sem sessão; preenchido após login/refresh
export const profileAtom = atom<Profile | null>(null);
