-- SIWA revocation (Apple 5.1.1(v)): store the Apple refresh token obtained by
-- exchanging the sign-in authorizationCode, so account deletion can revoke the
-- user's Sign in with Apple grant via https://appleid.apple.com/auth/revoke.
ALTER TABLE linked_providers ADD COLUMN apple_refresh_token TEXT;
