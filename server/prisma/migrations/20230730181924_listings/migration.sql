-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "buyerAddress" TEXT,
    "unitPrice" TEXT NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerAddress_fkey" FOREIGN KEY ("sellerAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_buyerAddress_fkey" FOREIGN KEY ("buyerAddress") REFERENCES "User"("address") ON DELETE SET NULL ON UPDATE CASCADE;
