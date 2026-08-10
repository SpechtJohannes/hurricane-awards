import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminArtists } from "../components/AdminArtists";
import "../i18n";
import { addArtistTag, assignArtistTag, loadActArtistTags, loadArtistTags, removeArtistTag } from "../data/artistTags";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("../lib/supabase", () => ({ getSupabase: () => ({ rpc }) }));

const context = { participantAccessCode: "ADMIN" };

describe("artist tag data access", () => {
  beforeEach(() => rpc.mockReset());

  it("loads available tags and act assignments", async () => {
    rpc.mockResolvedValueOnce({ data: [{ id: "rock", name: "Rock" }], error: null });
    rpc.mockResolvedValueOnce({ data: [{ act_id: "act-1", tag_id: "rock", name: "Rock" }], error: null });
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

describe("AdminArtists tags", () => {
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

  it("creates artists in the dedicated artist administration", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<AdminArtists {...baseProps} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Künstler anlegen" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Neue Band" },
    });
    fireEvent.change(screen.getByLabelText("Beschreibung"), {
      target: { value: "Live" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        name: "Neue Band",
        description: "Live",
      }),
    );
  });

  it("shows assigned tags and excludes them from reusable suggestions", () => {
    render(<AdminArtists {...baseProps} />);
    expect(screen.getByText("Rock")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: /Vorhandenes Schlagwort/i });
    expect(within(select).queryByRole("option", { name: "Rock" })).not.toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Indie" })).toBeInTheDocument();
  });

  it("shows saving state while adding and supports removing", async () => {
    let finish: (() => void) | undefined;
    const onAddTag = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<AdminArtists {...baseProps} onAddTag={onAddTag} />);
    fireEvent.change(screen.getByPlaceholderText("Schlagwort eingeben"), { target: { value: "Electro" } });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(await screen.findByText("Speichere...")).toBeInTheDocument();
    finish?.();
    await waitFor(() => expect(onAddTag).toHaveBeenCalledWith("act-1", "Electro"));
    fireEvent.click(screen.getByRole("button", { name: /Rock entfernen/i }));
    await waitFor(() => expect(baseProps.onRemoveTag).toHaveBeenCalledWith("act-1", "rock"));
  });

  it("assigns an existing tag immediately and keeps act editing functional", async () => {
    render(<AdminArtists {...baseProps} />);
    fireEvent.change(screen.getByRole("combobox", { name: /Vorhandenes Schlagwort/i }), { target: { value: "indie" } });
    await waitFor(() => expect(baseProps.onAssignTag).toHaveBeenCalledWith("act-1", "indie"));
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    const nameInput = screen.getByDisplayValue("Band");
    expect(nameInput).toHaveFocus();
    expect(nameInput.closest("article")).toHaveTextContent("Rock");
  });

  it("keeps a failed inline edit open and shows the error in its card", async () => {
    const onUpdate = vi.fn().mockRejectedValue(new Error("Speichern fehlgeschlagen"));
    render(<AdminArtists {...baseProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    fireEvent.change(screen.getByDisplayValue("Band"), { target: { value: "Band Neu" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen");
    expect(screen.getByDisplayValue("Band Neu")).toBeInTheDocument();
  });

  it("rejects empty tags and exposes Supabase errors", async () => {
    const onAddTag = vi.fn().mockRejectedValue(new Error("database unavailable"));
    render(<AdminArtists {...baseProps} onAddTag={onAddTag} />);
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Bitte gib ein Schlagwort ein");
    fireEvent.change(screen.getByPlaceholderText("Schlagwort eingeben"), { target: { value: "Metal" } });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("konnte gerade nicht hinzugefügt werden");
  });
});
