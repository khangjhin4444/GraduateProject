import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DesktopProductCategory from "@/components/Header/_components/DesktopProductCategory";

vi.mock("@/shared/ProductSubtype", () => ({
  SUBTYPES: {
    keyboardkit: ["75", "tkl"],
  },
}));

describe("DesktopProductCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });
  const defaultProps = {
    type: "keyboardkit",
    isOpen: false,
    onOpen: vi.fn(),
    onClose: vi.fn(),
    onNavigate: vi.fn(),
  };

  const renderComponent = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <DesktopProductCategory {...props} />
      </MemoryRouter>,
    );
  };

  it("renders the main category link correctly", () => {
    renderComponent();

    const mainLink = screen.getByRole("link", { name: /Keyboard Kit/i });
    expect(mainLink).toBeInTheDocument();
    expect(mainLink).toHaveAttribute("href", "/collection/keyboardkit");
  });

  it("triggers onOpen and onClose on mouse enter and leave", async () => {
    const user = userEvent.setup();
    renderComponent();

    const container = screen.getByText(/Keyboard Kit/i).parentElement!;

    await user.hover(container);
    expect(defaultProps.onOpen).toHaveBeenCalledOnce();

    await user.unhover(container);
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("renders subtype links and triggers onNavigate when clicked", async () => {
    const user = userEvent.setup();
    renderComponent({ ...defaultProps, isOpen: true });

    const subtypeLink = screen.getByRole("link", { name: "75% or less" });
    expect(subtypeLink).toBeInTheDocument();
    expect(subtypeLink).toHaveAttribute("href", "/collection/keyboardkit/75");

    await user.click(subtypeLink);
    expect(defaultProps.onNavigate).toHaveBeenCalledOnce();
  });
});
