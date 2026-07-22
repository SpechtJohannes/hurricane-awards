import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MusicalPreferences } from "../components/MusicalPreferences";
import "../i18n";

describe("MusicalPreferences", () => {
  it("supports saved, multiple and removable selections plus reset and save", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn(); const onReset = vi.fn(); const onSave = vi.fn();
    render(<MusicalPreferences availableTags={[{ id: "rock", name: "Rock" }, { id: "indie", name: "Indie" }]} selectedTagIds={new Set(["rock"])} isLoading={false} isSaving={false} loadError="" saveError="" success="" onToggle={onToggle} onReset={onReset} onSave={onSave} />);
    expect(screen.getByRole("button", { name: /rock entfernen/i })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /indie auswählen/i }));
    await user.click(screen.getByRole("button", { name: /alle vorlieben zurücksetzen/i }));
    await user.click(screen.getByRole("button", { name: /vorlieben speichern/i }));
    expect(onToggle).toHaveBeenCalledWith("indie"); expect(onReset).toHaveBeenCalledOnce(); expect(onSave).toHaveBeenCalledOnce();
  });
});
