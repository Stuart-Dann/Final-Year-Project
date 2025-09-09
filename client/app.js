import { selectedOptions, toggleFilter } from "./filters/index.js";
import { attacheventListenersToEventForm } from "../events/index.js";
import { validateCheckBoxes, exportEventstoCSV, checkInputs, exportEventstoJSON } from "./utils/index.js";
import { populateCalendarEvents, generateCalendar, updateGridSelection, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } from "./calender/index.js";
import { loginInit } from "./login/index.js";
import { getUserInfo, logout, createUser, deleteUser } from "./api/index.js";
const calendar = document.querySelector("#calendar");
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const filters = document.querySelectorAll(".filter-container");
// const eventDetails = [];
// set the css var --calendarColumns to the number of days
document.documentElement.style.setProperty("--calendar-columns", days.length);

let lines; // usef or induction lines csv
export const ind = {
	lines: [],
	depts: [],
	courses: [],
	staff: [],
};

async function loadData(uuid) {
	// load from API based on fragment
	if (uuid) {
		const headers = await fetch(`/event/${uuid}`);
		const response = await headers.json();
		const record = JSON.parse(response.json);
		// populate the form with the data from the record

		document.querySelector("#title").value = record.description;
		document.querySelector("#organiser").value = record.contact;
		document.querySelector("#zone").value = record.zone;
		document.querySelector("#roomtype").value = record.room;

		const durationString = "d" + record.duration;
		const durationElem = document.querySelector(`input[id="${durationString}"]`);
		durationElem.checked = true;
	}
}

export async function init() {
	// load from DB based on fragment
	const uuid = window.location.hash.slice(1);

	generateCalendar();
	calendar.addEventListener("mousedown", handleMouseDown);
	calendar.addEventListener("mousemove", handleMouseMove);
	calendar.addEventListener("mouseup", handleMouseUp);
	calendar.addEventListener("mouseleave", handleMouseLeave);

	// handle touch events
	calendar.addEventListener("touchstart", handleMouseDown);
	calendar.addEventListener("touchmove", handleMouseMove);
	calendar.addEventListener("touchend", handleMouseUp);
	calendar.addEventListener("touchcancel", handleMouseLeave);

	attachEventListeners();

	// Check if the user is an admin
	// If so, load the form
	const userInfo = await getUserInfo();
	if (userInfo.role == "admin") {
		loadForm();
		loadUserForm();
	}

	await loadInductionModules();
	await loadData(uuid);

	connectChangeListeners();

	const requiredInputs = document.querySelectorAll("#details input[required], #details textarea[required]");

	// Add event listeners to required inputs
	requiredInputs.forEach((input) => {
		input.addEventListener("input", checkInputs);
	});

	// Initial check to set the button state on page load
	checkInputs();
}

function attachEventListeners() {
	// Attach logout button event listener
	const logoutButton = document.querySelector("#logoutButton");
	logoutButton.addEventListener("click", async () => {
		const response = await logout();
		if (response.ok) {
			window.location.reload();
		}
	});

	// Attach filter event listeners
	filters.forEach((element) => {
		element.addEventListener("click", toggleFilter);
	});

	// Clear filters
	const clearFilter = document.querySelector("#clearFilters");
	clearFilter.addEventListener("click", () => {
		for (const filter of filters) {
			filter.classList.remove("selected");
		}
		selectedOptions.lecturerFilter = [];
		selectedOptions.courseFilter = [];
		selectedOptions.zoneFilter = [];
		selectedOptions.levelFilter = [];
		populateCalendarEvents();
	});
}

function loadUserForm() {
	const container = document.querySelector("#exportCreateUserContainer");
	const formHTML = `
	<div id="createDeleteUserContainer">
        <form id="createUserForm" class="userForm">
          <label for="createUsername">Username</label>
          <input type="text" id="createUsername" name="username" required placeholder="Enter username" autocomplete="off">
          <label for="createPassword">Password</label>  
          <input type="password" id="createPassword" name="password" required placeholder="Enter password" autocomplete="off">
          <label for="createEmail">Email</label>
          <input type="text" id="createEmail" name="email" required placeholder="Enter email">
          <label for="createDept">Deptartment</label>  
          <input type="text" id="createDept" name="dept" required placeholder="Enter deptartment">
        <label for="createAdmin" id="createAdminLabel">
		Admin?
			<input type="checkbox" id="createAdmin" name="admin" value="admin">
		</label>  
          <button id="createUser" type="submit" class="clickable">Create User</button>
        </form>
        <form id="deleteUserForm" class="userForm">
          <label for="deleteUsername">Username</label>
          <input type="text" id="deleteUsername" name="username" required placeholder="Enter username">
          <button id="deleteUser" type="submit" class="clickable">Delete User</button>
        </form>
    </div>`;
	container.innerHTML += formHTML;

	attachUserFormEventListeners();
	attachEventListenersToExportButtons();
}

function attachUserFormEventListeners() {
	const createUserForm = document.querySelector("#createUserForm");
	const deleteUserForm = document.querySelector("#deleteUserForm");

	createUserForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const createUserForm = document.querySelector("#createUserForm");
		const formData = new FormData(createUserForm);
		const userDetails = Object.fromEntries(formData.entries());
		const response = await createUser(userDetails.email, userDetails.username, userDetails.password, userDetails.dept, userDetails.admin);
		if (response.ok) {
			alert("User created successfully!");
			createUserForm.reset();
		} else {
			alert("Failed to create user.");
		}
	});
	deleteUserForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const deleteUserForm = document.querySelector("#deleteUserForm");
		const formData = new FormData(deleteUserForm);
		const userDetails = Object.fromEntries(formData.entries());
		const response = await deleteUser(userDetails.username);
		if (response.ok) {
			alert("User deleted successfully!");
			deleteUserForm.reset();
		} else {
			alert("Failed to delete user.");
		}
	});
}

function loadForm() {
	const detailsDiv = document.querySelector("#details");

	const formHTML = `
        <h2 id="formHeading" data-id>Add New Event</h2>
        <form id="eventForm">
            <p>Title</p>
            <input id="title" name="title" type="text" placeholder="The title of your event - what's it for?" required>

            <p>Level</p>
            <div class="radiogroup">
                <label for="level3">
                    <input type="radio" id="level3" name="level" value="Year 0" required>
                    Foundation
                </label>
                <label for="level4">
                    <input type="radio" id="level4" name="level" value="Year 1" required>
                    L4
                </label>
                <label for="level5">
                    <input type="radio" id="level5" name="level" value="Year 2" required>
                    L5
                </label>
                <label for="level6">
                    <input type="radio" id="level6" name="level" value="Year 3" required>
                    L6
                </label>
                <label for="level7">
                    <input type="radio" id="level7" name="level" value="Year 4" required>
                    L7
                </label>
            </div>

            <p>Mode</p>
            <div class="radiogroup">
                <label for="ft">
                    <input type="radio" id="ft" name="mode" value="ft" required>
                    Full Time
                </label>
                <label for="pt">
                    <input type="radio" id="pt" name="mode" value="pt" required>
                    Part Time
                </label>
            </div>

            <p>Instance</p>
            <div class="radiogroup">
                <label for="sem1">
                    <input type="radio" id="sem1" name="instance" value="Sem1" required>
                    Semester 1
                </label>
                <label for="sem2">
                    <input type="radio" id="sem2" name="instance" value="Sem2" required>
                    Semester 2
                </label>
            </div>

            <p>Course</p>
            <div class="checkboxgroup" id="courses"></div>

            <p>Day</p>
            <div class="radiogroup">
                <label for="mon">
                    <input type="radio" id="mon" name="day" value="mon" required>
                    Mon
                </label>
                <label for="tue">
                    <input type="radio" id="tue" name="day" value="tue" required>
                    Tue
                </label>
                <label for="wed">
                    <input type="radio" id="wed" name="day" value="wed" required>
                    Wed
                </label>
                <label for="thu">
                    <input type="radio" id="thu" name="day" value="thu" required>
                    Thu
                </label>
                <label for="fri">
                    <input type="radio" id="fri" name="day" value="fri" required>
                    Fri
                </label>
                <label for="sat">
                    <input type="radio" id="sat" name="day" value="sat" required>
                    Sat
                </label>
                <label for="sun">
                    <input type="radio" id="sun" name="day" value="sun" required>
                    Sun
                </label>
            </div>

            <p>Start Time</p>
            <div class="radiogroup">
                <label for="t9">
                    <input type="radio" id="t9" name="time" value="9" required>
                    9:00
                </label>
                <label for="t10">
                    <input type="radio" id="t10" name="time" value="10" required>
                    10:00
                </label>
                <label for="t11">
                    <input type="radio" id="t11" name="time" value="11" required>
                    11:00
                </label>
                <label for="t12">
                    <input type="radio" id="t12" name="time" value="12" required>
                    12:00
                </label>
                <label for="t13">
                    <input type="radio" id="t13" name="time" value="13" required>
                    13:00
                </label>
                <label for="t14">
                    <input type="radio" id="t14" name="time" value="14" required>
                    14:00
                </label>
                <label for="t15">
                    <input type="radio" id="t15" name="time" value="15" required>
                    15:00
                </label>
                <label for="t16">
                    <input type="radio" id="t16" name="time" value="16" required>
                    16:00
                </label>
                <label for="t17">
                    <input type="radio" id="t17" name="time" value="17" required>
                    17:00
                </label>
            </div>

            <p>Duration</p>
            <div class="radiogroup">
                <label for="d1">
                    <input type="radio" id="d1" name="duration" value="1" required>
                    1 hour
                </label>
                <label for="d2">
                    <input type="radio" id="d2" name="duration" value="2" required>
                    2 hours
                </label>
                <label for="d3">
                    <input type="radio" id="d3" name="duration" value="3" required>
                    3 hours
                </label>
                <label for="d4">
                    <input type="radio" id="d4" name="duration" value="4" required>
                    4 hours
                </label>
                <label for="d5">
                    <input type="radio" id="d5" name="duration" value="5" required>
                    5 hours
                </label>
                <label for="d6">
                    <input type="radio" id="d6" name="duration" value="6" required>
                    6 hours
                </label>
                <label for="d7">
                    <input type="radio" id="d7" name="duration" value="7" required>
                    7 hours
                </label>
                <label for="d8">
                    <input type="radio" id="d8" name="duration" value="8" required>
                    8 hours
                </label>
                <label for="d9">
                    <input type="radio" id="d9" name="duration" value="9" required>
                    9 hours
                </label>
            </div>

            <p>Organiser</p>
            <input list="organisers" id="organiser" name="organiser" placeholder="Enter organiser name" required>
            <datalist id="organisers"></datalist>

            <p>Lecturer</p>
            <div class="checkboxgroup" id="lecturers"></div>

            <p>Zone</p>
            <input list="zones" id="zone" name="zone" placeholder="Select a zone" required>
            <datalist id="zones"></datalist>

            <p>Room Type</p>
            <input list="roomtypes" id="roomtype" name="roomtype" placeholder="Select a room type" required>
            <datalist id="roomtypes"></datalist>

            <p>Details</p>
            <textarea id="desc" name="description" placeholder="Enter a name, a description or notes (e.g. DE only)"></textarea>

            <p data-tooltip="Leave blank to use suggestion">ICode</p>
            <input id="icode" placeholder="I00000" name="icodes" value="">

            <p>Finalized</p>
            <div class="radiogroup">
                <label for="f1">
                    <input type="radio" id="f1" name="finalized" value="true" required>
                    Yes
                </label>
                <label for="f2">
                    <input type="radio" id="f2" name="finalized" value="false" required>
                    No
                </label>
            </div>

            <div></div>

            <div id="formButtons">
                <button type="submit" id="addEvent" class="clickable">Submit</button>
                <button type="button" id="clearForm">Clear Form</button>
                <button type="button" id="deleteEvent" disabled>Delete Event</button>
            </div>
        </form>
    `;

	detailsDiv.innerHTML = formHTML;

	attacheventListenersToEventForm();
}

function attachEventListenersToExportButtons() {
	const exportToCSVButton = document.querySelector("#exportToCSV");
	const exportToJSONButton = document.querySelector("#exportToJSON");

	exportToJSONButton.addEventListener("click", exportEventstoJSON);
	exportToCSVButton.addEventListener("click", exportEventstoCSV);
}

async function loadCSV(fn) {
	const headers = await fetch(fn);
	const text = await headers.text();
	lines = text.split("\n");
	return lines;
}

function populateZones() {
	const zones = document.querySelector("#zones");
	for (const zone of ind.zones) {
		if (zone.trim().length > 0) {
			const [id, rest] = zone.split(', "');
			const option = document.createElement("option");
			option.value = id;
			option.textContent = rest.slice(0, -1);
			zones.append(option);
		}
	}
}

function populateRoomTypes() {
	const rt = document.querySelector("#roomtypes");
	const roomTypes = new Set();
	for (const room of ind.rooms) {
		const rs = room.split(",");
		roomTypes.add(rs[4]);
	}
	for (const roomType of [...roomTypes]) {
		if (roomType.trim().length > 0) {
			const option = document.createElement("option");
			option.value = roomType.trim();
			option.textContent = roomType.trim();
			rt.append(option);
		}
	}
}

function populateOrganisers() {
	const organisers = document.querySelector("#organisers");
	const staffMembers = ind.staff.slice(1); // Assuming `ind.staff` contains lecturer data
	for (const staffMember of staffMembers) {
		const [name, email] = staffMember.split(",");
		if (name.trim().length > 0) {
			const option = document.createElement("option");
			option.value = name.trim();
			option.textContent = name.trim();
			organisers.append(option);
		}
	}
}

function populateLecturerCheckboxes() {
	const lecturerContainer = document.querySelector("#lecturers");

	const staffMembers = ind.staff.slice(1); // Assuming `ind.staff` contains lecturer data

	for (const staffMember of staffMembers) {
		const [name, email] = staffMember.split(",");
		if (name.trim().length > 0) {
			const div = document.createElement("div");
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = `lecturer-${name.trim()}`;
			checkbox.name = "lecturers";
			checkbox.value = name.trim();

			const label = document.createElement("label");
			label.setAttribute("for", `lecturer-${name.trim()}`);
			label.textContent = name.trim();

			checkbox.addEventListener("change", () => {
				checkInputs();
				validateCheckBoxes();
			});

			div.appendChild(checkbox);
			div.appendChild(label);
			lecturerContainer.appendChild(div);
		}
	}
}

function extractCourseTitlesAndCodes() {
	const replacements = ind.replacements.map((r) => r.split(","));
	for (const line of ind.lines) {
		let [code, title, dept, value, link, instance] = line.split(",");
		let [courseCode, courseTitle, year, semester] = title.split("|");
		courseCode = courseCode.trim();
		courseTitle = (courseTitle ?? "NO TITLE").trim();
		year = (year ?? "NO YEAR").trim();
		instance = (instance ?? "NO INSTANCE").trim();
		if (courseTitle) {
			let shortCourseTitle = courseTitle;

			// loop over replacements and replace each one
			for (const replacement of replacements) {
				shortCourseTitle = shortCourseTitle.replace(replacement[0], replacement[1] ?? "");
			}
			// if (courseCode.trim() === 'U2753PYC') {
			//   console.log(code, courseCode, courseTitle, shortCourseTitle, year, semester, dept, value, link, instance);
			//   console.log(ind.courses.length);
			// }

			ind.courses.push({ code, courseCode, courseTitle, shortCourseTitle, year, semester, dept, value, link, instance });

			if (!ind.depts.includes(dept)) ind.depts.push(dept);
		}
	}

	// remove duplicates based on shortCourseTitle
	ind.coursesNoDupes = ind.courses.filter((course, index, self) => index === self.findIndex((t) => t.shortCourseTitle === course.shortCourseTitle));

	ind.depts.sort();
	ind.coursesNoDupes.sort((a, b) => a.shortCourseTitle.localeCompare(b.shortCourseTitle));
}

function generateICodeLookupTable() {
	// Implementation of the function
	ind.iCodeLookup = {};

	// remove the zeroth elemenbt of ind.courses because it is the header
	ind.courses.shift();

	for (const course of ind.courses) {
		let level = "??";
		if (course.year === "Year 1") {
			level = "L4";
		} else if (course.year === "Year 2") {
			level = "L5";
		} else if (course.year === "Year 3") {
			level = "L6";
		} else if (course.year === "Year 4") {
			level = "L7";
		} else {
			// add to the inptuterrors pre box
			const ie = document.querySelector("#inputerrors");
			ie.textContent += `Cannot index level for ${course.code} ${course.courseTitle}\n`;

			//throw new Error('Cannot index level for ' + course.code);
		}
		const compoundKey = course.shortCourseTitle + level;
		ind.iCodeLookup[compoundKey] = course;
	}
}

async function loadInductionModules() {
	ind.lines = await loadCSV("./data/induction-modules.csv");
	ind.zones = await loadCSV("./data/zones.csv");
	ind.rooms = await loadCSV("./data/rooms.csv");
	ind.replacements = await loadCSV("./data/course-title-replacements.csv");
	ind.staff = await loadCSV("./data/staff.csv");

	populateZones();
	populateRoomTypes();
	populateLecturerCheckboxes();
	populateOrganisers();
	extractCourseTitlesAndCodes();
	generateICodeLookupTable();
	refreshOnScreenCourseList();
}

async function refreshOnScreenCourseList(e) {
	const courses = document.querySelector("#courses");
	courses.innerHTML = "";
	addSelectAllOrNone();

	const userInfo = await getUserInfo();
	const selected = userInfo.dept;

	const added = [];
	for (const course of ind.coursesNoDupes) {
		if (course.dept === selected.toUpperCase()) {
			if (added.includes(course.courseCode)) continue;

			added.push(course.courseCode);

			const div = document.createElement("div");

			/// add a check box for each course
			const label = document.createElement("label");
			label.setAttribute("for", course.courseCode);
			label.textContent = course.shortCourseTitle;
			label.dataset.course = JSON.stringify(course);

			const input = document.createElement("input");
			input.type = "checkbox";
			input.name = "courses";
			input.value = course.courseCode;
			input.id = course.courseCode;
			input.dataset.course = JSON.stringify(course);
			input.addEventListener("change", () => {
				checkInputs();
				validateCheckBoxes();
			});

			div.append(input, label);
			courses.append(div);
		}
	}
}

function addSelectAllOrNone() {
	const select = document.createElement("span");
	const selectAll = document.createElement("button");
	selectAll.textContent = "All";
	selectAll.classList.add("clickable");
	selectAll.addEventListener("click", () => {
		for (const course of courses.querySelectorAll("input")) {
			course.checked = true;
		}
		validateCheckBoxes();
	});
	// add a select none button
	const selectNone = document.createElement("button");
	selectNone.textContent = "None";
	selectNone.classList.add("clickable");
	selectNone.addEventListener("click", () => {
		for (const course of courses.querySelectorAll("input")) {
			course.checked = false;
		}
		validateCheckBoxes();
	});
	select.append(selectAll, " ", selectNone);
	courses.append(select);
}

function connectChangeListeners() {
	const deleteEventObserver = new MutationObserver(() => {
		const deleteEvent = document.querySelector("#deleteEvent");
		const formHeading = document.querySelector("#formHeading");
		if (formHeading.dataset.id) {
			deleteEvent.disabled = false;
		} else {
			deleteEvent.disabled = true;
		}
	});
	const formHeading = document.querySelector("#formHeading");
	deleteEventObserver.observe(formHeading, { attributes: true });

	// select all inputs and look for changes
	const inputs = document.querySelectorAll("#details input[required], #details textarea[required]");
	for (const input of inputs) {
		input.addEventListener("input", updateICodes);
	}

	// ensure checkbox changes are valid
	const checkboxes = document.querySelectorAll('input[type="checkbox"]');
	for (const checkbox of checkboxes) {
		checkbox.addEventListener("change", validateCheckBoxes);
		checkbox.addEventListener("change", updateICodes);
	}
	validateCheckBoxes();
	const needGridUpdates = document.querySelectorAll('input[name="day"], input[name="time"], input[name="duration"]');
	for (const input of needGridUpdates) {
		input.addEventListener("change", updateGridSelection);
	}
}

function updateICodes() {
	// create an array of the selected course short names
	const courses = document.querySelectorAll('input[type="checkbox"]:checked');
	const courseCodes = [];
	for (const course of courses) {
		const courseData = course.value;
		courseCodes.push(courseData);
	}

	// search in ind.courses for all courses with this short name
	let matches = ind.courses.filter((c) => courseCodes.includes(c.courseCode));

	// use the selected level to filter the instance codes
	// const levelElem = document.querySelector('input[name="level"]:checked');
	// const level = levelElem ? levelElem.value : '';

	// if a level has been selected, use it to filter the results
	const levelElem = document.querySelector('input[name="level"]:checked');
	if (levelElem) {
		matches = matches.filter((c) => c.year === levelElem.value);
	}

	// if a semester has been selected, use it to filter the results
	const instanceElem = document.querySelector('input[name="instance"]:checked');
	if (instanceElem) {
		matches = matches.filter((c) => c.instance === instanceElem.value);
	}

	const instanceCodes = [];
	for (const match of matches) {
		instanceCodes.push(match.code);
	}

	// const filteredInstanceCodes = instanceCodes.filter(c => c.includes(level) && c.includes(mode));

	document.querySelector("#icode").value = `${instanceCodes.join(" ")}`;
}

// script should be deferred but
// just in case only start on load
document.addEventListener("DOMContentLoaded", loginInit);
