type NestedListItem = {
  content: string;
  items?: NestedListItem[];
};

type NestedListData = {
  style: "ordered" | "unordered";
  items: NestedListItem[];
};
export default function NestedList({
  data,
  className = "",
}: {
  data: NestedListData;
  className?: string;
}) {
  const isOrdered = data.style === "ordered";
  const ListTag = isOrdered ? "ol" : "ul";

  const renderItems = (
    items: NestedListItem[],
    isRoot: boolean,
    prefix: string = "",
  ) => (
    <ListTag
      className={`
        ${isOrdered ? "list-none" : "list-disc list-inside"}
        ${isRoot ? className : "ml-6 mt-1"}
      `}
    >
      {items.map((item, index) => {
        if (!isOrdered) {
          return (
            <li key={`${item.content}-${index}`} className="mb-1">
              <span dangerouslySetInnerHTML={{ __html: item.content }} />
              {item.items &&
                item.items.length > 0 &&
                renderItems(item.items, false, "")}
            </li>
          );
        }

        const currentNumber = `${prefix}${index + 1}`;

        return (
          <li
            key={`${item.content}-${index}`}
            className="mb-1 flex items-start"
          >
            <span className="mr-2 shrink-0 font-medium text-foreground">
              {currentNumber}.
            </span>

            <div className="flex-1">
              <span dangerouslySetInnerHTML={{ __html: item.content }} />

              {item.items &&
                item.items.length > 0 &&
                renderItems(item.items, false, `${currentNumber}.`)}
            </div>
          </li>
        );
      })}
    </ListTag>
  );

  return renderItems(data.items, true, "");
}
