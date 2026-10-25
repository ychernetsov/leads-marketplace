-- AlterTable: datasets removed by an admin are soft-deleted so buyers keep access
ALTER TABLE "files" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable: buyer-owned customisation of purchased items
ALTER TABLE "orders" ADD COLUMN "custom_title" TEXT,
ADD COLUMN "custom_description" TEXT,
ADD COLUMN "archived_at" TIMESTAMP(3),
ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_labels" (
    "order_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,

    CONSTRAINT "order_labels_pkey" PRIMARY KEY ("order_id","label_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "labels_user_id_name_key" ON "labels"("user_id", "name");

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_labels" ADD CONSTRAINT "order_labels_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_labels" ADD CONSTRAINT "order_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
