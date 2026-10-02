#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres (with a stand-in for Supabase's auth schema) and runs the security tests.
set -euo pipefail
cd "$(dirname "$0")/../.."
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5544} -U ${PGUSER:-pgtest} -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists lockin_test" -c "create database lockin_test"
$P -d lockin_test -f supabase/tests/stub.sql
for f in supabase/migrations/*.sql; do $P -d lockin_test -f "$f" >/dev/null; done
echo "migrations applied"
for t in supabase/tests/*.test.sql; do $P -d lockin_test -f "$t" 2>&1; done | grep -E "NOTICE:  pass:|FAIL|ERROR|PASSED" | sed -E "s/^psql:[^ ]+ //"
