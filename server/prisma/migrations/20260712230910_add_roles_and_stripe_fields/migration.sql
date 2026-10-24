/*
  Warnings:

  - A unique constraint covering the columns `[stripe_checkout_session_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount_cents` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('regular', 'admin');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "num_rows" INTEGER,
ADD COLUMN     "original_filename" TEXT,
ADD COLUMN     "sample_url" TEXT,
ADD COLUMN     "size_bytes" BIGINT,
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'uploading',
ADD COLUMN     "uploaded_by" TEXT,
ALTER COLUMN "r2_key_sample" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "amount_cents" INTEGER NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "stripe_checkout_session_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'regular';

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_checkout_session_id_key" ON "orders"("stripe_checkout_session_id");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
