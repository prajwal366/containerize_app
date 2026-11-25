const express = require("express");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, username FROM accounts ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const topicsResult = await pool.query(
      "SELECT title, icon, progress FROM study_topics ORDER BY id"
    );
    const quizResult = await pool.query("SELECT COUNT(*)::int AS count FROM quiz_results");
    const flashcardsResult = await pool.query(
      "SELECT id, topic, question, answer FROM flashcards ORDER BY id"
    );

    res.json({
      topics: topicsResult.rows,
      quizCount: quizResult.rows[0].count,
      flashcards: flashcardsResult.rows,
      streak: 7
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/api/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM accounts WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: "Username or email is already registered" });
    }

    const passwordHash = hashPassword(password);
    await pool.query(
      "INSERT INTO accounts (name, email, username, password_hash) VALUES ($1, $2, $3, $4)",
      [name || username, email, username, passwordHash]
    );
    return res.status(201).json({ status: "registered", username });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT name, username, password_hash FROM accounts WHERE username = $1",
      [username]
    );

    let account = result.rows[0];
    const demoUsername = process.env.STUDENT_USERNAME || "student";
    const demoPassword = process.env.STUDENT_PASSWORD || "StudyHub123";

    if (!account && username === demoUsername && password === demoPassword) {
      account = { name: "Prajwal", username: demoUsername, password_hash: null };
    }

    if (!account) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (account.password_hash) {
      const validPassword = verifyPassword(password, account.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
    }

    return res.status(200).json({
      status: "authenticated",
      username: account.username,
      name: account.name
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/logout", (req, res) => {
  res.status(200).json({ status: "logged_out" });
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on port ${PORT}`);
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(":");
    const supplied = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  } catch (error) {
    return false;
  }
}
