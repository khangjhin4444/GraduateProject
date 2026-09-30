import BlocksModule from "editorjs-blocks-react-renderer";
import NestedList from "./NestedListRender";

export const customRender = {
  List: NestedList,
};

export const Blocks =
  (BlocksModule as unknown as { default?: typeof BlocksModule }).default ??
  BlocksModule;
