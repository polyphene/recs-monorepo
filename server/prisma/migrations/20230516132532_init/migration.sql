-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TRANSFER', 'LIST', 'BUY', 'REDEEM', 'GRANT_ROLE', 'REVOKE_ROLE', 'CLAIM', 'REDEMPTION_SET', 'CERTIFICATE_BATCH_MINTED', 'MINT');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('FILECOIN', 'ENERGY_WEB');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('MINT');

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "filecoinTokenId" TEXT,
    "energyWebTokenId" TEXT,
    "metadataId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metadata" (
    "id" SERIAL NOT NULL,
    "cid" TEXT NOT NULL,
    "contractId" TEXT,
    "productType" TEXT,
    "label" TEXT,
    "energySources" TEXT,
    "contractDate" TEXT,
    "deliveryDate" TEXT,
    "reportingStart" TEXT,
    "reportingEnd" TEXT,
    "sellerName" TEXT,
    "sellerAddress" TEXT,
    "country" TEXT,
    "region" TEXT,
    "volume" TEXT,
    "createdBy" TEXT NOT NULL,
    "minted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER,
    "chain" "Chain" NOT NULL DEFAULT 'FILECOIN',
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

-- CreateIndex
CREATE UNIQUE INDEX "Collection_filecoinTokenId_key" ON "Collection"("filecoinTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_energyWebTokenId_key" ON "Collection"("energyWebTokenId");

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
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
