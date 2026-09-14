-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'SS', 'ST');

-- CreateEnum
CREATE TYPE "Foot" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('FREE', 'CLUB', 'ACADEMY', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'ANALYST', 'SCOUT', 'VIEWER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'LOAN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MetricUnit" AS ENUM ('COUNT', 'PER_90', 'PERCENT', 'SECONDS', 'METERS', 'SCORE_0_100');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT,
    "plan" "OrgPlan" NOT NULL DEFAULT 'FREE',
    "seat_limit" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "mfa_secret" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "active_org_id" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashed_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "known_as" TEXT,
    "date_of_birth" DATE,
    "nationality" TEXT,
    "position" "Position" NOT NULL,
    "alt_position" "Position",
    "foot" "Foot",
    "height_cm" INTEGER,
    "photo_url" TEXT,
    "source_ref" TEXT,
    "external_ids" JSONB,
    "is_minor" BOOLEAN NOT NULL DEFAULT false,
    "consent_granted_at" TIMESTAMP(3),
    "consent_granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "kickoff_at" TIMESTAMP(3) NOT NULL,
    "competition" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 3,
    "season" TEXT NOT NULL,
    "venue" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appearances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "minutes_played" INTEGER NOT NULL,
    "position_played" "Position" NOT NULL,
    "started_match" BOOLEAN NOT NULL DEFAULT true,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "xg" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "xa" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "key_passes" INTEGER NOT NULL DEFAULT 0,
    "passes_attempted" INTEGER NOT NULL DEFAULT 0,
    "passes_completed" INTEGER NOT NULL DEFAULT 0,
    "progressive_passes" INTEGER NOT NULL DEFAULT 0,
    "dribbles_attempted" INTEGER NOT NULL DEFAULT 0,
    "dribbles_completed" INTEGER NOT NULL DEFAULT 0,
    "tackles_won" INTEGER NOT NULL DEFAULT 0,
    "interceptions" INTEGER NOT NULL DEFAULT 0,
    "aerial_duels_won" INTEGER NOT NULL DEFAULT 0,
    "aerial_duels_total" INTEGER NOT NULL DEFAULT 0,
    "pressures" INTEGER NOT NULL DEFAULT 0,
    "distance_km" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "top_speed_kmh" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_observations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "appearance_id" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "metric_value" DECIMAL(12,4) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_definitions" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" "MetricUnit" NOT NULL,
    "higher_is_better" BOOLEAN NOT NULL DEFAULT true,
    "domain_min" DECIMAL(12,4),
    "domain_max" DECIMAL(12,4),
    "description" TEXT,

    CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "rating_models" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "min_minutes" INTEGER NOT NULL DEFAULT 450,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "rating_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_model_weights" (
    "id" TEXT NOT NULL,
    "rating_model_id" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "metric_key" TEXT NOT NULL,
    "axis_label" TEXT NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL,

    CONSTRAINT "rating_model_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_cohort_stats" (
    "id" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "tier" INTEGER NOT NULL,
    "metric_key" TEXT NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "mean" DECIMAL(12,4) NOT NULL,
    "stddev" DECIMAL(12,4) NOT NULL,
    "p5" DECIMAL(12,4) NOT NULL,
    "p25" DECIMAL(12,4) NOT NULL,
    "p50" DECIMAL(12,4) NOT NULL,
    "p75" DECIMAL(12,4) NOT NULL,
    "p95" DECIMAL(12,4) NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_cohort_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_ratings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "rating_model_id" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "overall_rating" DECIMAL(4,1) NOT NULL,
    "radar_snapshot" JSONB NOT NULL,
    "sample_minutes" INTEGER NOT NULL,
    "sample_matches" INTEGER NOT NULL,
    "is_provisional" BOOLEAN NOT NULL DEFAULT true,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "market_value" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "release_clause" DECIMAL(14,2),
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlist_items" (
    "id" TEXT NOT NULL,
    "shortlist_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_applications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "club_or_agency" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_country" TEXT,
    "motivation" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "submitted_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organization_id_user_id_key" ON "memberships"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_hashed_key_key" ON "api_keys"("hashed_key");

-- CreateIndex
CREATE INDEX "api_keys_organization_id_idx" ON "api_keys"("organization_id");

-- CreateIndex
CREATE INDEX "players_organization_id_position_deleted_at_idx" ON "players"("organization_id", "position", "deleted_at");

-- CreateIndex
CREATE INDEX "players_organization_id_deleted_at_idx" ON "players"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "players_organization_id_full_name_date_of_birth_key" ON "players"("organization_id", "full_name", "date_of_birth");

-- CreateIndex
CREATE INDEX "matches_organization_id_season_kickoff_at_idx" ON "matches"("organization_id", "season", "kickoff_at" DESC);

-- CreateIndex
CREATE INDEX "matches_organization_id_competition_season_idx" ON "matches"("organization_id", "competition", "season");

-- CreateIndex
CREATE INDEX "appearances_organization_id_player_id_idx" ON "appearances"("organization_id", "player_id");

-- CreateIndex
CREATE INDEX "appearances_organization_id_match_id_idx" ON "appearances"("organization_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "appearances_player_id_match_id_key" ON "appearances"("player_id", "match_id");

-- CreateIndex
CREATE INDEX "metric_observations_organization_id_metric_key_recorded_at_idx" ON "metric_observations"("organization_id", "metric_key", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "metric_observations_appearance_id_metric_key_key" ON "metric_observations"("appearance_id", "metric_key");

-- CreateIndex
CREATE INDEX "rating_models_organization_id_is_active_idx" ON "rating_models"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "rating_models_organization_id_name_version_key" ON "rating_models"("organization_id", "name", "version");

-- CreateIndex
CREATE INDEX "rating_model_weights_rating_model_id_position_idx" ON "rating_model_weights"("rating_model_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "rating_model_weights_rating_model_id_position_metric_key_key" ON "rating_model_weights"("rating_model_id", "position", "metric_key");

-- CreateIndex
CREATE INDEX "metric_cohort_stats_metric_key_season_idx" ON "metric_cohort_stats"("metric_key", "season");

-- CreateIndex
CREATE UNIQUE INDEX "metric_cohort_stats_season_position_tier_metric_key_key" ON "metric_cohort_stats"("season", "position", "tier", "metric_key");

-- CreateIndex
CREATE INDEX "player_ratings_organization_id_season_position_overall_rati_idx" ON "player_ratings"("organization_id", "season", "position", "overall_rating" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "player_ratings_player_id_season_position_rating_model_id_key" ON "player_ratings"("player_id", "season", "position", "rating_model_id");

-- CreateIndex
CREATE INDEX "contracts_organization_id_player_id_status_idx" ON "contracts"("organization_id", "player_id", "status");

-- CreateIndex
CREATE INDEX "contracts_organization_id_end_date_idx" ON "contracts"("organization_id", "end_date");

-- CreateIndex
CREATE INDEX "shortlists_organization_id_idx" ON "shortlists"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "shortlist_items_shortlist_id_player_id_key" ON "shortlist_items"("shortlist_id", "player_id");

-- CreateIndex
CREATE INDEX "scout_applications_status_created_at_idx" ON "scout_applications"("status", "created_at");

-- CreateIndex
CREATE INDEX "scout_applications_email_idx" ON "scout_applications"("email");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entity_type_entity_id_idx" ON "audit_logs"("organization_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_observations" ADD CONSTRAINT "metric_observations_appearance_id_fkey" FOREIGN KEY ("appearance_id") REFERENCES "appearances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_observations" ADD CONSTRAINT "metric_observations_metric_key_fkey" FOREIGN KEY ("metric_key") REFERENCES "metric_definitions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_models" ADD CONSTRAINT "rating_models_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_model_weights" ADD CONSTRAINT "rating_model_weights_rating_model_id_fkey" FOREIGN KEY ("rating_model_id") REFERENCES "rating_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_model_weights" ADD CONSTRAINT "rating_model_weights_metric_key_fkey" FOREIGN KEY ("metric_key") REFERENCES "metric_definitions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_cohort_stats" ADD CONSTRAINT "metric_cohort_stats_metric_key_fkey" FOREIGN KEY ("metric_key") REFERENCES "metric_definitions"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_rating_model_id_fkey" FOREIGN KEY ("rating_model_id") REFERENCES "rating_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist_items" ADD CONSTRAINT "shortlist_items_shortlist_id_fkey" FOREIGN KEY ("shortlist_id") REFERENCES "shortlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlist_items" ADD CONSTRAINT "shortlist_items_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_applications" ADD CONSTRAINT "scout_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
