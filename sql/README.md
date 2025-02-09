# SQL Migrations

This directory contains all database migrations and SQL files for the billing software.

## Migration Files
- `database.sql` - Initial database schema
- `tax-settings-migration.sql` - Tax settings columns addition
- `companies-policy.sql` - Company table policies
- `profiles-migration.sql` - User profiles setup

## How to Apply Migrations

1. Run initial schema:
```sql
psql -f database.sql
```

2. Apply tax settings:
```sql
psql -f tax-settings-migration.sql
```

3. Apply security policies:
```sql
psql -f companies-policy.sql
```

4. Setup profiles:
```sql
psql -f profiles-migration.sql
```

Always run migrations in this order to maintain database consistency.