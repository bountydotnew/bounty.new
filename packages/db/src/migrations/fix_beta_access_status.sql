UPDATE "user" 
SET "beta_access_status" = CASE 
  WHEN "beta_access_status" = true THEN 'approved'::beta_access_status
  WHEN "beta_access_status" = false THEN 'none'::beta_access_status
  ELSE 'none'::beta_access_status
END; 