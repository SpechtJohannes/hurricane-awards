import { describe, expect, it, vi } from "vitest";
import {
  normalizeGeocodingResponse,
  resolveGeocoding,
  simplifiedGeocodingQuery,
} from "../../supabase/functions/_shared/geocoding";

const scheesselResponse = {
  results: [{
    name: "Scheeßel",
    admin1: "Niedersachsen",
    country: "Deutschland",
    latitude: 53.1692,
    longitude: 9.4821,
    timezone: "Europe/Berlin",
  }],
};

describe("camp location geocoding", () => {
  it("returns a direct match without changing the complete input", async () => {
    const search = vi.fn().mockResolvedValue(scheesselResponse);
    await expect(resolveGeocoding("Eichenring Scheeßel", search)).resolves.toMatchObject({
      status: "available", matchedQuery: "Eichenring Scheeßel", fallbackUsed: false,
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("Eichenring Scheeßel");
  });

  it("uses the simplified locality after a direct miss", async () => {
    const search = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce(scheesselResponse);
    await expect(resolveGeocoding("Eichenring Scheeßel", search)).resolves.toMatchObject({
      status: "available", matchedQuery: "Scheeßel", fallbackUsed: true,
      result: { label: "Scheeßel, Niedersachsen, Deutschland" },
    });
    expect(search).toHaveBeenNthCalledWith(1, "Eichenring Scheeßel");
    expect(search).toHaveBeenNthCalledWith(2, "Scheeßel");
  });

  it("simplifies Eichenring Scheeßel nachvollziehbar to Scheeßel", () => {
    expect(simplifiedGeocodingQuery("Eichenring Scheeßel")).toBe("Scheeßel");
    expect(simplifiedGeocodingQuery("Eichenring 1 Scheeßel")).toBe("Scheeßel");
    expect(simplifiedGeocodingQuery("Festivalgelände Scheeßel")).toBeNull();
  });

  it("returns not_found when direct and simplified searches miss", async () => {
    const search = vi.fn().mockResolvedValue({ results: [] });
    await expect(resolveGeocoding("Eichenring Scheeßel", search)).resolves.toEqual({ status: "not_found" });
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("propagates a technical error on the first request without masking it", async () => {
    const search = vi.fn().mockRejectedValue(new Error("service unavailable"));
    await expect(resolveGeocoding("Eichenring Scheeßel", search)).rejects.toThrow("service unavailable");
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("propagates a technical error on the fallback request", async () => {
    const search = vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("timeout"));
    await expect(resolveGeocoding("Eichenring Scheeßel", search)).rejects.toThrow("timeout");
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("normalizes valid coordinates, timezone and administrative labels", () => {
    expect(normalizeGeocodingResponse(scheesselResponse)).toEqual({
      label: "Scheeßel, Niedersachsen, Deutschland",
      latitude: 53.1692,
      longitude: 9.4821,
      timezone: "Europe/Berlin",
    });
  });
});
