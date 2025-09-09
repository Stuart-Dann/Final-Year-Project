import { getAllEvents } from "../api/index.js";
import { selectedOptions } from "../filters/index.js";
import { validateCheckBoxes } from "../utils/index.js";

export async function generateCalendar() {
	const calendar = document.getElementById("calendar");
	const hoursInDay = 9;
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	calendar.append(document.createElement("div"));

	for (const day of days) {
		const label = document.createElement("div");
		label.textContent = day;
		label.classList.add("label");
		calendar.append(label);
	}

	for (let i = 0; i < hoursInDay; i++) {
		const label = document.createElement("div");
		label.textContent = i + 9 + ":00";
		label.classList.add("label");
		calendar.append(label);

		for (let j = 0; j < days.length; j++) {
			const timeSlot = document.createElement("div");
			timeSlot.classList.add("time-slot");
			timeSlot.dataset.time = i + 9;
			timeSlot.dataset.day = days[j].toLowerCase();
			calendar.append(timeSlot);
		}
	}
	await populateCalendarEvents();
}

export async function populateCalendarEvents() {
	const timeSlots = document.querySelectorAll(".time-slot");

	clearTimeSlots(timeSlots);

	let allEvents = await getAllEvents();
	if (selectedOptions) {
		allEvents = filterEvents(allEvents);
	}

	const eventJson = parseEventJson(allEvents);

	const timeSlotMap = createTimeSlotMap(timeSlots);

	populateEventsIntoCalendar(eventJson, timeSlotMap);
}

function clearTimeSlots(timeSlots) {
	timeSlots.forEach((slot) => {
		while (slot.firstChild) {
			slot.removeChild(slot.firstChild);
		}
	});
}

function parseEventJson(events) {
	return events.map((e) => ({
		...e,
		json: JSON.parse(e.json),
	}));
}

function createTimeSlotMap(timeSlots) {
	const timeSlotMap = new Map();
	timeSlots.forEach((slot) => {
		const key = `${slot.dataset.day}-${slot.dataset.time}`;
		timeSlotMap.set(key, slot);
	});
	return timeSlotMap;
}

function populateEventsIntoCalendar(eventJson, timeSlotMap) {
	eventJson.forEach((event) => {
		const key = `${event.json.day.slice(0, 3).toLowerCase()}-${event.json.time}`;
		const slot = timeSlotMap.get(key);
		if (slot) {
			const eventElem = createEventElement(event);
			slot.appendChild(eventElem);
		}
	});
}

function createEventElement(event) {
	const eventElem = document.createElement("div");
	eventElem.classList.add("event");
	eventElem.classList.add("clickable");

	const eventTitle = document.createElement("p");
	eventTitle.textContent = event.json.title;
	eventTitle.classList.add("event-title");
	eventElem.appendChild(eventTitle);

	const eventDuration = document.createElement("p");
	eventDuration.textContent = "Dur. " + event.json.duration;
	eventDuration.classList.add("event-duration");
	eventElem.appendChild(eventDuration);

	eventElem.dataset.json = JSON.stringify(event);
	eventElem.addEventListener("click", displayEventDetails);

	return eventElem;
}

function displayEventDetails(event) {
	event.stopPropagation();

	const eventData = JSON.parse(this.dataset.json);

	const eventForm = document.getElementById("eventForm");

	eventForm.reset();

	eventForm.querySelector("#title").value = eventData.json.title ?? "";
	eventForm.querySelector("#desc").value = eventData.json.description ?? "";
	eventForm.querySelector("#icode").value = eventData.json.icode ?? "";
	eventForm.querySelector("#zone").value = eventData.json.zone ?? "";
	eventForm.querySelector("#roomtype").value = eventData.json.roomtype ?? "";
	eventForm.querySelector("#organiser").value = eventData.organiser ?? "";

	const finalizedRadio = eventForm.querySelector(`input[name="finalized"][value="${eventData.finalized}"]`);
	if (finalizedRadio) finalizedRadio.checked = true;

	const dayRadio = eventForm.querySelector(`input[name="day"][value="${eventData.json.day}"]`);
	if (dayRadio) dayRadio.checked = true;

	const timeRadio = eventForm.querySelector(`input[name="time"][value="${eventData.json.time}"]`);
	if (timeRadio) timeRadio.checked = true;

	const durationRadio = eventForm.querySelector(`input[name="duration"][value="${eventData.json.duration}"]`);
	if (durationRadio) durationRadio.checked = true;

	const levelRadio = eventForm.querySelector(`input[name="level"][value="${eventData.json.level}"]`);
	if (levelRadio) levelRadio.checked = true;

	const modeRadio = eventForm.querySelector(`input[name="mode"][value="${eventData.json.mode}"]`);
	if (modeRadio) modeRadio.checked = true;

	const instanceRadio = eventForm.querySelector(`input[name="instance"][value="${eventData.json.instance}"]`);
	if (instanceRadio) instanceRadio.checked = true;

	const coursesContainer = eventForm.querySelector("#courses");
	const selectedCourses = eventData.json.courses ?? [];
	coursesContainer.querySelectorAll("input[name='courses']").forEach((checkbox) => {
		checkbox.checked = selectedCourses.includes(checkbox.value);
	});

	const lecturerContainer = eventForm.querySelector("#lecturers");
	const selectedLecturers = eventData.json.lecturers ?? [];
	lecturerContainer.querySelectorAll("input[name='lecturers']").forEach((checkbox) => {
		checkbox.checked = selectedLecturers.includes(checkbox.value);
	});

	const formHeading = document.getElementById("formHeading");
	formHeading.textContent = `Editing Event: ${eventData.json.title}`;
	formHeading.dataset.id = eventData.id;

	validateCheckBoxes();
	updateGridSelection();
}

function filterEvents(events) {
	return events.filter((event) => {
		const eventJson = JSON.parse(event.json);

		const courses = Array.isArray(eventJson.courses) ? eventJson.courses : Object.values(eventJson.courses || {});
		const lecturers = Array.isArray(eventJson.lecturers) ? eventJson.lecturers : Object.values(eventJson.lecturers || {});

		if (selectedOptions.zoneFilter.length > 0 && !selectedOptions.zoneFilter.includes(eventJson.zone)) {
			return false;
		}

		if (selectedOptions.courseFilter.length > 0 && !courses.some((course) => selectedOptions.courseFilter.includes(course))) {
			return false;
		}

		if (selectedOptions.lecturerFilter.length > 0 && !lecturers.some((lecturer) => selectedOptions.lecturerFilter.includes(lecturer))) {
			return false;
		}
		if (selectedOptions.levelFilter.length > 0 && !selectedOptions.levelFilter.includes(eventJson.level)) {
			return false;
		}

		return true;
	});
}

export function updateGridSelection() {
	const selected = document.querySelectorAll(".selected");
	for (const slot of selected) {
		slot.classList.remove("selected");
	}
	try {
		const day = document.querySelector('input[name="day"]:checked').value;
		const time = Number(document.querySelector('input[name="time"]:checked').value);
		const duration = document.querySelector('input[name="duration"]:checked').value;
		for (let i = 0; i < duration; i++) {
			const selector = `.time-slot[data-day="${day}"][data-time="${time + i}"]`;
			const slot = document.querySelector(selector);
			slot.classList.add("selected");
		}
	} catch (e) {
		return;
	}
}

let isDragging = false;

export function handleMouseDown(e) {
	isDragging = true;
	timeSlotClicked(e);
	updateTime();
}

export function handleMouseMove(e) {
	if (isDragging) {
		timeSlotClicked(e);
		updateTime();
	}
}

export function handleMouseUp() {
	isDragging = false;
	updateTime();
}

export function handleMouseLeave() {
	isDragging = false;
}

function updateTime() {
	// Calculate or retrieve the start time and duration based on the selected time-slots
	const selectedSlots = document.querySelectorAll(".calendar .selected");
	if (selectedSlots.length === 0) return;
	const startTime = selectedSlots[0].dataset.time; // Replace with actual start time
	const duration = selectedSlots.length; // Duration is number of selected slots

	// get he name of the day from selectedSlots[0].dataset.day;
	// and use this to update the day radio buttons
	const day = selectedSlots[0].dataset.day.toLowerCase();
	const dayElem = document.querySelector(`input[value="${day}"]`);
	dayElem.checked = true;

	const hourElem = document.querySelector(`input[id="t${startTime}"]`);
	hourElem.checked = true;

	const durationElem = document.querySelector(`input[id="d${duration}"]`);
	durationElem.checked = true;
}

function toggle(elem) {
	return elem.classList.toggle("selected");
}

let lastToggledElement = null;

function timeSlotClicked(e) {
	// short circuit for non-time slots
	if (!e.target.classList.contains("time-slot")) return;

	// if the last toggled element is the same as the current
	// one, do nothing - this avoids flashing
	if (lastToggledElement === e.target) return;
	lastToggledElement = e.target;

	const selected = calendar.querySelectorAll(".selected");

	// when there are no selections yet, toggle the slot
	if (selected.length === 0) return toggle(e.target);

	// when there is one selection, and it's the same as the clicked slot, switch it off
	if (selected.length === 1 && selected[0] === e.target) return toggle(e.target);

	const targetDay = e.target.dataset.day;
	const targetTime = Number(e.target.dataset.time);
	const prevSelector = `.selected[data-day='${targetDay}'][data-time='${targetTime - 1}']`;
	const nextSelector = `.selected[data-day='${targetDay}'][data-time='${targetTime + 1}']`;
	const prev = document.querySelector(prevSelector);
	const next = document.querySelector(nextSelector);

	// if the slot is the middle of a sandwich, ignore the click
	if (prev && next) return;

	// if the slot is not adjacent to something, remove all previous selections
	if (!prev && !next) {
		for (const slot of selected) {
			toggle(slot);
		}
	}

	// made it here? toggle!
	toggle(e.target);
}
