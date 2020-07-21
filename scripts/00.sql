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

-- create table foods (
--     id              serial primary key,
--     name            varchar(100) unique,
--     calories        integer,
--     protein         integer,
--     fat             integer,
--     carbs           integer
-- );
--
-- create table ingredients (
--     recipe_id       integer references recipes(id) on delete cascade,
--     food_id         integer references foods(id) on delete cascade,
--     amount          float
-- );
--
-- create table users (
--     id              serial primary key,
--     name            varchar(100) unique
-- );
--
-- create table plans (
--     id              serial primary key,
--     begin_date      timestamp,
--     end_date        timestamp,
--     user_id         integer references users(id) on delete cascade
-- );
--
-- create table plan_elements (
--     id              serial primary key,
--     date            timestamp,
--     type            varchar(100),
--     plan_type       varchar(100),
--     plan_id         integer references plans(id) on delete cascade,
--     recipe_id       integer references recipes(id) on delete cascade
-- );

-- populate some stuff
begin transaction;

-- insert into users(name) values('james');
-- insert into users(name) values('nenna');

commit;
