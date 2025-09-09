import { getUserInfo } from "../api/index.js";

export async function getLoggedInUserDetails() {
	const userDetails = await getUserInfo();

	return {
		username: userDetails.name,
		email: userDetails.email,
		dept: userDetails.dept,
		role: userDetails.role,
	};
}

export function checkInputs() {
	const detailsDiv = document.getElementById("details");
	const requiredInputs = detailsDiv.querySelectorAll("input[required], textarea[required]");
	const courseCheckboxes = detailsDiv.querySelectorAll('#courses input[type="checkbox"]');
	const lecturerCheckboxes = detailsDiv.querySelectorAll('#lecturers input[type="checkbox"]');

	let allFilled = true;

	// Check required inputs and textareas
	requiredInputs.forEach((input) => {
		if (input.type === "radio") {
			// Check if any radio button in the group is checked
			const name = input.name;
			const radioGroup = detailsDiv.querySelectorAll(`input[name="${name}"]`);
			const isChecked = Array.from(radioGroup).some((radio) => radio.checked);
			if (!isChecked) {
				allFilled = false;
			}
		} else {
			// Check if the input or textarea has a value
			if (!input.value.trim()) {
				allFilled = false;
			}
		}
	});

	// Check if at least one course checkbox is selected
	const isCourseChecked = Array.from(courseCheckboxes).some((checkbox) => checkbox.checked);
	if (!isCourseChecked) {
		allFilled = false;
	}

	// Check if at least one lecturer checkbox is selected
	const isLecturerChecked = Array.from(lecturerCheckboxes).some((checkbox) => checkbox.checked);
	if (!isLecturerChecked) {
		allFilled = false;
	}
}

export function validateCheckBoxes() {
	const courseCheckboxes = document.querySelectorAll('#courses input[type="checkbox"]');
	const lecturerCheckboxes = document.querySelectorAll('#lecturers input[type="checkbox"]');

	let courseChecked = 0;
	let lecturerChecked = 0;
	for (const checkbox of courseCheckboxes) {
		if (checkbox.checked) courseChecked++;
	}
	for (const checkbox of courseCheckboxes) {
		console.log(checkbox.checked, courseChecked);
		checkbox.setCustomValidity(courseChecked === 0 ? "You must select at least one option" : "");
	}
	for (const checkbox of lecturerCheckboxes) {
		if (checkbox.checked) lecturerChecked++;
	}
	for (const checkbox of lecturerCheckboxes) {
		checkbox.setCustomValidity(lecturerChecked === 0 ? "You must select at least one option" : "");
	}
}

export function exportEventstoCSV() {
	const selectedEvents = document.querySelectorAll(".event");
	const parsedEvents = Array.from(selectedEvents).map((e) => ({
		...e,
		json: JSON.parse(e.dataset.json), // Parse the JSON field for each event
	}));

	console.log("exportEventstoCSV", parsedEvents);
	// Generate CSV rows for all events
	const csvRows = parsedEvents.map((event) => generateCSVRow(event.json));

	// Add a header row (optional)
	const header = ["Title", "Level", "Mode", "Instance", "Day", "Time", "Duration", "Organiser", "Lecturers", "Zone", "Room Type", "Description", "ICode", "Finalized", "Courses"].join(", ");
	csvRows.unshift(header);

	// Create a CSV file and trigger download
	const csvContent = csvRows.join("\n");
	const blob = new Blob([csvContent], { type: "text/csv" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = "events.csv";
	a.click();

	URL.revokeObjectURL(url); // Clean up the URL object
}

export function exportEventstoJSON() {
	const events = document.querySelectorAll(".event");
	const parsedEvents = Array.from(events).map((e) => JSON.parse(e.dataset.json));

	const blob = new Blob([JSON.stringify(parsedEvents, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = "events.json";
	a.click();

	URL.revokeObjectURL(url);
}

function generateCSVRow(event) {
	const values = [];
	const checkedCourses = event.json.courses || [];
	const checkedLecturers = event.json.lecturers || [];

	// Add event details
	values.push(`"${event.json.title}"`);
	values.push(`"${event.json.level}"`);
	values.push(`"${event.json.mode}"`);
	values.push(`"${event.json.instance}"`);
	values.push(event.json.day);
	values.push(event.json.time);
	values.push(event.json.duration);
	values.push(event.organiser);
	values.push(checkedLecturers.join(" "));
	values.push(`"${event.json.zone}"`);
	values.push(`"${event.json.roomtype}"`);
	values.push(`"${event.json.description || ""}"`);
	values.push(event.json.icode || "");
	values.push(event.finalized);
	values.push(checkedCourses.join(" ")); // Add courses as a space-separated string

	return values.join(", ");
}

export function cleanUpUrl() {
	const url = new URL(window.location.href);
	url.search = "";
	history.replaceState(null, "", url.toString());
}
