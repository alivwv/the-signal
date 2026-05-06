import { describe, it, expect } from "vitest";

describe("Supabase env config", () => {
  it("NEXT_PUBLIC_SUPABASE_URL is the project root, not a sub-path", () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
  });

  it("NEXT_PUBLIC_SITE_URL is a clean origin", () => {
    const url = process.env.NEXT_PUBLIC_SITE_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https?:\/\/[^/]+$/);
  });
});
