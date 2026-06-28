interface Props {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  count?: number;
}

export default function SkeletonLoader({ width = "100%", height = 20, borderRadius = 8, count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width, height, borderRadius, marginBottom: i < count - 1 ? 12 : 0 }}
        />
      ))}
    </>
  );
}
