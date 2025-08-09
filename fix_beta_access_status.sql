ALTER TABLE "user" ALTER COLUMN "beta_access_status" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "beta_access_status" TYPE "beta_access_status" USING CASE WHEN "beta_access_status" = true THEN 'approved'::"beta_access_status" ELSE 'none'::"beta_access_status" END;
ALTER TABLE "user" ALTER COLUMN "beta_access_status" SET DEFAULT 'none'; 