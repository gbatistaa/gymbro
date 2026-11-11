import { atomWithStorage } from "jotai/utils";
import type { AuthTokens, UserSummary } from "@/contracts/auth";

export type Session = {
  tokens: AuthTokens;
  user: UserSummary;
};

export const sessionAtom = atomWithStorage<Session | null>("gymbro.session", null);
