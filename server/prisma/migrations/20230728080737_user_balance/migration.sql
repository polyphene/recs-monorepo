-- AlterTable
ALTER TABLE "User" RENAME CONSTRAINT "AddressRoles_pkey" TO "User_pkey";

-- CreateTable
CREATE TABLE "Balance" (
    "id" SERIAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userAddress_collectionId_key" ON "Balance"("userAddress", "collectionId");

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "AddressRoles_address_key" RENAME TO "User_address_key";
