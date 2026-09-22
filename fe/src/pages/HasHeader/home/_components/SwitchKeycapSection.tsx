import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useProducts from "@/hooks/useProducts";
import ProductTab from "./ProductTab";
import ProductSkeleton from "@/components/ProductSkeleton";

export default function SwitchKeycapSection() {
  const {
    data: switchData,
    isPending: isSwitchPending,
    isError: isSwitchError,
    error: SwitchError,
  } = useProducts({
    type: "Switch",
    page: 1,
    limit: 8,
  });
  const {
    data: keycap,
    isPending: iskeycapPending,
    isError: iskeycapError,
    error: keycapError,
  } = useProducts({
    type: "Keycap",
    page: 1,
    limit: 8,
  });
  return (
    <section className="flex justify-center p-4 w-full">
      <Tabs defaultValue="switch" className="w-full">
        <TabsList
          variant="line"
          className="mx-auto flex gap-4 justify-center items-center mb-3"
        >
          <TabsTrigger value="switch" className="w-30 text-lg  cursor-pointer">
            Switch
          </TabsTrigger>
          <TabsTrigger value="keycap" className="w-30 text-lg  cursor-pointer">
            keycap
          </TabsTrigger>
        </TabsList>
        <TabsContent value="switch">
          {isSwitchPending && <ProductSkeleton />}
          {isSwitchError && (
            <p role="alert">
              {SwitchError instanceof Error
                ? SwitchError.message
                : "Cannot load Switch Kit products."}
            </p>
          )}
          {!isSwitchPending &&
            !isSwitchError &&
            switchData?.pages[0].data.length === 0 && (
              <p>No Switch products found.</p>
            )}
          {!isSwitchPending && !isSwitchError && (
            <ProductTab
              products={switchData.pages[0].data}
              link="/collection/switch"
            ></ProductTab>
          )}
        </TabsContent>
        <TabsContent value="keycap">
          {iskeycapPending && <ProductSkeleton />}
          {iskeycapError && (
            <p role="alert">
              {keycapError instanceof Error
                ? keycapError.message
                : "Cannot load keycap products."}
            </p>
          )}
          {!iskeycapPending &&
            !iskeycapError &&
            keycap?.pages[0].data.length === 0 && (
              <p>No keycap products found.</p>
            )}
          {!iskeycapPending && !iskeycapError && (
            <ProductTab
              products={keycap.pages[0].data}
              link="/collection/keycap"
            ></ProductTab>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
