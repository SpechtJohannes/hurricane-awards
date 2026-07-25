import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminLoadingNotice } from "../components/AdminLoadingNotice";

describe("AdminLoadingNotice", () => {
  it("renders an accessible admin loading status", () => {
    render(<AdminLoadingNotice message="Loading entries" />);

    const notice = screen.getByRole("status");

    expect(notice.tagName).toBe("OUTPUT");
    expect(notice).toHaveTextContent("Loading entries");
    expect(notice).toHaveClass("admin__notice", "semantic-status");
  });
});
