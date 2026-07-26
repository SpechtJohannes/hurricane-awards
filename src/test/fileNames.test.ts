import { describe, expect, it } from "vitest";
import { trimTrailingHyphens } from "../data/fileNames";

describe("trimTrailingHyphens", () => {
  it("entfernt nur abschließende Bindestriche", () => {
    expect(trimTrailingHyphens("festival-name")).toBe("festival-name");
    expect(trimTrailingHyphens("festival-name---")).toBe("festival-name");
    expect(trimTrailingHyphens("---")).toBe("");
    expect(trimTrailingHyphens("")).toBe("");
  });
});
