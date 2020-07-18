-- create db
create database flan;
\connect flan;

-- create tables
create table eaten_thing (
    id              serial primary key,
    name            varchar(100) unique
);

create table foods (
    id              serial primary key,
    name            varchar(100) unique,
    calories        integer,
    protein         integer,
    fat             integer,
    carbs           integer
);

create table ingredients (
    recipe_id       integer references recipes(id) on delete cascade,
    food_id         integer references foods(id) on delete cascade,
    amount          float
);

create table users (
    id              serial primary key,
    name            varchar(100) unique
);

create table plans (
    id              serial primary key,
    begin_date      timestamp,
    end_date        timestamp,
    user_id         integer references users(id) on delete cascade
);

create table plan_elements (
    id              serial primary key,
    date            timestamp,
    type            varchar(100),
    plan_type       varchar(100),
    plan_id         integer references plans(id) on delete cascade,
    recipe_id       integer references recipes(id) on delete cascade
);

-- populate some stuff
begin transaction;

insert into users(name) values('james');
insert into users(name) values('nenna');

insert into foods(name, calories, protein, fat, carbs) values('avocado', 100, 10, 10, 0);
insert into foods(name, calories, protein, fat, carbs) values('onion',   50,  0,  0,  5);
insert into foods(name, calories, protein, fat, carbs) values('coriander', 20, 0, 0, 1);
insert into foods(name, calories, protein, fat, carbs) values('lime_juice', 10, 0, 0, 1);
insert into foods(name, calories, protein, fat, carbs) values('salt', 0, 0, 0, 0);

insert into foods(name, calories, protein, fat, carbs) values('egg', 50, 5, 1, 1);
insert into foods(name, calories, protein, fat, carbs) values('creme_fraiche', 20, 5, 5, 1);
insert into foods(name, calories, protein, fat, carbs) values('butter', 20, 5, 5, 1);

insert into recipes(name) values('guacamole');
insert into ingredients(recipe_id, food_id, amount) values(
    (select id from recipes where name = 'guacamole'),
    (select id from foods where name = 'onion'),
    0.5
);
insert into ingredients(recipe_id, food_id, amount) values (
    (select id from recipes where name = 'guacamole'),
    (select id from foods where name = 'avocado'),
    2.0
);
insert into ingredients(recipe_id, food_id, amount) values(
    (select id from recipes where name = 'guacamole'),
    (select id from foods where name = 'coriander'),
    0.5
);
insert into ingredients(recipe_id, food_id, amount) values (
    (select id from recipes where name = 'guacamole'),
    (select id from foods where name = 'lime_juice'),
    2.0
);


insert into recipes(name) values('ramsled eggs');
insert into ingredients(recipe_id, food_id, amount) values(
    (select id from recipes where name = 'ramsled eggs'),
    (select id from foods where name = 'egg'),
    4
);
insert into ingredients(recipe_id, food_id, amount) values(
    (select id from recipes where name = 'ramsled eggs'),
    (select id from foods where name = 'butter'),
    1
);
insert into ingredients(recipe_id, food_id, amount) values(
    (select id from recipes where name = 'ramsled eggs'),
    (select id from foods where name = 'creme_fraiche'),
    1
);



commit;

-- sample query
select * from 
    recipes r
    join ingredients i on r.id = i.recipe_id
    join foods f on i.food_id = f.id
    ;