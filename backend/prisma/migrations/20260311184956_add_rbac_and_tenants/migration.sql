-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "allow_passkeys" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "require_mfa" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];
