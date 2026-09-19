"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { getSubcategorySpendingAction } from "@/app/(dashboard)/analytics/actions";

type CategorySlice = {
  id: string;
  name: string;
  icon: string;
  value: number;
  color: string;
  hasSubcategories: boolean;
};

type SubcategorySlice = { id: string; name: string; icon: string; value: number };

export function CategoryBreakdownChart({
  data,
  currency,
  workspaceId,
  month,
  year,
}: {
  data: CategorySlice[];
  currency: string;
  workspaceId: string;
  month: number;
  year: number;
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
                <Cell key={slice.id} fill={slice.color} />
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

      <div className="flex flex-1 flex-col gap-1">
        {data.slice(0, 8).map((slice) => (
          <CategoryLegendRow
            key={slice.id}
            slice={slice}
            formatter={formatter}
            workspaceId={workspaceId}
            month={month}
            year={year}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryLegendRow({
  slice,
  formatter,
  workspaceId,
  month,
  year,
}: {
  slice: CategorySlice;
  formatter: Intl.NumberFormat;
  workspaceId: string;
  month: number;
  year: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<SubcategorySlice[] | null>(null);

  const handleToggle = async () => {
    if (!slice.hasSubcategories) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    if (subcategories === null) {
      setLoading(true);
      const result = await getSubcategorySpendingAction(workspaceId, slice.id, month, year);
      setSubcategories(result);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={!slice.hasSubcategories}
        className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-sm transition-colors hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent"
      >
        <div className="flex min-w-0 items-center gap-2">
          {slice.hasSubcategories ? (
            expanded ? (
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="size-3 shrink-0" />
          )}
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
          <span className="truncate text-foreground">
            {slice.icon} {slice.name}
          </span>
        </div>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatter.format(slice.value)}
        </span>
      </button>

      {expanded && (
        <div className="ml-7 flex flex-col gap-1 border-l border-border py-1 pl-3">
          {loading ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            subcategories?.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground">
                  {sub.icon} {sub.name}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatter.format(sub.value)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
