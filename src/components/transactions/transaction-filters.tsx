"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

export function TransactionFilters({
  categories,
}: {
  categories: { id: string; name: string; icon: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:gap-3">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-8"
        />
      </div>

      <NativeSelect
        defaultValue={searchParams.get("type") ?? ""}
        onChange={(e) => updateParam("type", e.target.value)}
      >
        <option value="">All types</option>
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
        <option value="SAVINGS">Savings</option>
      </NativeSelect>

      <NativeSelect
        defaultValue={searchParams.get("categoryId") ?? ""}
        onChange={(e) => updateParam("categoryId", e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </NativeSelect>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="size-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
