import { upsertEvent } from "../api/index.js";
import { getLoggedInUserDetails } from "../utils/index.js";
import { ind } from "../app.js";
import { populateCalendarEvents } from "../calender/index.js";
import { deleteEventById } from "../api/index.js";
import { updateGridSelection } from "../calender/index.js";

export async function submitEvent(e) {
	e.preventDefault();

	const eventDetails = extractFormData();
	const unitTitles = processUnitCodes(eventDetails.icodes);
	const event = constructEventObject(eventDetails, unitTitles);

	// Check for conflicts
	const conflict = checkForConflicts(event);
	if (conflict) {
		const userConfirmed = confirm(`Conflict detected:\n${conflict}\nDo you want to submit the event anyway?`);
		if (!userConfirmed) {
			console.warn("Event submission canceled due to conflicts.");
			return;
		}
	}

	// Proceed with submission
	if (await upsertEvent(event)) {
		console.log("Event successfully submitted:", event);
		resetForm();
	} else {
		console.error("Failed to submit event:", event);
	}
	populateCalendarEvents();
}

function checkForConflicts(event) {
	const allEvents = document.querySelectorAll(".event");
	const eventDetails = event.json;
	console.log("Event Details:", eventDetails);
	const allEventsDetails = Array.from(allEvents).map((elem) => JSON.parse(elem.dataset.json));

	const conflictingEventsRoomType = allEventsDetails.filter(
		(elem) =>
			elem.json.day === eventDetails.day &&
			elem.json.roomtype === eventDetails.roomtype &&
			elem.json.zone === eventDetails.zone &&
			elem.id !== event.id &&
			(elem.json.time >= eventDetails.time) & (elem.json.time < eventDetails.time + eventDetails.duration)
	);

	if (conflictingEventsRoomType.length > 0) {
		alert("Conflict detected with existing events in the same room type in the same zone and time slot.");
	}

	console.log("Conflicting Events Room Type:", conflictingEventsRoomType);

	console.log("All Events Details:", allEventsDetails);
}

function resetForm() {
	const eventForm = document.querySelector("#eventForm");
	eventForm.reset();
	const formHeading = document.querySelector("#formHeading");
	if (formHeading.dataset.id) {
		showFormConfirmation("Event updated successfully!");
		formHeading.dataset.id = "";
		formHeading.textContent = "Add Event";
	} else {
		showFormConfirmation("Event added successfully!");
	}

	setTimeout(() => {
		const formConfirmation = document.querySelector("#formConfirmation");
		formConfirmation.textContent = "";
	}, 3000);
	updateGridSelection();
}

function showFormConfirmation(message) {
	alert(message);
}

function extractFormData() {
	const eventForm = document.querySelector("#eventForm");
	const formData = new FormData(eventForm);
	const eventDetails = Object.fromEntries(formData.entries());
	eventDetails.courses = formData.getAll("courses");
	eventDetails.lecturer = formData.getAll("lecturers");
	console.log("Extracted Form Data:", eventDetails.lecturer);
	console.log("Extracted Event Details:", eventDetails);
	return eventDetails;
}

function processUnitCodes(icodeString) {
	const unitCodes = icodeString.split(" ");
	const records = ind.lines.filter((line) => {
		const [code] = line.split(",");
		return unitCodes.includes(code.trim());
	});

	const unitTitles = records.map((record) => {
		const [, unitTitle] = record.split(",");
		return unitTitle.trim();
	});

	console.log("Processed Unit Titles:", unitTitles);
	return unitTitles;
}

function constructEventObject(eventDetails, unitTitles) {
	const eventId = document.querySelector("#formHeading").dataset.id;

	return {
		id: eventId || undefined,
		organiser: eventDetails.organiser,
		owner: eventDetails.organiser,
		finalized: eventDetails.finalized,
		json: {
			dept: getLoggedInUserDetails().dept,
			icode: eventDetails.icodes,
			module: unitTitles.join(", "),
			title: eventDetails.title,
			zone: eventDetails.zone,
			roomtype: eventDetails.roomtype,
			day: eventDetails.day,
			time: eventDetails.time,
			duration: eventDetails.duration,
			courses: eventDetails.courses,
			instance: eventDetails.instance,
			level: eventDetails.level,
			mode: eventDetails.mode,
			description: eventDetails.description,
			lecturers: eventDetails.lecturer,
		},
	};
}

async function deleteEvent(id) {
	await deleteEventById(id).then(() => {
		populateCalendarEvents();
	});
}

export async function attacheventListenersToEventForm() {
	const eventForm = document.querySelector("#eventForm");
	eventForm.addEventListener("submit", submitEvent);

	const clearEventButton = document.querySelector("#clearForm");
	clearEventButton.addEventListener("click", (e) => {
		e.preventDefault();
		const eventForm = document.querySelector("#eventForm");
		eventForm.reset();
		const formHeading = document.querySelector("#formHeading");
		if (formHeading.dataset.id) {
			formHeading.dataset.id = "";
			formHeading.textContent = "Add Event";
		}
		updateGridSelection();
	});

	const deleteEventButton = document.querySelector("#deleteEvent");
	deleteEventButton.addEventListener("click", async (e) => {
		e.preventDefault();
		const eventForm = document.querySelector("#eventForm");
		const formHeading = document.querySelector("#formHeading");
		if (formHeading.dataset.id) {
			const id = formHeading.dataset.id;
			await deleteEvent(id);
			formHeading.dataset.id = "";
			formHeading.textContent = "Add Event";
			eventForm.reset();
		}
		updateGridSelection();
	});
}
