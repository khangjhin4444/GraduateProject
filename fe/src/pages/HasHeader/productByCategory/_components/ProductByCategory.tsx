export default function ProductByCategory({
  type,
  sub,
}: {
  type: string;
  sub?: string;
}) {
  return (
    <h1>
      {type} {sub}
    </h1>
  );
}
