import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminFestival } from "../components/AdminFestival";
import { EventStatusCard } from "../components/EventStatusCard";
import "../i18n";

const commonProps = {
  error: "",
  isSaving: false,
  festivalCode: "",
  festivalCodeError: "",
  isLoadingFestivalCode: false,
  isSavingFestivalCode: false,
  isExporting: false,
  onSaveFestivalCode: vi.fn(),
  onArchive: vi.fn().mockResolvedValue("archive"),
  onExport: vi.fn(),
};

describe("event settings UI", () => {
  it("shows existing dates and saves valid settings", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <AdminFestival
        {...commonProps}
        festivalName="Festival"
        eventStartDate="2026-06-19"
        eventEndDate="2026-06-21"
        onSave={onSave}
      />,
    );
    expect(screen.getByLabelText(/startdatum/i)).toHaveValue("2026-06-19");
    expect(screen.getByLabelText(/enddatum/i)).toHaveValue("2026-06-21");
    await userEvent.click(
      screen.getByRole("button", { name: /eventeinstellungen speichern/i }),
    );
    expect(onSave).toHaveBeenCalledWith({
      name: "Festival",
      startDate: "2026-06-19",
      endDate: "2026-06-21",
    });
    expect(
      await screen.findByText(/eventeinstellungen wurden gespeichert/i),
    ).toBeVisible();
  });

  it("rejects incomplete and reversed periods and permits clearing both", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <AdminFestival
        {...commonProps}
        festivalName="Festival"
        eventStartDate="2026-06-19"
        eventEndDate="2026-06-21"
        onSave={onSave}
      />,
    );
    const start = screen.getByLabelText(/startdatum/i);
    const end = screen.getByLabelText(/enddatum/i);
    await userEvent.clear(end);
    await userEvent.click(
      screen.getByRole("button", { name: /eventeinstellungen speichern/i }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /gemeinsam ausgefüllt/i,
    );
    await userEvent.type(end, "2026-06-18");
    await userEvent.click(
      screen.getByRole("button", { name: /eventeinstellungen speichern/i }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /nicht vor dem startdatum/i,
    );
    await userEvent.clear(start);
    await userEvent.clear(end);
    await userEvent.click(
      screen.getByRole("button", { name: /eventeinstellungen speichern/i }),
    );
    expect(onSave).toHaveBeenCalledWith({
      name: "Festival",
      startDate: null,
      endDate: null,
    });
  });

  it.each([
    ["2026-06-18T12:00:00+02:00", /morgen beginnt/i],
    ["2026-06-19T12:00:00+02:00", /tag 1 von 3/i],
    ["2026-06-20T12:00:00+02:00", /tag 2 von 3/i],
    ["2026-06-21T12:00:00+02:00", /tag 3 von 3/i],
    ["2026-06-22T12:00:00+02:00", /event ist beendet/i],
  ])("shows the dashboard status at %s", (instant, expected) => {
    render(
      <EventStatusCard
        startDate="2026-06-19"
        endDate="2026-06-21"
        referenceInstant={new Date(instant)}
      />,
    );
    expect(screen.getByText(expected)).toBeVisible();
  });

  it("hides the dashboard status without a complete period", () => {
    const { container } = render(
      <EventStatusCard startDate={null} endDate={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
