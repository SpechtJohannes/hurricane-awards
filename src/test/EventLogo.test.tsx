import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminEventLogo } from "../components/AdminEventLogo";
import { EventBrand } from "../components/EventBrand";
import { eventLogoMaxFileSize } from "../data/festivalLogo";
import i18n from "../i18n";

describe("EventBrand", () => {
  it("zeigt ohne Logo den Festivalnamen", async () => {
    await i18n.changeLanguage("de");
    render(
      <EventBrand
        festivalName="Hurricane Awards 2026"
        logoUrl={null}
        onClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Hurricane Awards 2026" }),
    ).toBeVisible();
  });

  it("zeigt ein Logo und faellt bei einem Bildfehler auf den Namen zurueck", async () => {
    await i18n.changeLanguage("de");
    render(
      <EventBrand
        festivalName="Hurricane Awards 2026"
        logoUrl="https://example.test/logo.png"
        onClick={vi.fn()}
      />,
    );

    const logo = screen.getByRole("img", {
      name: "Logo von Hurricane Awards 2026",
    });
    expect(logo).toHaveAttribute("src", "https://example.test/logo.png");

    fireEvent.error(logo);

    expect(
      screen.getByRole("heading", { name: "Hurricane Awards 2026" }),
    ).toBeVisible();
  });
});

describe("AdminEventLogo", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("de");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:event-logo-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  function renderAdminLogo(logoUrl: string | null = null) {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const onRemove = vi.fn().mockResolvedValue(undefined);
    return {
      onUpload,
      onRemove,
      ...render(
        <AdminEventLogo
          logoUrl={logoUrl}
          isUploading={false}
          isRemoving={false}
          onUpload={onUpload}
          onRemove={onRemove}
        />,
      ),
    };
  }

  it("lehnt nicht unterstuetzte und zu grosse Dateien ab", async () => {
    renderAdminLogo();
    const input = screen.getByLabelText(/logo auswählen/i);

    fireEvent.change(input, {
      target: {
        files: [new File(["text"], "logo.txt", { type: "text/plain" })],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /PNG-, JPEG- oder WebP/i,
    );

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(eventLogoMaxFileSize + 1)], "logo.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/maximal 2 MB/i);
  });

  it("zeigt fuer eine gueltige Datei eine lokale Vorschau und raeumt sie auf", async () => {
    const { unmount } = renderAdminLogo();
    const user = userEvent.setup();

    await user.upload(
      screen.getByLabelText(/logo auswählen/i),
      new File(["image"], "logo.webp", { type: "image/webp" }),
    );

    expect(screen.getByRole("img", { name: /vorschau/i })).toHaveAttribute(
      "src",
      "blob:event-logo-preview",
    );
    expect(screen.getByText(/noch nicht gespeichert/i)).toBeVisible();

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:event-logo-preview");
  });

  it("entfernt ein gespeichertes Logo erst nach Bestaetigung", async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(
      <AdminEventLogo
        logoUrl="https://example.test/logo.png"
        isUploading={false}
        isRemoving={false}
        onUpload={vi.fn()}
        onRemove={onRemove}
      />,
    );
    const user = userEvent.setup();
    const removeButton = screen.getByRole("button", {
      name: /logo entfernen/i,
    });

    await user.click(removeButton);
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(removeButton);
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  });
});
