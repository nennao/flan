#!/usr/bin/env bash

user="\"svc-flan-api\""
pw="'a6d0ff99cfb8637f6a07a7d12e914b32'"
dbname="flan"

# drop database
<<<<<<< HEAD
<<<<<<< HEAD
psql -p 5433 -c "drop database $dbname"
psql -p 5433 -c "drop user $user"

# create default user
psql -p 5433 -c "create user $user with superuser; alter user $user with encrypted password $pw"
=======
psql -p 5433 -d postgres -c "drop database $dbname"
psql -p 5433 -d postgres -c "drop user $user"

# create default user
psql -p 5433 -d postgres -c "create user $user with superuser; alter user $user with encrypted password $pw"
>>>>>>> generate plan button and real api response and improved database scripts
=======
psql -p 5433 -d postgres -c "drop database $dbname"
psql -p 5433 -d postgres -c "drop user $user"

# create default user
psql -p 5433 -d postgres -c "create user $user with superuser; alter user $user with encrypted password $pw"
>>>>>>> 8b7c19864f9d791160c19d571c6bf943da7c4ccd

# create flan DB
psql -p 5433 -d postgres -f "$(dirname $0)/00.sql"
