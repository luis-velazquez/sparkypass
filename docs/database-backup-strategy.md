# Database Backup Strategy — SparkyPass Beta

## Current Stack
- **Production**: Turso (libSQL) cloud database
- **Local dev**: better-sqlite3 file (`sparkypass.db`)
- **ORM**: Drizzle ORM

## Turso Built-in Protections

Turso provides several backup mechanisms out of the box:

### 1. Point-in-Time Recovery (PITR)
- Available on Turso **Scaler** and **Enterprise** plans
- Allows restoring the database to any point in time within the retention window
- Enable via Turso dashboard or CLI:
  ```bash
  turso db update sparkypass --enable-pitr
  ```

### 2. Database Branching
- Create a read-only snapshot of the database at any time:
  ```bash
  turso db create sparkypass-backup-$(date +%Y%m%d) --from-db sparkypass
  ```
- Useful before migrations or risky operations

### 3. Database Export
- Export the full SQLite database as a file:
  ```bash
  turso db shell sparkypass .dump > backup-$(date +%Y%m%d).sql
  ```

## Recommended Backup Schedule

### Automated Daily Backups
Add a cron job or CI scheduled action to create daily snapshots:

```bash
#!/bin/bash
# backup.sh — run daily via cron or GitHub Actions
DATE=$(date +%Y%m%d)
turso db create sparkypass-backup-$DATE --from-db sparkypass
# Keep only last 7 backups
for old in $(turso db list --json | jq -r '.[].name' | grep "sparkypass-backup-" | sort | head -n -7); do
  turso db destroy $old --yes
done
```

### Before Migrations
Always snapshot before running schema migrations:
```bash
turso db create sparkypass-pre-migration-$(date +%Y%m%d%H%M) --from-db sparkypass
npx drizzle-kit push
```

### Manual Exports
Monthly full SQL exports stored off-platform (e.g., S3, local):
```bash
turso db shell sparkypass .dump > backups/sparkypass-$(date +%Y%m%d).sql
```

## Recovery Procedures

### Restore from Branch
```bash
# 1. Check the backup exists
turso db list | grep backup

# 2. Swap the production URL to point to the backup
# Update TURSO_DATABASE_URL in Vercel env vars

# 3. Or copy data back
turso db shell sparkypass-backup-YYYYMMDD .dump | turso db shell sparkypass
```

### Restore from SQL Export
```bash
turso db create sparkypass-restored
turso db shell sparkypass-restored < backups/sparkypass-YYYYMMDD.sql
# Update TURSO_DATABASE_URL to point to restored DB
```

## Pre-Launch Checklist
- [ ] Verify Turso plan supports PITR (upgrade to Scaler if needed)
- [ ] Enable PITR on the production database
- [ ] Set up daily backup cron (GitHub Actions or external)
- [ ] Test a restore from backup at least once
- [ ] Document the recovery runbook for the team
