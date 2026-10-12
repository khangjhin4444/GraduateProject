import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import MobileProductCategory from "@/components/Header/_components/MobileProductCategory";
import { useSidebar } from "@/components/ui/sidebar";

vi.mock("@/shared/ProductSubtype", () => ({
  SUBTYPES: {
    keyboardkit: ["75", "tkl"],
  },
}));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: vi.fn(),
}));

describe("MobileProductCategory", () => {
  const mockSetOpenMobile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSidebar).mockReturnValue({
      setOpenMobile: mockSetOpenMobile,
    } as any);
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the main category link and accordion trigger", () => {
    render(
      <MemoryRouter>
        <MobileProductCategory type="keyboardkit" />
      </MemoryRouter>,
    );

    const mainLink = screen.getByRole("link", { name: /Keyboard Kit/i });
    expect(mainLink).toBeInTheDocument();
    expect(mainLink).toHaveAttribute("href", "/collection/keyboardkit");

    const accordionTrigger = screen.getByRole("button", {
      name: /Toggle Keyboard Kit subtypes/i,
    });
    expect(accordionTrigger).toBeInTheDocument();
  });

  it("closes the mobile sidebar when a navigation link is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MobileProductCategory type="keyboardkit" />
      </MemoryRouter>,
    );

    const mainLink = screen.getByRole("link", { name: /Keyboard Kit/i });
    await user.click(mainLink);

    expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
  });
});
