#!/usr/bin/env sh
# Detects Prisma schema changes not captured in a migration file.
# Requires a shadow database (SHADOW_DATABASE_URL env var or running local PostgreSQL).
# Best used in CI. For local pre-push, use `npm run db:validate` instead.
#
# Exit codes: 0 = in sync, 1 = drift detected or error.

echo "Checking for migration drift..."

cd apps/api || exit 1

npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma \
  --shadow-database-url "${SHADOW_DATABASE_URL:-postgresql://otantist:otantist_dev@localhost:5432/otantist_shadow}" \
  --exit-code

EXIT_CODE=$?

if [ "$EXIT_CODE" -eq 2 ]; then
  echo ""
  echo "ERROR: Prisma schema has changes not captured in a migration."
  echo "Run 'cd apps/api && npx prisma migrate dev --name <name>' to create a migration."
  exit 1
elif [ "$EXIT_CODE" -ne 0 ]; then
  echo "ERROR: prisma migrate diff failed (exit code $EXIT_CODE)."
  exit 1
fi

echo "Migrations are in sync with schema."
