import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { getDefaultCategories } from "../src/lib/categories/default-categories";
import { ALL_PERMISSIONS } from "../src/lib/permissions/constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo data...");

  const passwordHash = await hashPassword("demo12345");

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@budgettracker.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@budgettracker.app",
      passwordHash,
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  const existingWorkspace = await prisma.workspace.findFirst({
    where: { createdById: demoUser.id, name: "Demo Workspace" },
  });

  if (existingWorkspace) {
    console.log("Demo workspace already exists, skipping.");
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      createdById: demoUser.id,
      members: {
        create: {
          userId: demoUser.id,
          permissions: ALL_PERMISSIONS,
          isCreator: true,
        },
      },
    },
  });

  const defaultCategories = getDefaultCategories();

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({
      workspaceId: workspace.id,
      createdById: demoUser.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    })),
  });

  const categories = await prisma.category.findMany({
    where: { workspaceId: workspace.id },
  });

  const findCategory = (name: string) => {
    const category = categories.find((c) => c.name === name);
    if (!category) throw new Error(`Seed category not found: ${name}`);
    return category;
  };

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  await prisma.transaction.createMany({
    data: [
      {
        workspaceId: workspace.id,
        createdById: demoUser.id,
        categoryId: findCategory("Salary").id,
        amount: 65000,
        type: "INCOME",
        description: "Monthly salary",
        date: new Date(thisYear, thisMonth - 1, 1),
        paymentMethod: "BANK_TRANSFER",
      },
      {
        workspaceId: workspace.id,
        createdById: demoUser.id,
        categoryId: findCategory("Groceries").id,
        amount: 3200,
        type: "EXPENSE",
        description: "Weekly groceries",
        date: new Date(thisYear, thisMonth - 1, 3),
        paymentMethod: "UPI",
      },
      {
        workspaceId: workspace.id,
        createdById: demoUser.id,
        categoryId: findCategory("Rent").id,
        amount: 18000,
        type: "EXPENSE",
        description: "Monthly rent",
        date: new Date(thisYear, thisMonth - 1, 5),
        paymentMethod: "BANK_TRANSFER",
      },
      {
        workspaceId: workspace.id,
        createdById: demoUser.id,
        categoryId: findCategory("Restaurants").id,
        amount: 1450,
        type: "EXPENSE",
        description: "Dinner with friends",
        date: new Date(thisYear, thisMonth - 1, 8),
        paymentMethod: "CARD",
      },
      {
        workspaceId: workspace.id,
        createdById: demoUser.id,
        categoryId: findCategory("Fuel").id,
        amount: 2100,
        type: "EXPENSE",
        description: "Petrol",
        date: new Date(thisYear, thisMonth - 1, 10),
        paymentMethod: "UPI",
      },
    ],
  });

  await prisma.budget.createMany({
    data: [
      {
        workspaceId: workspace.id,
        categoryId: findCategory("Groceries").id,
        amount: 10000,
        month: thisMonth,
        year: thisYear,
      },
      {
        workspaceId: workspace.id,
        categoryId: findCategory("Restaurants").id,
        amount: 4000,
        month: thisMonth,
        year: thisYear,
      },
      {
        workspaceId: workspace.id,
        categoryId: findCategory("Fuel").id,
        amount: 5000,
        month: thisMonth,
        year: thisYear,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo login: demo@budgettracker.app / demo12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
