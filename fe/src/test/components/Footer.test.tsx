import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Footer from "@/components/Footer";

describe("Footer Component", () => {
  afterEach(() => cleanup());
  it("renders the footer semantic HTML element", () => {
    render(<Footer />);
    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toBeInTheDocument();
  });

  it("displays the correct brand name, owner, and branch information", () => {
    render(<Footer />);

    expect(
      screen.getAllByRole("heading", { level: 3, name: "JK Keyboard" })[0],
    ).toBeInTheDocument();

    expect(screen.getByText("Owner: Nguyen Le Duy Khang")).toBeInTheDocument();
    expect(
      screen.getByText(/Ha Noi Branch: 102 Đ. Trần Phú/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ho Chi Minh Branch: 497 Hòa Hảo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/© 2026 My Website\. All Rights Reserved\./i),
    ).toBeInTheDocument();
  });

  it("renders the Facebook plugin iframe with correct attributes", () => {
    const { container } = render(<Footer />);

    const iframe = container.querySelector("iframe");

    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("facebook.com"),
    );
    expect(iframe).toHaveAttribute("width", "300");
    expect(iframe).toHaveAttribute("height", "180");
  });
});
