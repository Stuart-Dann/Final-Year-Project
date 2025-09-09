import { getLoggedInUserDetails } from "../utils/index.js";
import { ind } from "../app.js";
import { populateCalendarEvents } from '../calender/index.js';
import { getUserInfo } from '../api/index.js';

export let selectedOptions = {
	lecturerFilter: [],
	courseFilter: [],
	zoneFilter: [],
	levelFilter: [],
};
export async function toggleFilter(event) {
    event.stopPropagation();
    console.log("Toggle filter", event.target.id);
    const container = event.target.parentElement;
    const button = event.target;
    const userInfo = await getUserInfo();
    const selected = userInfo.dept;

    // Check if the dropdown is already open
    if (container.classList.contains("opened")) {
        container.classList.remove("opened");
        const existingDropdown = container.querySelector(".filterOption");
        if (existingDropdown) existingDropdown.remove();
        button.classList.remove("opened"); // Remove the opened class to reset chevron
        return;
    }

    // Remove any existing dropdown
    let existingDropdown = container.querySelector(".filterOption");
    if (existingDropdown) {
        existingDropdown.remove();
        button.classList.remove("opened");
    }

    // Create and show the dropdown
    const dropdown = document.createElement("ul");
    dropdown.classList.add("filterOption");
    dropdown.setAttribute("role", "listbox");

    // Populate dropdown with options
    let options = getDropdownOptions(button.id, selected);
    createDropdown(options, event, dropdown);

    // Prevent dropdown clicks from closing it
    dropdown.addEventListener("click", e => e.stopPropagation());

    // Append dropdown to parent container
    container.appendChild(dropdown);

    // Show the dropdown
    dropdown.style.display = "block";
    button.classList.add("opened");
    container.classList.add("opened"); // <-- Only add here

    // Close dropdown when clicking outside
    document.addEventListener("click", function closeDropdown(e) {
        if (!container.contains(e.target)) {
            dropdown.remove();
            button.classList.remove("opened");
            container.classList.remove("opened");
            document.removeEventListener("click", closeDropdown);
        }
    });
}

export function createDropdown(options, event, dropdown) {
	options.forEach((option, index) => {
		const li = document.createElement("li");
		const label = document.createElement("label");
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		li.classList.add("filterOption");
		label.classList.add("filter");

		if (event.target.id === "courseFilter" && typeof option === "object") {
            label.textContent = option.shortCourseTitle; // Set text to shortCourseTitle
            checkbox.value = option.courseCode; // Set value to courseCode
        } else {
            label.textContent = option; // Default text for other dropdowns
            checkbox.value = option; // Default value for other dropdowns
        }

		if (selectedOptions[event.target.id].includes(option)) {
			checkbox.checked = true;
		}
		checkbox.addEventListener("change", () => {
			if (checkbox.checked) {
				selectedOptions[event.target.id].push(checkbox.value);
			} else {
				const index = selectedOptions[event.target.id].indexOf(checkbox.value);
				if (index > -1) {
					selectedOptions[event.target.id].splice(index, 1);
				}
			}
			console.log("Selected:", selectedOptions);
			populateCalendarEvents();
		});
		label.appendChild(checkbox);
		li.appendChild(label);

		if (index < options.length - 1) {
			li.style.borderBottom = "1px solid #ddd";
		} else {
			label.style.borderRadius = "0px 0px 5px 5px";
		}
		dropdown.appendChild(li);
	});
	dropdown.style.borderRadius = "5px 5px 0px 100px";
}

export function getDropdownOptions(filterId, selectedDept) {
	let options = [];
	if (filterId === "lecturerFilter") {
		for (const staff of ind.staff.slice(1)) {
			if (staff.trim().length > 0) {
				const [name, email] = staff.split(',');
				options.push(name);
			}
		}
		options.sort();
	} else if (filterId === "courseFilter") {
		for (const course of ind.coursesNoDupes) {
			if (course.dept === selectedDept.toUpperCase()) {
				options.push({shortCourseTitle: course.shortCourseTitle, courseCode: course.courseCode});
			}
		}
		options.sort();
	} else if (filterId === "zoneFilter") {
		const zones = document.querySelector("#zones");
		for (const zone of ind.zones) {
			if (zone.trim().length > 0) {
				const [id, rest] = zone.split(', "');
				options.push(id);
			}
		}
	} else if (filterId === "levelFilter") {
		options = ["Year 0", "Year 1", "Year 2", "Year 3", "Year 4"];
	}
	return options;
}
