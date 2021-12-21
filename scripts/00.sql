begin transaction;

-- create tables
create table recipes (
    id      serial primary key,
    name    varchar(100) unique,
    batch   integer
);

create table recipe_tags (
    id        serial primary key,
    recipe_id int references recipes(id) on delete cascade,
    value     varchar(100)
);

create table foods (
    id              serial primary key,
    name            varchar(100) unique,
    protein         real, -- g per 100g
    fat             real, -- g per 100g
    carbs           real, -- g per 100g
    fibre           real  -- g per 100g
);

-- Units for recipe ingredients
create table units (
    id              serial primary key,
    unit            varchar(16), -- eg 'gram', '#', 'tsp'
    measure         varchar(16)  -- eg 'volume', 'mass'
);

-- Converts between "units" eg 'ml', 'tsp' to grams
-- eg 1 '#' of red pepper weighs 75g
create table measurements (
    food_id         int references foods(id) on delete cascade,
    unit_id         int references units(id) on delete cascade,
    grams           real
);

create table ingredients (
    recipe_id       int references recipes(id) on delete cascade,
    food_id         int references foods(id) on delete cascade,
    unit_id         int references units(id) on delete cascade,
    amount          real           -- 200
);

create table users (
    id      serial primary key,
    name    varchar(32)
);

create table plans (
    id          serial primary key,
    user_id     int references users(id) on delete cascade,
    begin_date  date,
    end_date    date
);

create table plan_days (
    id           serial primary key,
    plan_date    date,
    plan_type    varchar(32),
    goal_carbs   real, -- g
    goal_fat     real, -- g
    goal_protein real, -- g
    plan_id      int references plans(id) on delete cascade
);

create table plan_elements (
    id          serial primary key,
    el_type     varchar(32),
    plan_day_id int references plan_days(id) on delete cascade,
    recipe_id   int references recipes(id) on delete cascade
);


end transaction;