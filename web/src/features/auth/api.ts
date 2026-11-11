import {
  authTokensSchema,
  authUserSchema,
  userSummarySchema,
  type AuthTokens,
  type LoginInput,
  type SignUpInput,
  type UserSummary,
} from "@/contracts/auth";
import { request } from "@/lib/http";

export function login(input: LoginInput): Promise<AuthTokens> {
  return request(
    { method: "POST", url: "/api/auth/login", data: input },
    authTokensSchema,
  );
}

export function register(input: SignUpInput) {
  return request(
    { method: "POST", url: "/api/auth/register", data: input },
    authUserSchema,
  );
}

export function getMe(accessToken: string): Promise<UserSummary> {
  return request(
    {
      url: "/api/users/me",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    userSummarySchema,
  );
}
