export function Spark({ values, color = "var(--color-cpu)" }: { values: number[]; color?: string }) {
  const max = Math.max(1, ...values, 0);
  return (
    <div className="spark" aria-hidden>
      {values.map((v, i) => (
        <i key={`${i}-${v}`} style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: color }} />
      ))}
    </div>
  );
}
