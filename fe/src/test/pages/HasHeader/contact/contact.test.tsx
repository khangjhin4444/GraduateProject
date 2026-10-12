import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Page from "@/pages/HasHeader/contact"; // Điều chỉnh đường dẫn import nếu cần

describe("About Us Page", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders the main headings and introduction paragraphs", () => {
    render(<Page />);
    expect(
      screen.getByRole("heading", { level: 1, name: "About Us" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /JK Keyboard is a store specializing in mechanical keyboards/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/JK Keyboard was established in 2019/i),
    ).toBeInTheDocument();

    // Kiểm tra text được highlight
    expect(screen.getByText("Khang MK")).toBeInTheDocument();
  });

  it("renders the branch contact information and working hours", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", {
        level: 5,
        name: "JK Keyboard Ho Chi Minh Branch",
      }),
    ).toBeInTheDocument();

    // Kiểm tra địa chỉ
    expect(screen.getByText(/Address:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/497 Hòa Hảo, Phường 7, Quận 10, TP.HCM/i),
    ).toBeInTheDocument();

    // Kiểm tra số điện thoại
    expect(screen.getByText(/Phone:/i)).toBeInTheDocument();
    expect(screen.getByText(/1234567890 \(Mr. Khang\)/i)).toBeInTheDocument();

    // Kiểm tra giờ làm việc
    expect(screen.getByText("Hours:")).toBeInTheDocument();
    expect(screen.getByText("Mon - Fri: 8:00 - 22:00")).toBeInTheDocument();
    expect(screen.getByText("Sat & Sun: 8:00 - 18:00")).toBeInTheDocument();
  });

  it("renders the Google Maps iframe correctly", () => {
    const { container } = render(<Page />);

    // Vì iframe không có title, cách tốt nhất là query trực tiếp thẻ iframe
    const iframe = container.querySelector("iframe");

    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("https://www.google.com/maps/embed"),
    );
    expect(iframe).toHaveAttribute("loading", "lazy");
    expect(iframe).toHaveAttribute(
      "referrerPolicy",
      "no-referrer-when-downgrade",
    );
  });
});
