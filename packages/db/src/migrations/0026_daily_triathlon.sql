CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_id_idx" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_created_at_idx" ON "session" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_has_access_idx" ON "user" USING btree ("has_access");--> statement-breakpoint
CREATE INDEX "user_beta_access_status_idx" ON "user" USING btree ("beta_access_status");--> statement-breakpoint
CREATE INDEX "user_access_stage_idx" ON "user" USING btree ("access_stage");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_banned_idx" ON "user" USING btree ("banned");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_value_idx" ON "verification" USING btree ("value");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_unique_idx" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_has_access_idx" ON "waitlist" USING btree ("has_access");--> statement-breakpoint
CREATE INDEX "waitlist_created_at_idx" ON "waitlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "beta_application_user_id_idx" ON "beta_application" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "beta_application_status_idx" ON "beta_application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "beta_application_reviewed_by_idx" ON "beta_application" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "beta_application_created_at_idx" ON "beta_application" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "beta_application_reviewed_at_idx" ON "beta_application" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "bounty_status_idx" ON "bounty" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bounty_difficulty_idx" ON "bounty" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "bounty_created_by_id_idx" ON "bounty" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "bounty_assigned_to_id_idx" ON "bounty" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "bounty_created_at_idx" ON "bounty" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bounty_updated_at_idx" ON "bounty" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "bounty_deadline_idx" ON "bounty" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "bounty_amount_idx" ON "bounty" USING btree ("amount");--> statement-breakpoint
CREATE INDEX "bounty_currency_idx" ON "bounty" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "bounty_application_bounty_id_idx" ON "bounty_application" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "bounty_application_applicant_id_idx" ON "bounty_application" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "bounty_application_is_accepted_idx" ON "bounty_application" USING btree ("is_accepted");--> statement-breakpoint
CREATE INDEX "bounty_application_applied_at_idx" ON "bounty_application" USING btree ("applied_at");--> statement-breakpoint
CREATE INDEX "bounty_application_responded_at_idx" ON "bounty_application" USING btree ("responded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bounty_application_unique_idx" ON "bounty_application" USING btree ("bounty_id","applicant_id");--> statement-breakpoint
CREATE INDEX "submission_bounty_id_idx" ON "submission" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "submission_contributor_id_idx" ON "submission" USING btree ("contributor_id");--> statement-breakpoint
CREATE INDEX "submission_status_idx" ON "submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submission_submitted_at_idx" ON "submission" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "submission_reviewed_at_idx" ON "submission" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "submission_created_at_idx" ON "submission" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "passkey_user_id_idx" ON "passkey" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "passkey_credential_id_unique_idx" ON "passkey" USING btree ("credentialID");--> statement-breakpoint
CREATE INDEX "passkey_device_type_idx" ON "passkey" USING btree ("deviceType");--> statement-breakpoint
CREATE INDEX "passkey_backed_up_idx" ON "passkey" USING btree ("backedUp");--> statement-breakpoint
CREATE INDEX "passkey_created_at_idx" ON "passkey" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profile_user_id_unique_idx" ON "user_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profile_github_username_idx" ON "user_profile" USING btree ("github_username");--> statement-breakpoint
CREATE INDEX "user_profile_location_idx" ON "user_profile" USING btree ("location");--> statement-breakpoint
CREATE INDEX "user_profile_available_for_work_idx" ON "user_profile" USING btree ("available_for_work");--> statement-breakpoint
CREATE INDEX "user_profile_hourly_rate_idx" ON "user_profile" USING btree ("hourly_rate");--> statement-breakpoint
CREATE INDEX "user_profile_timezone_idx" ON "user_profile" USING btree ("timezone");--> statement-breakpoint
CREATE INDEX "user_rating_rated_user_id_idx" ON "user_rating" USING btree ("rated_user_id");--> statement-breakpoint
CREATE INDEX "user_rating_rater_user_id_idx" ON "user_rating" USING btree ("rater_user_id");--> statement-breakpoint
CREATE INDEX "user_rating_bounty_id_idx" ON "user_rating" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "user_rating_rating_idx" ON "user_rating" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "user_rating_created_at_idx" ON "user_rating" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_rating_unique_idx" ON "user_rating" USING btree ("rated_user_id","rater_user_id","bounty_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_reputation_user_id_unique_idx" ON "user_reputation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_reputation_total_earned_idx" ON "user_reputation" USING btree ("total_earned");--> statement-breakpoint
CREATE INDEX "user_reputation_bounties_completed_idx" ON "user_reputation" USING btree ("bounties_completed");--> statement-breakpoint
CREATE INDEX "user_reputation_average_rating_idx" ON "user_reputation" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "user_reputation_success_rate_idx" ON "user_reputation" USING btree ("success_rate");--> statement-breakpoint
CREATE INDEX "user_reputation_completion_rate_idx" ON "user_reputation" USING btree ("completion_rate");--> statement-breakpoint
CREATE INDEX "invite_email_idx" ON "invite" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_token_hash_unique_idx" ON "invite" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invite_access_stage_idx" ON "invite" USING btree ("access_stage");--> statement-breakpoint
CREATE INDEX "invite_expires_at_idx" ON "invite" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invite_used_at_idx" ON "invite" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "invite_used_by_user_id_idx" ON "invite" USING btree ("used_by_user_id");--> statement-breakpoint
CREATE INDEX "invite_created_at_idx" ON "invite" USING btree ("created_at");