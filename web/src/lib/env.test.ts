import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("points to localhost:8080 when nothing is configured", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_API_URL).toBe("http://localhost:8080");
  });

  it("keeps an absolute API URL without the trailing slash", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_API_URL: "https://api.example.com/" }).NEXT_PUBLIC_API_URL).toBe(
      "https://api.example.com",
    );
  });

  it("reads '/' as the site's own origin, for the Vercel proxy", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_API_URL: "/" }).NEXT_PUBLIC_API_URL).toBe("");
  });

  it("rejects other relative paths", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_API_URL: "/api" })).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("rejects schemes other than http and https", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_API_URL: "javascript:alert(1)" })).toThrow(/NEXT_PUBLIC_API_URL/);
    expect(() => parsePublicEnv({ NEXT_PUBLIC_API_URL: "ftp://api.example.com" })).toThrow(/NEXT_PUBLIC_API_URL/);
  });
});
