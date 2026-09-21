import useProductDetail from "@/hooks/useProductDetail";
import { useParams } from "react-router";

export default function ProductDetail() {
  const { id } = useParams();
  const { data } = useProductDetail(Number(id!));
  const productData = data.data;
  return (
    <>
      This is detail page of Product has id {id}
      <h1>Product name: {productData.Name} </h1>
      <p>Price: {productData.variants[0].Price}</p>
    </>
  );
}
