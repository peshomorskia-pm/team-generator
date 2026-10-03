-- Seed Data: Players
-- Description: Sample Bulgarian players with realistic ELO ratings.

INSERT INTO public.players (name, rating)
VALUES
    ('Димитър Иванов', 1350.50),
    ('Иван Петров', 1200.00),
    ('Георги Димитров', 1420.75),
    ('Николай Йорданов', 1150.20),
    ('Александър Георгиев', 1580.00),
    ('Стефан Тодоров', 1230.10)
ON CONFLICT DO NOTHING;
