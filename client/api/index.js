import { hashPassword } from "../login/index.js";

// Function to get events for a specific user
export async function getEventsForUser(user) {
	const response = await fetch(`/events/${user}`, {
		method: "GET",
		credentials: "include",
	});
	if (response.ok) {
		const events = await response.json();
		console.log("Events for user:", events);
		return events;
	} else {
		console.error("Failed to fetch events for user:", response.statusText);
	}
}

// Function to get a specific event by its ID
export async function getEventById(id) {
	const response = await fetch(`/event/${id}`, {
		method: "GET",
		credentials: "include",
	});
	if (response.ok) {
		const event = await response.json();
		console.log("Event:", event);
		return event;
	} else {
		console.error("Failed to fetch event:", response.statusText);
	}
}

// Function to get all events
export async function getAllEvents() {
	const response = await fetch("/events", {
		method: "GET",
		credentials: "include",
	});;
	if (response.ok) {
		const events = await response.json();
		console.log("All events:", events);
		return events;
	} else {
		console.error("Failed to fetch all events:", response.statusText);
	}
}

// Function to update an event by its ID
export async function updateEventById(id, eventData) {
	const response = await fetch(`/events/${id}`, {
		method: "PUT",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(eventData),
	});
	if (response.ok) {
		const updatedEvent = await response.json();
		console.log("Updated event:", updatedEvent);
		return updatedEvent;
	} else {
		console.error("Failed to update event:", response.statusText);
	}
}

// Function to create a new event
export async function upsertEvent(eventData) {
	console.log("Upserting event:", eventData);
	const response = await fetch("/events", {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(eventData),
	});
	if (response.ok) {
		const newEvent = await response.json();
		console.log("Created event:", newEvent);
		return newEvent;
	} else {
		console.error("Failed to create event:", response.statusText);
	}
}

// Function to delete an event by its ID
export async function deleteEventById(id) {
	const response = await fetch(`/event/${id}`, {
		method: "DELETE",
		credentials: "include",
	});
	if (response.ok) {
		console.log("Deleted event with ID:", id);
	} else {
		console.error("Failed to delete event:", response.statusText);
	}
}

export async function authenticateToken() {
	const response = await fetch("/auth", {
		method: "GET",
		credentials: "include",
	});
	if (response.ok) {
		const data = await response.json();
		return data.authenticated;
	} else {
		return false;
	}
}

export async function login(username, hashedPassword) {
	const response = await fetch("/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, hashedPassword }),
	});
	return response;
}

export async function createUser(email, username, password, dept, role) {
	const hashedPassword = await hashPassword(password);
	const response = await fetch("/register", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, username, hashedPassword, dept, role }),
	});
	return response;
}

export async function deleteUser(username) {
	const response = await fetch(`/user/${username}`, {
		method: "DELETE",
		credentials: "include",
	});
	if (response.ok) {
		console.log("User deleted successfully");
	} else {
		console.error("Failed to delete user:", response.statusText);
	}
	return response;
}


export async function getUserByUsername(username) {
	const response = await fetch(`/user/${username}`, {
		method: "GET",
		credentials: "include",
	});
	if (response.ok) {
		const user = await response.json();
		return user;
	} else {
		console.error("Failed to fetch user:", response.statusText);
	}
}

export async function getUserInfo() {
    const response = await fetch("/user", { credentials: "include" });
    if (response.ok) {
        const user = await response.json();
		console.log("User info:", user);
        return user;
    } else {
        return null;
    }
}

export async function logout() {
	const response = await fetch("/logout", {
		method: "POST",
		credentials: "include",
	});
	if (response.ok) {
		console.log("User logged out successfully");
	} else {
		console.error("Failed to log out:", response.statusText);
	}
	return response;
}