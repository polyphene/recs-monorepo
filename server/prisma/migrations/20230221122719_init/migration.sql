-- CreateTable
CREATE TABLE "RecMetadata" (
    "id" SERIAL NOT NULL,
    "cid" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecMetadata_pkey" PRIMARY KEY ("id")
);
