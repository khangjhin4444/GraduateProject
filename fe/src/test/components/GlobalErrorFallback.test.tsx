import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GlobalErrorFallback } from "@/components/GlobalErrorFallback";
import { useRouteError, useNavigate } from "react-router";
import { queryClient } from "@/providers/QueryProvider";

vi.mock("react-router", () => ({
  useRouteError: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("@/providers/QueryProvider", () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

describe("GlobalErrorFallback Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });
  afterEach(() => {
    cleanup();
  });

  it("show default error message", () => {
    vi.mocked(useRouteError).mockReturnValue(new Error());

    render(<GlobalErrorFallback />);

    expect(screen.getByText("Error when loading page")).toBeInTheDocument();
    expect(
      screen.getByText("Cannot Connect to the server"),
    ).toBeInTheDocument();
  });

  it("show error from useRouteError", () => {
    const customError = new Error("Failed to fetch user data");
    vi.mocked(useRouteError).mockReturnValue(customError);

    render(<GlobalErrorFallback />);

    expect(screen.getByText("Error when loading page")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch user data")).toBeInTheDocument();
  });

  it("call queryClient.clear and navigate when press Reload Page", async () => {
    const user = userEvent.setup();
    vi.mocked(useRouteError).mockReturnValue(null);

    render(<GlobalErrorFallback />);

    const reloadButton = screen.getByRole("button", { name: "Reload Page" });
    await user.click(reloadButton);

    expect(queryClient.clear).toHaveBeenCalledOnce();

    expect(mockNavigate).toHaveBeenCalledWith(".", { replace: true });
  });
});
