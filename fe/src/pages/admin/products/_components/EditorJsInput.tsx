import EditorJS from "@editorjs/editorjs";
import { type OutputData } from "@editorjs/editorjs";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Header from '@editorjs/header';
import EditorjsList from '@editorjs/list';
import ImageTool from "@editorjs/image";

export type EditorBlock = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

export type EditorData = {
  time: number;
  blocks: EditorBlock[];
  version: string;
};

export type EditorJsInputHandle = {
  save: () => Promise<OutputData>;
};

export const EditorJsInput = forwardRef<EditorJsInputHandle, { initialData?: EditorData }>(
  function EditorJsInput({ initialData }, ref) {
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);
    const initialDataRef = useRef(initialData);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!editorRef.current) {
          throw new Error("Editor is not initialized");
        }
        return editorRef.current.save();
      },
    }));

    useEffect(() => {
      if (!editorRef.current && holderRef.current) {
        const editor = new EditorJS({
          holder: holderRef.current,
          data: initialDataRef.current,
          tools: {
            List: {
              class: EditorjsList,
              inlineToolbar: true,
              config: {
                defaultStyle: 'unordered'
              },
            },
            header: {
              class: Header,
              inlineToolbar: true
            },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByUrl(url: string) {
                    return new Promise((resolve) => {
                      resolve({
                        success: 1,
                        file: {
                          url: url,
                        },
                      });
                    });
                  },
                },
              },
            },
          },
        });

        editorRef.current = editor;
      }

      // Cleanup function: Hủy editor khi component unmount
      return () => {
        if (editorRef.current && editorRef.current.destroy) {
          editorRef.current.destroy();
          editorRef.current = null;
        }
      };
    }, []);

    return (
      <div
        ref={holderRef}
        className="editor-js-input w-full min-h-25 rounded-lg border border-input bg-slate-50 px-8 py-4 [&_h1.ce-header]:text-4xl [&_h1.ce-header]:font-bold [&_h1.ce-header]:mt-6 [&_h1.ce-header]:mb-4
      [&_h2.ce-header]:text-3xl [&_h2.ce-header]:font-bold [&_h2.ce-header]:mt-5 [&_h2.ce-header]:mb-3
      [&_h3.ce-header]:text-2xl [&_h3.ce-header]:font-bold [&_h3.ce-header]:mt-4 [&_h3.ce-header]:mb-2
      [&_h4.ce-header]:text-xl [&_h4.ce-header]:font-bold [&_h4.ce-header]:mt-3 [&_h4.ce-header]:mb-2
      [&_h5.ce-header]:text-lg [&_h5.ce-header]:font-bold [&_h5.ce-header]:mt-2 [&_h5.ce-header]:mb-1
      [&_h6.ce-header]:text-base [&_h6.ce-header]:font-bold [&_h6.ce-header]:mt-2 [&_h6.ce-header]:mb-1"
      />
    );
  },
);
