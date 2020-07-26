-- create db
create database flan;
\connect flan;

-- create tables
create table recipes (
    id      serial primary key,
    name    varchar(100) unique
);

create table recipe_tags (
    id        serial primary key,
    recipe_id int references recipes(id) on delete cascade,
    value     varchar(100)
);

create table foods (
    id              serial primary key,
    name            varchar(100) unique,
    protein         integer,
    fat             integer,
    carbs           integer,
    fibre           integer,
    unit            varchar(10)
);

create table ingredients (
    recipe_id       integer references recipes(id) on delete cascade,
    food_id         integer references foods(id) on delete cascade,
    amount          varchar(64)
);

