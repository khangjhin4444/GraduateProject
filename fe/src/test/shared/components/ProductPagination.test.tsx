import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductPagination from "@/shared/components/ProductPagination";

describe("ProductPagination", () => {
  afterEach(() => cleanup());

  it("shows every page when there are at most three pages", () => {
    render(
      <ProductPagination
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Page 3" })).toBeInTheDocument();
    expect(screen.queryByText("…")).not.toBeInTheDocument();
  });

  it("uses an ellipsis for a gap in the page range", () => {
    render(
      <ProductPagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 5" })).toBeInTheDocument();
    expect(screen.getByText("…")).toBeInTheDocument();
  });

  it.each([
    [1, ["1", "2", "3", "…", "10"]],
    [5, ["1", "…", "4", "5", "6", "…", "10"]],
    [10, ["1", "…", "8", "9", "10"]],
  ])("shows a compact page range for page %i of 10", (currentPage, expected) => {
    render(
      <ProductPagination
        currentPage={currentPage}
        totalPages={10}
        onPageChange={vi.fn()}
      />,
    );

    const visibleItems = screen
      .getByRole("navigation", { name: "Product pagination" })
      .textContent?.replaceAll("‹", "")
      .replaceAll("›", "")
      .replaceAll("Previous page", "")
      .replaceAll("Next page", "")
      .replaceAll(/\s/g, "");
    expect(visibleItems).toBe(expected.join(""));
    expect(
      screen.getByRole("button", { name: `Page ${currentPage}` }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("changes to the selected page and supports previous/next navigation", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <ProductPagination
        currentPage={3}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Page 4" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
    expect(screen.getByRole("button", { name: "Page 3" })).toBeDisabled();
  });

  it("hides pagination when there is only one page", () => {
    const { container } = render(
      <ProductPagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
