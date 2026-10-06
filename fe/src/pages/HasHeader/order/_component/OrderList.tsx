import useOrders from "@/hooks/useOrders";
import OrderCard from "./OrderCard";
import OrderListSkeleton from "./OrderListSkeleton";

export default function OrderList({ status }: { status: string }) {
  const { data, hasNextPage, fetchNextPage, isLoading, isFetchingNextPage } =
    useOrders(status);
  return (
    <>
      {isLoading && <OrderListSkeleton />}
      {data?.pages.flatMap((page) => {
        if (page.data.length === 0) {
          return (
            <div className="w-full text-center mt-4 text-2xl">
              <h2 className="text-muted-foreground font-semibold">
                No order found in {status} state
              </h2>
            </div>
          );
        }
        return page.data.map((order) => {
          return <OrderCard order={order} key={order.OrderID} />;
        });
      })}
      {hasNextPage && (
        <div className="w-full flex justify-center">
          <button
            className="bg-background border-2 border-primary px-4 text-lg rounded-2xl font-medium text-primary cursor-pointer"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
