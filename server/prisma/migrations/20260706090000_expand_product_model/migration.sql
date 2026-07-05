-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE', 'VARIABLE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "barcode" TEXT,
ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'PHYSICAL',
ADD COLUMN "wholesalePrice" DECIMAL(10,2),
ADD COLUMN "minSellingPrice" DECIMAL(10,2),
ADD COLUMN "taxRate" DECIMAL(5,2),
ADD COLUMN "discountRate" DECIMAL(5,2),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TZS',
ADD COLUMN "maxStock" INTEGER,
ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "purchaseUnit" TEXT,
ADD COLUMN "sellingUnit" TEXT,
ADD COLUMN "unitConversion" TEXT,
ADD COLUMN "warehouse" TEXT,
ADD COLUMN "storageLocation" TEXT,
ADD COLUMN "expiryDate" TIMESTAMP(3),
ADD COLUMN "batchNumber" TEXT,
ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "canBeSold" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "availableOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "availableInStore" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowBackorders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supplierSku" TEXT,
ADD COLUMN "supplierLeadTimeDays" INTEGER,
ADD COLUMN "shippingWeight" DECIMAL(10,2),
ADD COLUMN "shippingLength" DECIMAL(10,2),
ADD COLUMN "shippingWidth" DECIMAL(10,2),
ADD COLUMN "shippingHeight" DECIMAL(10,2),
ADD COLUMN "shippingClass" TEXT,
ADD COLUMN "brandId" TEXT,
ADD COLUMN "supplierId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
