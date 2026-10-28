-- Standalone cutover (2026-08-11, hand-applied to Turso same day):
-- expire the 4 manually-comped active rows (source NULL, no Stripe ids —
-- there were never real Stripe subscribers). Web billing is terminated;
-- from here Pro comes only from Apple IAP via the RevenueCat webhook, or
-- RC promotional entitlement grants (which arrive with source 'trial').
UPDATE users
SET subscription_status = 'expired', updated_at = unixepoch()
WHERE subscription_status = 'active' AND subscription_source IS NULL;
