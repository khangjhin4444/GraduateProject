import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import Page from "@/pages/HasHeader/service"; // Điều chỉnh đường dẫn import nếu cần

describe("Service Page", () => {
  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    );
  };
  afterEach(() => {
    cleanup();
  });

  it("renders the main heading correctly", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Keyboard Modding Service",
      }),
    ).toBeInTheDocument();
  });

  it("renders all section headings", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 2, name: "Keyboard Assembling" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Stabilizer Tuning" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Switch Modding" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Process & Notes" }),
    ).toBeInTheDocument();
  });

  it("renders contact consultation links with correct attributes", () => {
    renderPage();
    const contactLinks = screen.getAllByRole("link", {
      name: "CONTACT FOR CONSULTATION",
    });

    expect(contactLinks).toHaveLength(2);
    contactLinks.forEach((link) => {
      expect(link).toHaveAttribute(
        "href",
        "https://www.facebook.com/profile.php?id=61575185811123",
      );
      expect(link).toHaveAttribute("target", "blank");
    });
  });

  it("renders all images with correct alt texts", () => {
    renderPage();
    const assemImages = screen.getAllByAltText("Assemble image");

    expect(assemImages).toHaveLength(1);
    assemImages.forEach((img) => {
      expect(img).toBeInTheDocument();
    });
    const switchModImages = screen.getAllByAltText("Switch modding image");

    expect(switchModImages).toHaveLength(2);
    switchModImages.forEach((img) => {
      expect(img).toBeInTheDocument();
    });

    const stabTunImages = screen.getAllByAltText("Stab tunning image");

    expect(stabTunImages).toHaveLength(2);
    stabTunImages.forEach((img) => {
      expect(img).toBeInTheDocument();
    });
  });

  it("renders text content accurately", () => {
    renderPage();

    expect(
      screen.getByText(/Each custom mechanical keyboard is not just a tool/i),
    ).toBeInTheDocument();
    expect(screen.getByText("JK Keyboard")).toBeInTheDocument();

    expect(
      screen.getByText(
        /Warranty: The assembly service comes with a 7-day technical warranty/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Keycaps: You are not required to provide keycaps/i),
    ).toBeInTheDocument();
  });
});
