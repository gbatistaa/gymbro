import { atomWithStorage } from "jotai/utils";
import type { UserSummary } from "@/contracts/auth";

export const SESSION_STORAGE_KEY = "gymbro.session";

export type Session = {
  user: UserSummary;
};

export const sessionAtom = atomWithStorage<Session | null>(
  SESSION_STORAGE_KEY,
  null,
);
