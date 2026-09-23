import BlocksModule from "editorjs-blocks-react-renderer";
export const config = {
  header: {
    className: "font-semibold text:lg md:text-xl text-foreground mb-2",
  },
  paragraph: {
    className: "text-md md:text-lg text-foreground mb-2",
  },
  image: {
    className: "mx-auto w-3/4 md:w-2/3 object-cover flex justify-center mt-5",
  },
  list: {
    className:
      "ml-6 list-inside list-disc text-sm md:text-md lg:text-lg text-foreground",
  },
  nestedList: {
    className:
      "ml-6 list-inside list-disc text-sm md:text-md lg:text-lg text-foreground",
  },
  embed: {
    className: "mx-auto mt-5 w-full max-w-3xl",
    rel: "noopener noreferrer",
    sandbox: "allow-scripts allow-same-origin",
  },
};

type NestedListItem = {
  content: string;
  items?: NestedListItem[];
};

type NestedListData = {
  style: "ordered" | "unordered";
  items: NestedListItem[];
};

function NestedList({
  data,
  className = "",
}: {
  data: NestedListData;
  className?: string;
}) {
  const ListTag = data.style === "ordered" ? "ol" : "ul";

  const renderItems = (items: NestedListItem[]) => (
    <ListTag className={className}>
      {items.map((item, index) => (
        <li key={`${item.content}-${index}`}>
          {item.content}
          {item.items && item.items.length > 0 && renderItems(item.items)}
        </li>
      ))}
    </ListTag>
  );

  return renderItems(data.items);
}

export const customRender = {
  nestedList: NestedList,
};

export const Blocks =
  (BlocksModule as unknown as { default?: typeof BlocksModule }).default ??
  BlocksModule;
