import {
  userSummarySchema,
  type LoginInput,
  type SignUpInput,
  type UserSummary,
} from "@/contracts/auth";
import { request } from "@/lib/http";

export function login(input: LoginInput): Promise<UserSummary> {
  return request(
    { method: "POST", url: "/api/auth/login", data: input },
    userSummarySchema,
  );
}

export function register(input: SignUpInput): Promise<UserSummary> {
  return request(
    { method: "POST", url: "/api/auth/register", data: input },
    userSummarySchema,
  );
}
