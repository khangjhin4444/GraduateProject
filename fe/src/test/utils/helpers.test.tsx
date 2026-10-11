import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getHexColor } from "@/utils/colors";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";
import { formatRequest } from "@/utils/formatRequest";
import { formatSubtype } from "@/utils/formatSubtype";
import { getClassTextByStatus } from "@/utils/getClassTextByStatus";
import { getIconByStatus } from "@/utils/getIconByStatus";

afterEach(() => cleanup());

describe("getHexColor", () => {
  it("returns the mapped hex value for known colors", () => {
    expect(getHexColor("Tiffany")).toBe("#0ABAB5");
    expect(getHexColor("Milky White")).toBe("#FBF8F1");
  });

  it("returns the fallback color for unknown color names", () => {
    expect(getHexColor("Unknown color")).toBe("#D1D5DB");
  });
});

describe("formatCurrency", () => {
  it("formats amounts using Vietnamese currency grouping", () => {
    expect(formatCurrency(1250000)).toBe("1.250.000 VND");
    expect(formatCurrency(0)).toBe("0 VND");
    expect(formatCurrency(-2500)).toBe("-2.500 VND");
  });
});

describe("formatDateTime", () => {
  it("formats Date, string, and numeric date inputs with zero padding", () => {
    const date = new Date(2026, 0, 2, 3, 4);

    expect(formatDateTime(date)).toBe("03:04 02/01/2026");
    expect(formatDateTime("2026-10-11T15:53:00")).toBe(
      formatDateTime(new Date("2026-10-11T15:53:00")),
    );
    expect(formatDateTime(date.getTime())).toBe("03:04 02/01/2026");
  });

  it("throws for an invalid date input", () => {
    expect(() => formatDateTime("not a date")).toThrow(
      new Error("Invalid date input"),
    );
  });
});

describe("formatRequest", () => {
  it.each([
    ["keyboardkit", "KeyboardKit"],
    ["75", "75%"],
    ["silent", "Silent"],
  ])("formats the request value %s", (value, expected) => {
    expect(formatRequest(value)).toBe(expected);
  });

  it("returns unrecognized request values unchanged", () => {
    expect(formatRequest("custom-request")).toBe("custom-request");
  });
});

describe("formatSubtype", () => {
  it.each([
    ["keyboardkit", "Keyboard Kit"],
    ["KeyboardKit", "Keyboard Kit"],
    ["75", "75% or less"],
    ["artisan", "Artisan"],
  ])("formats the subtype value %s", (value, expected) => {
    expect(formatSubtype(value)).toBe(expected);
  });

  it("returns unrecognized subtype values unchanged", () => {
    expect(formatSubtype("custom-subtype")).toBe("custom-subtype");
  });
});

describe("getClassTextByStatus", () => {
  it.each([
    ["Pending", "bg-accent/20 border border-accent"],
    ["Confirmed", "bg-primary/20 border border-primary text-primary"],
    ["Delivered", "bg-background/20 border border-foreground/20"],
    ["Canceled", "bg-background/20 border border-foreground/20"],
  ])("returns the status classes for %s", (status, expected) => {
    expect(getClassTextByStatus(status)).toBe(expected);
  });

  it("returns undefined for an unknown status", () => {
    expect(getClassTextByStatus("Unknown")).toBeUndefined();
  });
});

describe("getIconByStatus", () => {
  it.each([
    ["Pending", "lucide-rotate-cw-fading-clock"],
    ["Confirmed", "lucide-package"],
    ["Delivered", "lucide-truck"],
    ["Canceled", "lucide-circle-x"],
  ])("renders the %s status icon", (status, expectedClass) => {
    const { container } = render(getIconByStatus(status));

    expect(container.querySelector("svg")).toHaveClass(expectedClass);
    expect(container.querySelector("svg")).toHaveClass("w-4", "h-4");
  });

  it("returns undefined for an unknown status", () => {
    expect(getIconByStatus("Unknown")).toBeUndefined();
  });
});
