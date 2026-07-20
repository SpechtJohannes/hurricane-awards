import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260720100000_create_artist_tags.sql"), "utf8").toLowerCase();
const ambiguityFixSql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260720110000_fix_artist_tag_name_ambiguity.sql",
  ),
  "utf8",
).toLowerCase();

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
    expect(sql).toContain("on conflict (lower(regexp_replace(trim(name)");
    expect(sql).toContain("do update set name = artist_tags.name");
  });

  it("removes only the act assignment and retains the reusable tag", () => {
    const removeFunction = sql.slice(sql.indexOf("create function public.ha_admin_remove_artist_tag"));
    expect(removeFunction).toContain("delete from public.timetable_act_artist_tags");
    expect(removeFunction).not.toContain("delete from public.artist_tags");
  });

  it("qualifies artist tag columns in the corrected add RPC", () => {
    expect(ambiguityFixSql).toContain(
      "create or replace function public.ha_admin_add_artist_tag",
    );
    expect(ambiguityFixSql).toContain("normalized_tag_name text");
    expect(ambiguityFixSql).toContain(
      "insert into public.artist_tags as artist_tag (name)",
    );
    expect(ambiguityFixSql).toContain("returning artist_tag.id into artist_tag_id");
    expect(ambiguityFixSql).toContain("trim(artist_tag.name)");
    expect(ambiguityFixSql).toContain(
      "select artist_tag.id, artist_tag.name",
    );
    expect(ambiguityFixSql).not.toMatch(/trim\(name\)/);
    expect(ambiguityFixSql).not.toMatch(/select\s+id,\s*name/);
    expect(ambiguityFixSql).not.toMatch(/returning\s+id(?:,|\s)/);
  });

  it("keeps the corrected RPC secured and explicitly granted", () => {
    expect(ambiguityFixSql).toContain("security definer");
    expect(ambiguityFixSql).toContain("set search_path = public");
    expect(ambiguityFixSql).toContain("ha_has_admin_access");
    expect(ambiguityFixSql).toContain(
      "revoke all on function public.ha_admin_add_artist_tag(text, uuid, text)",
    );
    expect(ambiguityFixSql).toContain(
      "grant execute on function public.ha_admin_add_artist_tag(text, uuid, text)",
    );
  });
});
