import { useLoaderData } from "react-router";
import SearchProductSection from "./_components/ProductSection";

export default function Page() {
  const { keyword } = useLoaderData();

  return (
    <SearchProductSection
      keyword={keyword}
      key={keyword}
    ></SearchProductSection>
  );
}
