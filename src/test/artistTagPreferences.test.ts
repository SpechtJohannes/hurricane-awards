import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadArtistTagPreferences,
  replaceArtistTagPreferences,
} from "../data/artistTagPreferences";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("../lib/supabase", () => ({ getSupabase: () => ({ rpc }) }));

const context = { participantAccessCode: "ALICE42" };

describe("artist tag preference data access", () => {
  beforeEach(() => rpc.mockReset());

  it("loads the current participant preferences through the protected RPC", async () => {
    const preferences = [{ id: "tag-rock", name: "Rock" }];
    rpc.mockResolvedValueOnce({ data: preferences, error: null });

    await expect(loadArtistTagPreferences(context)).resolves.toEqual(preferences);
    expect(rpc).toHaveBeenCalledWith("ha_get_own_artist_tag_preferences", {
      p_participant_access_code: "ALICE42",
    });
  });

  it("sends multiple unique artist tag ids for the participant resolved by access code", async () => {
    const saved = [
      { id: "tag-rock", name: "Rock" },
      { id: "tag-pop", name: "Pop" },
    ];
    rpc.mockResolvedValueOnce({ data: saved, error: null });

    await expect(
      replaceArtistTagPreferences(["tag-rock", "tag-pop", "tag-rock"], context),
    ).resolves.toEqual(saved);
    expect(rpc).toHaveBeenCalledWith("ha_replace_own_artist_tag_preferences", {
      p_participant_access_code: "ALICE42",
      p_artist_tag_ids: ["tag-rock", "tag-pop"],
    });
  });

  it("sends an empty tag list when resetting all preferences", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });

    await expect(replaceArtistTagPreferences([], context)).resolves.toEqual([]);
    expect(rpc).toHaveBeenCalledWith("ha_replace_own_artist_tag_preferences", {
      p_participant_access_code: "ALICE42",
      p_artist_tag_ids: [],
    });
  });

  it("exposes the concrete Supabase write error to the caller", async () => {
    const error = { code: "42702", message: "column reference id is ambiguous" };
    rpc.mockResolvedValueOnce({ data: null, error });

    await expect(replaceArtistTagPreferences(["tag-rock"], context)).rejects.toBe(error);
  });
});
