-- Up

CREATE TABLE Events (
  id        CHAR(36) PRIMARY KEY,
  owner     TEXT     NOT NULL,
  organiser TEXT     NOT NULL,
  finalized BOOL     NOT NULL,
  json      TEXT     NOT NULL
);

CREATE TABLE Users (
  id        SERIAL PRIMARY KEY,
  email     TEXT     NOT NULL,
  password  TEXT     NOT NULL,
  name      TEXT     NOT NULL,
  dept      TEXT     NOT NULL,
  role      TEXT     NOT NULL
);

-- Create a test admin with a hashed password 'password'
INSERT INTO Users (email, password, name, dept) VALUES
( 'up2053696@myport.ac.uk',
  '$2b$10$7xAcGvJI8ohHJ4P83IQXnu5QPmrvVYFLVXsMsFqFmZwO2kgjn5M9.',
  'admin',
  'COMP',
  'admin'
);

-- Create a test user with a hashed password 'password'
INSERT INTO Users (email, password, name, dept) VALUES
( 'up2053696@myport.ac.uk',
  '$2b$10$7xAcGvJI8ohHJ4P83IQXnu5QPmrvVYFLVXsMsFqFmZwO2kgjn5M9.',
  'user',
  'COMP',
  'user'
);
-- Down

DROP TABLE Events;
