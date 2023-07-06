-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TRANSFER', 'LIST', 'BUY', 'REDEEM', 'GRANT_ROLE', 'REVOKE_ROLE', 'MINT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('MINT');

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "filecoinTokenId" TEXT,
    "energyWebTokenIds" TEXT[],
    "metadataId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metadata" (
    "id" SERIAL NOT NULL,
    "cid" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "energySources" TEXT NOT NULL,
    "contractDate" TEXT NOT NULL,
    "deliveryDate" TEXT NOT NULL,
    "reportingStart" TEXT NOT NULL,
    "reportingEnd" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "minted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER,
    "tokenId" TEXT,
    "eventType" "EventType" NOT NULL,
    "data" JSONB NOT NULL,
    "blockHeight" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressRoles" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isMinter" BOOLEAN NOT NULL DEFAULT false,
    "isRedeemer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AddressRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "hash" TEXT,
    "rawArgs" JSONB NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "success" BOOLEAN,
    "nonce" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utils" (
    "id" SERIAL NOT NULL,
    "ewcBlockHeight" TEXT NOT NULL,
    "filecoinBlockHeight" TEXT NOT NULL,

    CONSTRAINT "Utils_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_filecoinTokenId_key" ON "Collection"("filecoinTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_metadataId_key" ON "Collection"("metadataId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_cid_key" ON "Metadata"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "Event_blockHeight_transactionHash_logIndex_key" ON "Event"("blockHeight", "transactionHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "AddressRoles_address_key" ON "AddressRoles"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
