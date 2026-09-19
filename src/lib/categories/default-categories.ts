import type { CategoryType } from "@/generated/prisma/client";

export type DefaultCategory = {
  name: string;
  icon: string;
  type: CategoryType;
  color: string;
  group: string;
};

// §17 — default expense categories, grouped for both seeding and the
// category selector UI.
const EXPENSE_GROUPS: { group: string; color: string; items: [string, string][] }[] = [
  {
    group: "Food & Dining",
    color: "#F97316",
    items: [
      ["Groceries", "🛒"],
      ["Restaurants", "🍽"],
      ["Food Delivery", "🛵"],
      ["Cafes & Coffee", "☕"],
      ["Snacks", "🍿"],
      ["Fast Food", "🍔"],
    ],
  },
  {
    group: "Transportation",
    color: "#3B82F6",
    items: [
      ["Fuel", "⛽"],
      ["Public Transport", "🚌"],
      ["Taxi & Ride Sharing", "🚕"],
      ["Parking", "🅿️"],
      ["Vehicle Maintenance", "🔧"],
      ["Vehicle Insurance", "🚗"],
    ],
  },
  {
    group: "Housing",
    color: "#8B5CF6",
    items: [
      ["Rent", "🏠"],
      ["Home Maintenance", "🛠"],
      ["Electricity", "💡"],
      ["Water", "🚰"],
      ["Gas", "🔥"],
      ["Internet", "🌐"],
      ["Mobile Phone", "📱"],
    ],
  },
  {
    group: "Shopping",
    color: "#EC4899",
    items: [
      ["Clothing", "👕"],
      ["Electronics", "💻"],
      ["Home & Kitchen", "🍳"],
      ["Personal Care", "🧴"],
      ["Shopping", "🛍"],
      ["Gifts", "🎁"],
    ],
  },
  {
    group: "Entertainment",
    color: "#A855F7",
    items: [
      ["Movies", "🎬"],
      ["Games", "🎮"],
      ["Music", "🎵"],
      ["Streaming", "📺"],
      ["Events", "🎟"],
      ["Hobbies", "🎨"],
    ],
  },
  {
    group: "Health",
    color: "#EF4444",
    items: [
      ["Doctor", "🩺"],
      ["Pharmacy", "💊"],
      ["Medical", "❤️"],
      ["Dental", "🦷"],
      ["Fitness", "🏋️"],
      ["Health Insurance", "🏥"],
    ],
  },
  {
    group: "Education",
    color: "#06B6D4",
    items: [
      ["Courses", "📚"],
      ["Books", "📖"],
      ["Tuition", "🎓"],
      ["Education Supplies", "✏️"],
    ],
  },
  {
    group: "Travel",
    color: "#14B8A6",
    items: [
      ["Flights", "✈️"],
      ["Hotels", "🏨"],
      ["Travel Food", "🍜"],
      ["Travel Transport", "🚆"],
      ["Activities", "🗺"],
    ],
  },
  {
    group: "Family & Personal",
    color: "#F59E0B",
    items: [
      ["Childcare", "🧸"],
      ["Family", "👨‍👩‍👧"],
      ["Personal", "🙂"],
      ["Pets", "🐾"],
    ],
  },
  {
    group: "Financial",
    color: "#64748B",
    items: [
      ["Bank Fees", "🏦"],
      ["Credit Card Payment", "💳"],
      ["Loan Payment", "📄"],
      ["Interest", "％"],
      ["Investments", "📈"],
    ],
  },
  {
    group: "Other",
    color: "#94A3B8",
    items: [
      ["Miscellaneous", "📦"],
      ["Other", "❓"],
    ],
  },
];

// §18 — default income categories
const INCOME_ITEMS: [string, string][] = [
  ["Salary", "💰"],
  ["Freelance", "🧑‍💻"],
  ["Business", "🏢"],
  ["Bonus", "🎉"],
  ["Commission", "🤝"],
  ["Interest", "％"],
  ["Dividends", "📊"],
  ["Rental Income", "🏘"],
  ["Refund", "↩️"],
  ["Gift", "🎁"],
  ["Other Income", "❓"],
];

// Default savings categories — money set aside from income, tracked
// separately from expenses so it doesn't distort spending totals.
const SAVINGS_ITEMS: [string, string][] = [
  ["Emergency Fund", "🛟"],
  ["Fixed Deposit", "🏦"],
  ["Mutual Funds", "📈"],
  ["Stocks", "📊"],
  ["Retirement", "🌅"],
  ["Gold", "🪙"],
  ["Goal Savings", "🎯"],
  ["Other Savings", "❓"],
];

export function getDefaultCategories(): DefaultCategory[] {
  const expense: DefaultCategory[] = EXPENSE_GROUPS.flatMap((group) =>
    group.items.map(([name, icon]) => ({
      name,
      icon,
      color: group.color,
      type: "EXPENSE" as CategoryType,
      group: group.group,
    }))
  );

  const income: DefaultCategory[] = INCOME_ITEMS.map(([name, icon]) => ({
    name,
    icon,
    color: "#22C55E",
    type: "INCOME" as CategoryType,
    group: "Income",
  }));

  const savings: DefaultCategory[] = SAVINGS_ITEMS.map(([name, icon]) => ({
    name,
    icon,
    color: "#0EA5E9",
    type: "SAVINGS" as CategoryType,
    group: "Savings",
  }));

  return [...expense, ...income, ...savings];
}

const GROUP_BY_NAME = new Map(getDefaultCategories().map((c) => [c.name, c.group]));

export function getCategoryGroup(name: string, isDefault: boolean) {
  if (!isDefault) return "Custom";
  return GROUP_BY_NAME.get(name) ?? "Other";
}
