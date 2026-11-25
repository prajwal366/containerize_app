CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS study_topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    icon VARCHAR(20) DEFAULT '📘',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(150) NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(150) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email)
VALUES ('Prajwal', 'prajwal@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO study_topics (title, icon, progress) VALUES
    ('Database Management', '🗄', 72),
    ('Computer Networks', '🌐', 48),
    ('Operating Systems', '💻', 86)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_results (topic, score) VALUES
    ('Database Management', 80),
    ('Computer Networks', 70)
ON CONFLICT DO NOTHING;

INSERT INTO flashcards (topic, question, answer) VALUES
    ('Database Management', 'What is a primary key?', 'A unique identifier for each record in a database table.'),
    ('Computer Networks', 'What does DNS stand for?', 'Domain Name System'),
    ('Operating Systems', 'What is a process?', 'A program that is currently being executed.')
ON CONFLICT DO NOTHING;
