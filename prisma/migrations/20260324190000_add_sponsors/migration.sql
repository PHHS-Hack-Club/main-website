CREATE TABLE "sponsors" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "link_url" TEXT NOT NULL,
  "logo_key" TEXT NOT NULL,
  "description" TEXT,
  "tier" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);
