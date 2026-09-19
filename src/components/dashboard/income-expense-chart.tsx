"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type MonthlyPoint = { label: string; income: number; expense: number; savings?: number };

export function IncomeExpenseChart({
  data,
  currency,
}: {
  data: MonthlyPoint[];
  currency: string;
}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => formatter.format(value)}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
            formatter={(value) => formatter.format(Number(value))}
          />
          <Bar dataKey="income" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="savings" name="Savings" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
