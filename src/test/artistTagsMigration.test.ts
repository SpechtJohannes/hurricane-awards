import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260720100000_create_artist_tags.sql"), "utf8").toLowerCase();

describe("artist tags migration", () => {
  it("normalizes the many-to-many model and prevents duplicates", () => {
    expect(sql).toContain("create table public.artist_tags");
    expect(sql).toContain("create table public.timetable_act_artist_tags");
    expect(sql).toContain("primary key (act_id, tag_id)");
    expect(sql).toContain("lower(regexp_replace(trim(name)");
    expect(sql).toContain("on delete cascade");
  });

  it("uses RLS and explicit function privileges", () => {
    expect(sql.match(/enable row level security/g)).toHaveLength(2);
    expect(sql).toContain("ha_has_admin_access");
    expect(sql).toContain("ha_participant_id_for_access");
    expect(sql.match(/security definer set search_path = public/g)).toHaveLength(5);
    expect(sql.match(/revoke all on function/g)).toHaveLength(5);
    expect(sql.match(/grant execute on function/g)).toHaveLength(5);
  });

  it("rejects empty names and makes assignment idempotent", () => {
    expect(sql).toContain("artist tag name is required");
    expect(sql).toContain("on conflict do nothing");
  });
});
