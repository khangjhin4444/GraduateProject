import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useProducts from "@/hooks/useProducts";
import ProductTab from "./ProductTab";
import ProductSkeleton from "@/shared/components/ProductSkeleton";

export default function KeyboardSection() {
  const {
    data: keyboardkit,
    isPending: isKeyboardPending,
    isError: isKeyboardError,
    error: keyboardError,
  } = useProducts({
    type: "KeyboardKit",
    page: 1,
    limit: 8,
  });
  const {
    data: prebuild,
    isPending: isPrebuildPending,
    isError: isPrebuildError,
    error: prebuildError,
  } = useProducts({
    type: "Prebuild",
    page: 1,
    limit: 8,
  });
  return (
    <section className="flex justify-center p-4 w-full">
      <Tabs defaultValue="keyboardkit" className="w-full">
        <TabsList
          variant="line"
          className="mx-auto flex gap-4 justify-center items-center mb-3"
        >
          <TabsTrigger
            value="keyboardkit"
            className="w-30 text-lg  cursor-pointer"
          >
            Keyboard Kit
          </TabsTrigger>
          <TabsTrigger
            value="prebuild"
            className="w-30 text-lg  cursor-pointer"
          >
            Prebuild
          </TabsTrigger>
        </TabsList>
        <TabsContent value="keyboardkit">
          {isKeyboardPending && <ProductSkeleton />}
          {isKeyboardError && (
            <p role="alert">
              {keyboardError instanceof Error
                ? keyboardError.message
                : "Cannot load Keyboard Kit products."}
            </p>
          )}
          {!isKeyboardPending &&
            !isKeyboardError &&
            keyboardkit?.pages[0].data.length === 0 && (
              <p>No Keyboard Kit products found.</p>
            )}
          {!isKeyboardPending && !isKeyboardError && (
            <ProductTab
              products={keyboardkit.pages[0].data}
              link="/collection/keyboardkit"
            ></ProductTab>
          )}
        </TabsContent>
        <TabsContent value="prebuild">
          {isPrebuildPending && <ProductSkeleton />}
          {isPrebuildError && (
            <p role="alert">
              {prebuildError instanceof Error
                ? prebuildError.message
                : "Cannot load Prebuild products."}
            </p>
          )}
          {!isPrebuildPending &&
            !isPrebuildError &&
            prebuild?.pages[0].data.length === 0 && (
              <p>No Prebuild products found.</p>
            )}
          {!isPrebuildPending && !isPrebuildError && (
            <ProductTab
              products={prebuild.pages[0].data}
              link="/collection/prebuild"
            ></ProductTab>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
