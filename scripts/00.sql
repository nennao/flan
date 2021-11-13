begin transaction;

-- create tables
create table recipes (
    id      serial primary key,
    name    varchar(100) unique,
    serves  integer
);

create table recipe_tags (
    id        serial primary key,
    recipe_id int references recipes(id) on delete cascade,
    value     varchar(100)
);

create table foods (
    id              serial primary key,
    name            varchar(100) unique,
    protein         integer, -- g per 100g
    fat             integer, -- g per 100g
    carbs           integer, -- g per 100g
    fibre           integer  -- g per 100g
);

-- Units for recipe ingredients
create table units (
    id              serial primary key,
    unit            varchar(16) -- eg 'gram', '#', 'tsp'
);

-- Converts between "units" eg 'ml', 'tsp' to grams
-- eg 1 '#' of red pepper weighs 75g
create table measurements (
    food_id         int references foods(id) on delete cascade,
    unit_id         int references units(id) on delete cascade,
    grams           int
);

create table ingredients (
    recipe_id       int references recipes(id) on delete cascade,
    food_id         int references foods(id) on delete cascade,
    unit_id         int references units(id) on delete cascade,
    amount          real           -- 200
);


end transaction;