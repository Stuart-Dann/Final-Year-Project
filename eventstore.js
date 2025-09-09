import uuid from "uuid-random";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Define PostgreSQL connection settings
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
});

// Connect to PostgreSQL
async function init() {
	await pool.connect();
	console.log("Connected to PostgreSQL");
	return pool;
}

const dbConn = init();

export async function listEvents(user) {
	const db = await dbConn;
	return await db.query("SELECT * FROM EVENTS WHERE owner = $1 OR organiser = $1", [user]).rows;
}

export async function upsertEvent(event) {
	const db = await dbConn;
	
	if (event.id) {
		await editEvent(event);
		return findEvent(event.id);
	}
	const id = uuid();
	console.log(id, event);
	const query = `
            INSERT INTO Events (id, owner, organiser, finalized, json)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
	const values = [id, event.organiser, event.owner, event.finalized, event.json];
	const result = await db.query(query, values);
	console.log("Inserted Event:", result.rows[0]);
	return findEvent(id);
}

export async function editEvent(event) {
	const db = await dbConn;
	const query = "UPDATE Events set owner = $1, organiser = $2, finalized = $3, json = $4 WHERE id = $5";
	const values = [event.organiser, event.owner, event.finalized, event.json, event.id];
	const result = await db.query(query, values);
	if (result === 0) {
		throw new Error(`event not found: ${event.id}`);
	}
	return findEvent(event.id);
}

export async function findEvent(id) {
    const db = await dbConn;
    const query = "SELECT * FROM Events WHERE id = $1";
    const values = [id];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
        throw new Error(`Event not found with id: ${id}`);
    }

    return result.rows[0];
}

export async function deleteEvent(id) {
	const db = await dbConn;
	const query = "DELETE FROM Events WHERE id = $1";
	const values = [id];
	const result = await db.query(query, values);
	if (result.rowCount === 0) {
		throw new Error(`Event not found with id: ${id}`);
	}
	return result.rowCount;
}

export async function getAllEvents() {
	const db = await dbConn;
	return (await db.query("SELECT * FROM Events")).rows;
}

export async function getAllEventsJson() {
	console.log("getAllEventsJson");
	const events = await getAllEvents();
	const jsonEvents = events.map((event) => {
		return {
			id: event.id,
			owner: event.owner,
			organiser: event.organiser,
			finalized: event.finalized,
			json: JSON.parse(event.json),
		};
	});
	return jsonEvents;
}

export async function getUserByUsername(username) {
	const db = await dbConn;
	const query = "SELECT * FROM Users WHERE name = $1";
	const values = [username];
	const result = await db.query(query, values);
	if (result.rows.length === 0) {
		throw new Error(`User not found with username: ${username}`);
	}
	return result.rows[0];
}

export async function createUser(email, username, password, dept, role = "user") {
    const db = await dbConn;

    try {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            throw new Error(`User already exists with username: ${username}`);
        }
    } catch (error) {
        if (error.message.includes("User not found")) {
            console.log("Creating new user...");
            const query = "INSERT INTO users (email, name, password, dept, role) VALUES ($1, $2, $3, $4, $5) RETURNING *";
            const values = [email, username, password, dept, role];
            const result = await db.query(query, values);
            console.log("Inserted User:", result.rows[0]);
            return result.rows[0];
        }

        throw error;
    }

    throw new Error(`User already exists with username: ${username}`);
}

export async function deleteUser(username) {
	const db = await dbConn;
	const query = "DELETE FROM Users WHERE name = $1";
	const values = [username];
	const result = await db.query(query, values);
	if (result.rowCount === 0) {
		throw new Error(`User not found with username: ${username}`);
	}
	return result.rowCount;
}
