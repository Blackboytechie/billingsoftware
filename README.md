# Billing Software

## Git Branch Management

### Main Branches
- `master` - Main production branch
- `sql-migrations` - Database migrations and SQL changes

### Working with Branches

1. View all branches:
```bash
git branch
```

2. Create a new branch:
```bash
git checkout -b branch-name
```

3. Switch between branches:
```bash
git checkout branch-name
```

4. Push changes to GitHub:
```bash
git add .
git commit -m "Your commit message"
git push origin branch-name
```

5. Merge branches:
```bash
git checkout master
git merge branch-name
```

### SQL Migrations Branch
The `sql-migrations` branch is dedicated to database changes:
- Schema modifications
- New migrations
- Database optimizations

Always create and test migrations in this branch before merging to master.