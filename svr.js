import * as store from "./eventstore.js";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import ngrok from "@ngrok/ngrok";
import { authenticateToken, checkPermsissions } from "./middleware.js";

dotenv.config();
const app = express();
const SECRET_KEY = process.env.SECRET_KEY; // Replace with a secure key

// Middleware to parse JSON requests
app.use(cookieParser());
app.use(express.json());
app.use(express.static("client", { extensions: ["html"] }));

async function setup() {
  // create session
	const session = await new ngrok.SessionBuilder()
    .authtokenFromEnv()
    .connect();
  // create listener
	const listener = await session
    .httpEndpoint()
	.domain("viable-cicada-sincerely.ngrok-free.app")
    .requestHeader("ngrok-skip-browser-warning", "true")
    .listen();
  // link listener to app
	const socket = await ngrok.listen(app, listener);
	console.log(`Ingress established at: ${listener.url()}`);
}

async function register(req, res) {
	const { email, username, hashedPassword, dept, role } = req.body;	

	const saltRounds = 10;
	const bcryptPassword = await bcrypt.hash(hashedPassword, saltRounds);

	const response = await store.createUser(email, username, bcryptPassword, dept, role);
	return res.json(response);
	
}



async function login(req, res) {
	const { username, hashedPassword } = req.body;

	const userExists = await store.getUserByUsername(username);

	if (!userExists) {
		return res.status(401).json({ message: "Invalid credentials" });
	} else {
		const storedHashedPassword = userExists.password;
		const isMatch = await bcrypt.compare(hashedPassword, storedHashedPassword);
		if (isMatch) {
			const email = userExists.email;
			const role = userExists.role;
			const dept = userExists.dept;
			const token = jwt.sign({ username, email, role, dept }, SECRET_KEY, { expiresIn: "7d" });
			res.cookie('authToken', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'Strict',
				maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
			});
			res.json({ success: true });
		} else {
			return res.status(401).json({ message: "Invalid credentials" });
		}
	}
}
async function getEvents(req, res) {
	res.json(await store.listEvents(req.params.user));
}

async function getAllEventsJson(req, res) {
	res.json(await store.getAllEventsJson());
}

async function getAllEvents(req, res) {
	res.json(await store.getAllEvents());
}

async function getEvent(req, res) {
	const result = await store.findEvent(req.params.id);
	if (result) {
		res.json(result);
	} else {
		res.status(404).send("No match for that ID.");
	}
}

async function postEvent(req, res) {
	console.log("postEvent", req.body);
	const event = await store.upsertEvent(req.body);
	res.json(event);
}

async function putEvent(req, res) {
	const event = await store.editEvent(req.body);
	res.json(event);
}

async function deleteEvent(req, res) {
	const result = await store.deleteEvent(req.params.id);
	if (result) {
		res.status(200).send();
	} else {
		res.status(404).send("No match for that event was found");
	}
}

async function deleteUser(req, res) {
	const result = await store.deleteUser(req.params.username);
	if (result) {
		res.status(200).send();
	} else {
		res.status(404).send("No match for that user was found");
	}
}

app.get("/events/:user", authenticateToken, getEvents);
app.get("/event/:id", authenticateToken, getEvent);
app.get("/events", getAllEvents);
app.get("/json", getAllEventsJson);
app.put("/events/:id", authenticateToken, express.json(), putEvent);
app.post("/events", authenticateToken, checkPermsissions, express.json(), postEvent);
app.delete("/event/:id", authenticateToken, checkPermsissions, deleteEvent);
app.post("/login",express.json(), login);
app.post("/register", authenticateToken, checkPermsissions, express.json(), register);
app.get("/auth", (req, res) => {
    if (req.cookies && req.cookies.authToken) {
        jwt.verify(req.cookies.authToken, SECRET_KEY, (err, user) => {
            if (err) {
                return res.json({ authenticated: false });
            }
            return res.json({ authenticated: true, user });
        });
    } else {
        return res.json({ authenticated: false });
    }
});
app.get("/user", authenticateToken, (req, res) => {
    res.json({
        username: req.user.username,
        role: req.user.role,
        email: req.user.email,
		dept: req.user.dept
    });
});
app.delete("/user/:username", authenticateToken, checkPermsissions, deleteUser);
app.post("/logout", (req, res) => {
	res.clearCookie("authToken");
	res.json({ success: true });
});


const port = process.env.PORT;
app.listen(port, (x) => {
	setup();
});


export default app;
