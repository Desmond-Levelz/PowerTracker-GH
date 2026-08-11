const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new Database("powertracker.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS outages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time TEXT,
        restoration_time TEXT
    )
`).run();

const count = db.prepare("SELECT COUNT(*) AS total FROM outages").get();

if (count.total === 0) {
    const add = db.prepare(`
        INSERT INTO outages
        (location, status, start_time, restoration_time)
        VALUES (?, ?, ?, ?)
    `);

    add.run("Accra", "Power Available", null, null);
    add.run("Madina", "Power Outage", "6:00 PM", "10:00 PM");
    add.run("East Legon", "Power Available", null, null);
    add.run("Kumasi", "Power Available", null, null);
    add.run("Tema", "Power Outage", "5:30 PM", "9:30 PM");
}

app.use(express.static(path.join(__dirname, "..", "www")));

app.get("/api", (req, res) => {
    res.json({
        app: "PowerTracker GH",
        status: "API is running"
    });
});

app.get("/api/outages", (req, res) => {
    const outages = db.prepare("SELECT * FROM outages").all();
    res.json(outages);
});

app.post("/api/outages", (req, res) => {
    const { location, status, start_time, restoration_time } = req.body;

    if (!location || !status) {
        return res.status(400).json({
            error: "Location and status are required"
        });
    }

    const result = db.prepare(`
        INSERT INTO outages
        (location, status, start_time, restoration_time)
        VALUES (?, ?, ?, ?)
    `).run(
        location,
        status,
        start_time || null,
        restoration_time || null
    );

    const outage = db.prepare(
        "SELECT * FROM outages WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json({
        message: "Outage reported successfully",
        outage
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`PowerTracker GH API running on port ${PORT}`);
});

process.stdin.resume();
