-- CreateEnum
CREATE TYPE "AiProviderName" AS ENUM ('GEMINI', 'GROK');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "AiApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AiProviderName" NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "label" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "lastValidationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "proposedAction" JSONB,
    "providerUsed" "AiProviderName",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConfirmedAction" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "resultSummary" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConfirmedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRateLimitWindow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiRateLimitWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiApiKey_userId_idx" ON "AiApiKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiApiKey_userId_provider_key" ON "AiApiKey"("userId", "provider");

-- CreateIndex
CREATE INDEX "AiConversation_workspaceId_userId_idx" ON "AiConversation"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiConfirmedAction_workspaceId_createdAt_idx" ON "AiConfirmedAction"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AiConfirmedAction_userId_idx" ON "AiConfirmedAction"("userId");

-- CreateIndex
CREATE INDEX "AiRateLimitWindow_userId_idx" ON "AiRateLimitWindow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiRateLimitWindow_userId_windowStart_key" ON "AiRateLimitWindow"("userId", "windowStart");

-- AddForeignKey
ALTER TABLE "AiApiKey" ADD CONSTRAINT "AiApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConfirmedAction" ADD CONSTRAINT "AiConfirmedAction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
