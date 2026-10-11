import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageUploader } from "@/pages/admin/products/_components/ImageUploader";

describe("ImageUploader", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURL.mockReturnValue("blob:uploaded-image");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("uploads an image and displays a blob preview which is revoked on unmount", async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn();
    const file = new File(["image"], "keyboard.jpg", { type: "image/jpeg" });
    const { unmount } = render(<ImageUploader onFileChange={onFileChange} />);
    const input = screen.getByTestId("image-input") as HTMLInputElement;

    await user.upload(input, file);

    expect(onFileChange).toHaveBeenCalledWith(file);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      "blob:uploaded-image",
    );
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:uploaded-image");
  });

  it("renders an existing preview without revoking a remote URL", () => {
    const onFileChange = vi.fn();
    const { unmount } = render(
      <ImageUploader onFileChange={onFileChange} value="/existing-image.jpg" />,
    );

    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      "/existing-image.jpg",
    );
    unmount();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("ignores an upload selection with no file", async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    const input = screen.getByTestId("image-input") as HTMLInputElement;

    await user.upload(
      input,
      new File(["image"], "keyboard.jpg", { type: "image/jpeg" }),
    );
    await user.upload(input, []);

    expect(onFileChange).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
  });
});
