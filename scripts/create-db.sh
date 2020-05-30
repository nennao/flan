#!/usr/bin/env bash

user="\"svc-flan-api\""
pw="'a6d0ff99cfb8637f6a07a7d12e914b32'"
dbname="flan"

# drop database
sudo -u postgres psql -p 5433 -c "drop database $dbname"
sudo -u postgres psql -p 5433 -c "drop user $user"

# create default user
sudo -u postgres psql -p 5433 -c "create user $user with superuser; alter user $user with encrypted password $pw"

# create flan DB
psql -p 5433 -d postgres -f "$(dirname $0)/00.sql"
