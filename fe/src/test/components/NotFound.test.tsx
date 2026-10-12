import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFoundPage from "@/components/NotFound";

describe("NotFoundPage Component", () => {
  it("display 404 Not Found", () => {
    render(<NotFoundPage />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "404 Not Found",
    });
    expect(heading).toBeInTheDocument();
  });
});
