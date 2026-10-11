import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductImageGallery from "@/pages/HasHeader/product/_components/ProductImageGallery";

describe("ProductImageGallery", () => {
  afterEach(() => cleanup());

  it("renders the main image and all thumbnails", () => {
    render(
      <ProductImageGallery
        mainImage="/black.jpg"
        images={["/black.jpg", "/white.jpg", "/detail.jpg"]}
        onImageSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "Main Product" })).toHaveAttribute(
      "src",
      "/black.jpg",
    );
    expect(screen.getAllByRole("img", { name: /Thumbnail/ })).toHaveLength(3);
  });

  it("shows a zoom overlay at the pointer position and hides it on leave", () => {
    render(
      <ProductImageGallery
        mainImage="/black.jpg"
        images={["/black.jpg"]}
        onImageSelect={vi.fn()}
      />,
    );
    const imageContainer = screen.getByRole("img", {
      name: "Main Product",
    }).parentElement!;
    vi.spyOn(imageContainer, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(imageContainer, { clientX: 110, clientY: 70 });

    expect(
      imageContainer.querySelector('div[style*="background-image"]'),
    ).toHaveStyle({ backgroundPosition: "50% 50%" });
    expect(screen.getByRole("img", { name: "Main Product" })).toHaveClass(
      "opacity-80",
    );

    fireEvent.mouseLeave(imageContainer);

    expect(
      imageContainer.querySelector('div[style*="background-image"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Main Product" })).toHaveClass(
      "opacity-100",
    );
  });

  it("notifies the parent when a thumbnail is selected", () => {
    const onImageSelect = vi.fn();
    render(
      <ProductImageGallery
        mainImage="/black.jpg"
        images={["/black.jpg", "/white.jpg"]}
        onImageSelect={onImageSelect}
      />,
    );

    fireEvent.click(screen.getByRole("img", { name: "Thumbnail 1" }));

    expect(onImageSelect).toHaveBeenCalledWith("/white.jpg");
  });
});
