-- ============================================================
-- AXON v4.4 — Admin Area Schema (Phase 1)
-- 8 tables: profiles, institutions, memberships, platform_plans,
--           institution_subscriptions, institution_plans,
--           plan_access_rules, admin_scopes
-- ============================================================

-- 0. Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  platform_role TEXT NOT NULL DEFAULT 'user'
                CHECK (platform_role IN ('platform_admin','user')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. INSTITUTIONS
CREATE TABLE institutions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  logo_url    TEXT,
  owner_id    UUID NOT NULL REFERENCES profiles(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_institutions_slug ON institutions(slug);
CREATE INDEX idx_institutions_owner ON institutions(owner_id);
CREATE TRIGGER trg_institutions_updated
  BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. MEMBERSHIPS
CREATE TABLE memberships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id      UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role                TEXT NOT NULL DEFAULT 'student'
                      CHECK (role IN ('owner','admin','professor','student')),
  institution_plan_id UUID,  -- FK added after institution_plans exists
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_memberships_user_inst ON memberships(user_id, institution_id);
CREATE INDEX idx_memberships_institution ON memberships(institution_id);
CREATE INDEX idx_memberships_plan ON memberships(institution_plan_id);
CREATE TRIGGER trg_memberships_updated
  BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. PLATFORM PLANS (Axon -> Institutions)
CREATE TABLE platform_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  price_cents     INTEGER NOT NULL DEFAULT 0,
  billing_cycle   TEXT NOT NULL DEFAULT 'monthly'
                  CHECK (billing_cycle IN ('monthly','yearly')),
  max_students    INTEGER,
  max_courses     INTEGER,
  max_storage_mb  INTEGER,
  features        JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_platform_plans_slug ON platform_plans(slug);
CREATE TRIGGER trg_platform_plans_updated
  BEFORE UPDATE ON platform_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. INSTITUTION SUBSCRIPTIONS
CREATE TABLE institution_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  plan_id          UUID NOT NULL REFERENCES platform_plans(id),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','past_due','canceled','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inst_subs_institution ON institution_subscriptions(institution_id);
CREATE INDEX idx_inst_subs_plan ON institution_subscriptions(plan_id);
CREATE TRIGGER trg_inst_subs_updated
  BEFORE UPDATE ON institution_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. INSTITUTION PLANS (Institutions -> Students)
CREATE TABLE institution_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price_cents     INTEGER NOT NULL DEFAULT 0,
  billing_cycle   TEXT NOT NULL DEFAULT 'monthly'
                  CHECK (billing_cycle IN ('monthly','semester','yearly')),
  is_default      BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inst_plans_institution ON institution_plans(institution_id);
CREATE TRIGGER trg_inst_plans_updated
  BEFORE UPDATE ON institution_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Now add the FK from memberships -> institution_plans
ALTER TABLE memberships
  ADD CONSTRAINT fk_memberships_inst_plan
  FOREIGN KEY (institution_plan_id) REFERENCES institution_plans(id)
  ON DELETE SET NULL;

-- 7. PLAN ACCESS RULES
CREATE TABLE plan_access_rules (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id   UUID NOT NULL REFERENCES institution_plans(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL
             CHECK (scope_type IN ('course','semester','section','topic','summary')),
  scope_id   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_rules_plan ON plan_access_rules(plan_id);
CREATE UNIQUE INDEX idx_access_rules_unique ON plan_access_rules(plan_id, scope_type, scope_id);

-- 8. ADMIN SCOPES
CREATE TABLE admin_scopes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  scope_type      TEXT NOT NULL
                  CHECK (scope_type IN ('full','course','semester','section')),
  scope_id        TEXT,  -- NULL when scope_type = 'full'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_scopes_membership ON admin_scopes(membership_id);

-- ============================================================
-- Done. 8 tables, indices, triggers, constraints.
-- ============================================================
