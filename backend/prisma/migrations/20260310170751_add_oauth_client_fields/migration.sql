-- AlterTable
ALTER TABLE "oauth_clients" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
