import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTimetableActs } from "../components/AdminTimetableActs";
import "../i18n";
import { addArtistTag, assignArtistTag, loadActArtistTags, loadArtistTags, removeArtistTag } from "../data/artistTags";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("../lib/supabase", () => ({ getSupabase: () => ({ rpc }) }));

const context = { participantAccessCode: "ADMIN" };

describe("artist tag data access", () => {
  beforeEach(() => rpc.mockReset());

  it("loads available tags and act assignments", async () => {
    rpc.mockResolvedValueOnce({ data: [{ id: "rock", name: "Rock" }], error: null });
    rpc.mockResolvedValueOnce({ data: [{ act_id: "act-1", id: "rock", name: "Rock" }], error: null });
    await expect(loadArtistTags(context)).resolves.toEqual([{ id: "rock", name: "Rock" }]);
    await expect(loadActArtistTags(context)).resolves.toEqual([{ actId: "act-1", id: "rock", name: "Rock" }]);
  });

  it("creates or reuses, assigns and removes tags through protected RPCs", async () => {
    rpc.mockResolvedValue({ data: [{ id: "rock", name: "Rock" }], error: null });
    await addArtistTag("act-1", " Rock ", context);
    await assignArtistTag("act-2", "rock", context);
    await removeArtistTag("act-1", "rock", context);
    expect(rpc).toHaveBeenNthCalledWith(1, "ha_admin_add_artist_tag", { p_participant_access_code: "ADMIN", p_act_id: "act-1", p_name: " Rock " });
    expect(rpc).toHaveBeenNthCalledWith(2, "ha_admin_assign_artist_tag", { p_participant_access_code: "ADMIN", p_act_id: "act-2", p_tag_id: "rock" });
    expect(rpc).toHaveBeenNthCalledWith(3, "ha_admin_remove_artist_tag", { p_participant_access_code: "ADMIN", p_act_id: "act-1", p_tag_id: "rock" });
  });
});

describe("AdminTimetableActs tags", () => {
  const baseProps = {
    acts: [{ id: "act-1", name: "Band", description: null }],
    tags: [{ id: "rock", name: "Rock" }, { id: "indie", name: "Indie" }],
    actTags: [{ actId: "act-1", id: "rock", name: "Rock" }],
    error: "", isLoading: false, deletingActId: null,
    onCreate: vi.fn(), onUpdate: vi.fn(), onDelete: vi.fn(),
    onAddTag: vi.fn().mockResolvedValue(undefined),
    onAssignTag: vi.fn().mockResolvedValue(undefined),
    onRemoveTag: vi.fn().mockResolvedValue(undefined),
  };

  it("shows assigned tags and excludes them from reusable suggestions", () => {
    render(<AdminTimetableActs {...baseProps} />);
    expect(screen.getByText("Rock")).toBeInTheDocument();
    const list = document.querySelector("datalist");
    expect(list).not.toBeNull();
    expect(list?.querySelector('option[value="Rock"]')).toBeNull();
    expect(list?.querySelector('option[value="Indie"]')).not.toBeNull();
  });

  it("shows saving state while adding and supports removing", async () => {
    let finish: (() => void) | undefined;
    const onAddTag = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<AdminTimetableActs {...baseProps} onAddTag={onAddTag} />);
    fireEvent.change(screen.getByLabelText(/Schlagwort auswählen/i), { target: { value: "Electro" } });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(await screen.findByText("Speichere...")).toBeInTheDocument();
    finish?.();
    await waitFor(() => expect(onAddTag).toHaveBeenCalledWith("act-1", "Electro"));
    fireEvent.click(screen.getByRole("button", { name: /Rock entfernen/i }));
    await waitFor(() => expect(baseProps.onRemoveTag).toHaveBeenCalledWith("act-1", "rock"));
  });
});
