import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260722100000_create_participant_artist_tag_preferences.sql"), "utf8").toLowerCase();

describe("artist tag preferences migration", () => {
  it("is transactional, normalized, unique and cascade-safe", () => {
    expect(sql.trim()).toMatch(/^--[\s\S]*begin;/);
    expect(sql).toContain("primary key (participant_id, artist_tag_id)");
    expect(sql.match(/on delete cascade/g)).toHaveLength(2);
    expect(sql.trim()).toMatch(/commit;$/);
    expect(sql).toContain("participant_id text not null references public.participants(id)");
    expect(sql.match(/v_participant_id text;/g)).toHaveLength(2);
    expect(sql).not.toContain("ha_participant_id_for_access(p_participant_access_code)::uuid");
  });
  it("denies direct access and exposes only own-preference RPCs", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("revoke all on table");
    expect(sql.match(/ha_participant_id_for_access/g)).toHaveLength(2);
    expect(sql.match(/security definer set search_path = public/g)).toHaveLength(2);
    expect(sql).not.toContain("p_participant_id");
  });
  it("atomically replaces, deduplicates and validates tag ids", () => {
    expect(sql).toContain("delete from public.participant_artist_tag_preferences");
    expect(sql).toContain("select distinct id from unnest");
    expect(sql).toContain("invalid artist tag id");
  });
});
