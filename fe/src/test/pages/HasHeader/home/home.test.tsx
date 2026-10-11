import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/pages/HasHeader/home";

vi.mock("@/pages/HasHeader/home/_components/Carosel", () => ({
  default: () => <div data-testid="home-carousel" />,
}));

vi.mock("@/pages/HasHeader/home/_components/KeyboardSection", () => ({
  default: () => <div data-testid="keyboard-section" />,
}));

vi.mock("@/pages/HasHeader/home/_components/SwitchKeycapSection", () => ({
  default: () => <div data-testid="switch-keycap-section" />,
}));

describe("Home page", () => {
  it("renders the carousel and both in-stock product sections", () => {
    render(<Page />);

    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByTestId("home-carousel")).toBeInTheDocument();
    expect(screen.getByTestId("keyboard-section")).toBeInTheDocument();
    expect(screen.getByTestId("switch-keycap-section")).toBeInTheDocument();
  });
});
