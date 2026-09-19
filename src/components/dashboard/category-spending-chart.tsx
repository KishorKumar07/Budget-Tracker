"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type CategorySlice = { name: string; icon: string; value: number; color: string };

export function CategorySpendingChart({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No expenses this month yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-56 w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--popover-foreground)",
                fontSize: 13,
              }}
              formatter={(value, name) => [formatter.format(Number(value)), String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {data.slice(0, 6).map((slice) => (
          <div key={slice.name} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-foreground">
                {slice.icon} {slice.name}
              </span>
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatter.format(slice.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
