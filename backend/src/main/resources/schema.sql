DROP TABLE IF EXISTS Bid;
DROP TABLE IF EXISTS UserOnLeague;
DROP TABLE IF EXISTS Relation;
DROP TABLE IF EXISTS League;
DROP TABLE IF EXISTS Player;
DROP TABLE IF EXISTS Team;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(60) NOT NULL,
    password VARCHAR(60) NOT NULL, 
    firstName VARCHAR(60) NOT NULL,
    lastName VARCHAR(60) NOT NULL, 
    email VARCHAR(60) NOT NULL,
    role TINYINT NOT NULL
);

CREATE TABLE Team (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nameTeam VARCHAR(60) NOT NULL,
    imageTeam VARCHAR(100)
);

CREATE TABLE Player (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(60) NOT NULL,
    lastName VARCHAR(60) NOT NULL,
    position VARCHAR(60) NOT NULL,
    age SMALLINT NOT NULL,
    careerTime SMALLINT NOT NULL,
    teamId BIGINT NOT NULL,
    teams VARCHAR(200),
    img VARCHAR(100),
    price INT NOT NULL,
    CONSTRAINT playerTeam_fk FOREIGN KEY(teamId) REFERENCES Team(id)
);

CREATE TABLE League (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    leagueName VARCHAR(60) NOT NULL,
    creatorId BIGINT NOT NULL,
    sizeTeam BIGINT NOT NULL,
    minTeam BIGINT NOT NULL,
    maxTeam BIGINT NOT NULL,
    sizeRotation BIGINT NOT NULL,
    timeRotation BIGINT NOT NULL,
    imageLeague VARCHAR(100),
    initialBudget BIGINT NOT NULL,
    timeRound BIGINT NOT NULL,
    CONSTRAINT leagueUsers_fk FOREIGN KEY(creatorId) REFERENCES Users(id)
);

CREATE TABLE Relation (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    leagueId BIGINT NOT NULL,
    playerId BIGINT NOT NULL,
    userId BIGINT,
    onSale BOOLEAN NOT NULL,
    main BOOLEAN NOT NULL,
    puntuation BIGINT,
    CONSTRAINT relationLeague_fk FOREIGN KEY(leagueId) REFERENCES League(id) ON DELETE CASCADE,
    CONSTRAINT relationPlayer_fk FOREIGN KEY(playerId) REFERENCES Player(id) ON DELETE CASCADE,
    CONSTRAINT relationUser_fk FOREIGN KEY(userId) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE UserOnLeague (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId BIGINT NOT NULL,
    leagueId BIGINT NOT NULL, 
    budget BIGINT NOT NULL,
    isAccepted BOOLEAN NOT NULL,
    puntuation BIGINT,
    CONSTRAINT userOnLeagueUser_fk FOREIGN KEY(userId) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT userOnLeagueLeague_fk FOREIGN KEY(leagueId) REFERENCES League(id) ON DELETE CASCADE
);

CREATE TABLE Bid (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    leagueId BIGINT NOT NULL,
    playerId BIGINT NOT NULL,
    ownerId BIGINT,
    userId BIGINT,
    bidNumber BIGINT NOT NULL,
    isAccepted BOOLEAN NOT NULL,
    CONSTRAINT bidLeague_fk FOREIGN KEY(leagueId) REFERENCES League(id) ON DELETE CASCADE,
    CONSTRAINT bidPlayer_fk FOREIGN KEY(playerId) REFERENCES Player(id),
    CONSTRAINT bidOwner_fk FOREIGN KEY(ownerId) REFERENCES Users(id),
    CONSTRAINT bidUser_fk FOREIGN KEY(userId) REFERENCES Users(id) ON DELETE CASCADE
);

INSERT INTO Team(nameTeam, imageTeam)
VALUES ('Equipo1', 'Team1.png');
INSERT INTO Team(nameTeam, imageTeam)
VALUES ('Equipo2', 'Team2.png');
INSERT INTO Team(nameTeam, imageTeam)
VALUES ('Equipo3', 'Team3.png');

INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Marta',  'Fernandez',  0, 25, 10, 1, '',        'Waterpolo_6.png', 8168);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Maria',  'Suarez',     1, 20, 5,  1, '',        'Waterpolo_7.png', 3704);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pepe',   'Olivo',      2, 20, 5,  1, '',        'Waterpolo_1.png', 96);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Guille', 'Olivarez',   3, 20, 5,  1, '',        'Waterpolo_2.png', 5431);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pepe',   'Olivo',      4, 20, 5,  1, '',        'Waterpolo_3.png', 5768);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Alvaro', 'Cabanillas', 5, 20, 5,  1, '',        'Waterpolo_5.png', 777);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Celso',  'Diaz',       6, 20, 5,  1, '',        'Waterpolo_6.png', 5828);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Carlota', 'Olmos',     0, 20, 5,  2, 'Equipo1', 'Waterpolo_9.png', 8887);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Anton',  'Olivarez',   1, 20, 5,  2, 'Equipo1', 'Waterpolo_5.png', 4611);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Emilia', 'Gutierrez',  2, 25, 10, 2, 'Equipo1', 'Waterpolo_6.png', 8853);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pedro',  'Gonzalez',   3, 20, 5,  2, 'Equipo1', 'Waterpolo_7.png', 6114);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Gonzalo', 'Sanchez',   4, 20, 5,  2, 'Equipo1', 'Waterpolo_1.png', 2170);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Begoña',  'Lopez',     5, 20, 5,  2, 'Equipo1', 'Waterpolo_2.png', 3403);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Carlos',  'Romero',    6, 20, 5,  2, 'Equipo1', 'Waterpolo_3.png', 1334);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Maria',   'Gil',       0, 20, 5,  3, 'Equipo2', 'Waterpolo_1.png', 5579);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Dolores', 'Perez',     1, 20, 5,  3, 'Equipo2', 'Waterpolo_8.png', 3658);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Alvaro',  'Martinez',  2, 20, 5,  3, 'Equipo2', 'Waterpolo_5.png', 9619);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Yolanda', 'Hermida',   3, 20, 5,  3, 'Equipo2', 'Waterpolo_3.png', 8056);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Juan',    'Santos',    4, 20, 5,  3, 'Equipo2', 'Waterpolo_9.png', 9437);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Aaron',   'Vermudez',  5, 20, 5,  3, 'Equipo2', 'Waterpolo_5.png', 8177);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pablo',   'Vermudez',  6, 20, 5,  3, 'Equipo2', 'Waterpolo_5.png', 6944);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Carlota', 'Novo',      0, 20, 5,  3, 'Equipo1', 'Waterpolo_5.png', 5583);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Marta',  'Fernandez',  1, 25, 10, 1, '',        'Waterpolo_6.png', 6150);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Maria',  'Suarez',     2, 20, 5,  1, '',        'Waterpolo_7.png', 5932);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pepe',   'Olivo',      3, 20, 5,  1, '',        'Waterpolo_1.png', 8712);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Guille', 'Olivarez',   4, 20, 5,  1, '',        'Waterpolo_2.png', 5416);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pepe',   'Olivo',      5, 20, 5,  1, '',        'Waterpolo_3.png', 9114);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Alvaro', 'Cabanillas', 6, 20, 5,  1, '',        'Waterpolo_5.png', 3425);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Celso',  'Diaz',       0, 20, 5,  1, '',        'Waterpolo_2.png', 2592);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Carlota', 'Olmos',     1, 20, 5,  2, 'Equipo1', 'Waterpolo_9.png', 1145);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Anton',  'Olivarez',   2, 20, 5,  2, 'Equipo1', 'Waterpolo_5.png', 7861);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Emilia', 'Gutierrez',  3, 25, 10, 2, 'Equipo1', 'Waterpolo_6.png', 7455);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pedro',  'Gonzalez',   4, 20, 5,  2, 'Equipo1', 'Waterpolo_7.png', 4910);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Gonzalo', 'Sanchez',   5, 20, 5,  2, 'Equipo1', 'Waterpolo_1.png', 642);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Begoña',  'Lopez',     6, 20, 5,  2, 'Equipo1', 'Waterpolo_2.png', 2010);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Carlos',  'Romero',    0, 20, 5,  2, 'Equipo1', 'Waterpolo_3.png', 96);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Maria',   'Gil',       1, 20, 5,  3, 'Equipo2', 'Waterpolo_1.png', 863);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Dolores', 'Perez',     2, 20, 5,  3, 'Equipo2', 'Waterpolo_8.png', 4010);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Alvaro',  'Martinez',  3, 20, 5,  3, 'Equipo2', 'Waterpolo_5.png', 7261);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Yolanda', 'Hermida',   4, 20, 5,  3, 'Equipo2', 'Waterpolo_1.png', 1113);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Juan',    'Santos',    5, 20, 5,  3, 'Equipo2', 'Waterpolo_9.png', 6795);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Aaron',   'Vermudez',  6, 20, 5,  3, 'Equipo2', 'Waterpolo_5.png', 396);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Pablo',   'Vermudez',  0, 20, 5,  3, 'Equipo2', 'Waterpolo_5.png', 7365);
INSERT INTO Player(firstName, lastName, position, age, careerTime, teamId, teams, img, price)
VALUES ('Carlota', 'Novo',      1, 20, 5,  3, 'Equipo1', 'Waterpolo_5.png', 4540);

INSERT INTO Users(userName, password, firstName, lastName, email, role)
VALUES ('diego', '$2a$10$.YPXU.Uoq3InMUD0iPo9M.ir9sMuAfo9zojaqtyp55ot/rDN.mDCO', 'Diego', 'Viqueira', 'diego@gmail.com', 1);

INSERT INTO Users(userName, password, firstName, lastName, email, role)
VALUES ('david', '$2a$10$.YPXU.Uoq3InMUD0iPo9M.ir9sMuAfo9zojaqtyp55ot/rDN.mDCO', 'David', 'Molares',  'david@gmail.com', 0);

INSERT INTO Users(userName, password, firstName, lastName, email, role)
VALUES ('yisha', '$2a$10$.YPXU.Uoq3InMUD0iPo9M.ir9sMuAfo9zojaqtyp55ot/rDN.mDCO', 'Yisha', 'Yang',     'yisha@gmail.com', 1);

INSERT INTO Users(userName, password, firstName, lastName, email, role)
VALUES ('alba',  '$2a$10$.YPXU.Uoq3InMUD0iPo9M.ir9sMuAfo9zojaqtyp55ot/rDN.mDCO', 'Alba',   'Bueses',  'alba@gmail.com',  0);

INSERT INTO Users(userName, password, firstName, lastName, email, role)
VALUES ('noah',  '$2a$10$.YPXU.Uoq3InMUD0iPo9M.ir9sMuAfo9zojaqtyp55ot/rDN.mDCO', 'Noah',   'Martin',  'noah@gmail.com',  0);

INSERT INTO Users(userName, password, firstName, lastName, email, role)
VALUES ('anton', '$2a$10$.YPXU.Uoq3InMUD0iPo9M.ir9sMuAfo9zojaqtyp55ot/rDN.mDCO', 'Anton',  'Saenz',   'anton@gmail.com', 0);
