import type { CSSProperties } from "react";

// One accent hue as a lightness ramp (tokens.css --chart-*); axes and grid stay neutral
export const CHART = {
  series: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"],
  grid: "var(--color-rule)",
  axis: "var(--color-muted)",
  tooltip: {
    backgroundColor: "var(--color-paper)",
    border: "1px solid var(--color-rule)",
    borderRadius: "var(--radius-card)",
    color: "var(--color-ink)",
  } satisfies CSSProperties,
};

export function StatRow({ stats }: { stats: { title: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 rounded-lg bg-card lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.title}
          className={`flex flex-col-reverse gap-1 p-6 ${index > 0 ? "lg:border-l lg:border-rule" : ""} ${index % 2 ? "border-l border-rule" : ""} ${index > 1 ? "border-t border-rule lg:border-t-0" : ""}`}
        >
          <dt className="font-display text-sm font-medium lowercase text-muted-foreground">{stat.title}</dt>
          <dd className="m-0 font-display text-3xl font-light tabular-nums text-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Parts of a whole as one stacked bar, each part named with its value beneath
export function Breakdown({
  items,
  format = (value) => value.toLocaleString(),
}: {
  items: { name: string; value: number }[];
  format?: (value: number) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="space-y-4">
      <div className="flex h-6 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={items.map((i) => `${i.name} ${format(i.value)}`).join(", ")}>
        {items.map((item, index) => (
          <span
            key={item.name}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(item.value / total) * 100}%`, backgroundColor: CHART.series[index % CHART.series.length] }}
          />
        ))}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.map((item, index) => (
            <tr key={item.name} className="border-t border-rule">
              <td className="py-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART.series[index % CHART.series.length] }}
                  />
                  {item.name}
                </span>
              </td>
              <td className="py-2 text-right tabular-nums">{format(item.value)}</td>
              <td className="w-16 py-2 text-right tabular-nums text-muted-foreground">
                {((item.value / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
