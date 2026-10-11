import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLayoutEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EditorJsInput,
  type EditorJsInputHandle,
} from "@/pages/admin/products/_components/EditorJsInput";

const editorMock = vi.hoisted(() => ({
  save: vi.fn(),
  destroy: vi.fn(),
  includeDestroy: true,
  config: null as unknown,
}));
vi.mock("@editorjs/editorjs", () => ({
  default: vi.fn(function EditorJS(config: unknown) {
    editorMock.config = config;
    if (editorMock.includeDestroy) return editorMock;
    return { save: editorMock.save };
  }),
}));

function SaveControl({
  onResult,
}: {
  onResult: (result: unknown) => void;
}) {
  const editorRef = useRef<EditorJsInputHandle>(null);
  return (
    <>
      <EditorJsInput
        ref={editorRef}
        initialData={{
          time: 1,
          blocks: [{ type: "paragraph", data: { text: "Initial" } }],
          version: "2.31.7",
        }}
      />
      <button
        type="button"
        onClick={async () => onResult(await editorRef.current!.save())}
      >
        Save description
      </button>
    </>
  );
}

function SaveBeforeInitialization({
  onError,
}: {
  onError: (error: unknown) => void;
}) {
  const editorRef = useRef<EditorJsInputHandle>(null);
  useLayoutEffect(() => {
    editorRef.current?.save().catch(onError);
  }, [onError]);
  return <EditorJsInput ref={editorRef} />;
}

describe("EditorJsInput", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    editorMock.includeDestroy = true;
  });

  it("initializes EditorJS with the initial data and configured tools, saves, and destroys", async () => {
    const user = userEvent.setup();
    const result = { blocks: [{ type: "paragraph", data: { text: "Saved" } }] };
    const onResult = vi.fn();
    editorMock.save.mockResolvedValue(result);
    const { unmount } = render(<SaveControl onResult={onResult} />);

    await user.click(screen.getByRole("button", { name: "Save description" }));

    expect(editorMock.config).toMatchObject({
      data: {
        blocks: [{ type: "paragraph", data: { text: "Initial" } }],
      },
      tools: {
        List: { inlineToolbar: true, config: { defaultStyle: "unordered" } },
        header: { inlineToolbar: true },
        image: { config: { uploader: { uploadByUrl: expect.any(Function) } } },
      },
    });
    const config = editorMock.config as {
      tools: {
        image: {
          config: {
            uploader: {
              uploadByUrl: (url: string) => Promise<{
                success: number;
                file: { url: string };
              }>;
            };
          };
        };
      };
    };
    await expect(
      config.tools.image.config.uploader.uploadByUrl("https://example.com/image.jpg"),
    ).resolves.toEqual({
      success: 1,
      file: { url: "https://example.com/image.jpg" },
    });
    expect(editorMock.save).toHaveBeenCalledOnce();
    expect(onResult).toHaveBeenCalledWith(result);

    unmount();
    expect(editorMock.destroy).toHaveBeenCalledOnce();
  });

  it("surfaces an error if save is called before EditorJS initializes", async () => {
    const onError = vi.fn();

    render(<SaveBeforeInitialization onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        new Error("Editor is not initialized"),
      );
    });
  });

  it("cleans up safely when the editor has no destroy method", () => {
    editorMock.includeDestroy = false;
    const { unmount } = render(<EditorJsInput />);

    unmount();

    expect(editorMock.destroy).not.toHaveBeenCalled();
  });
});
