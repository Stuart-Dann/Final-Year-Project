import { init } from "../app.js";
import { authenticateToken, login, getUserInfo } from "../api/index.js";
import { cleanUpUrl } from "../utils/index.js";


async function sendLogin(username, password) {
    const hashedPassword = await hashPassword(password);

    const response = await login(username, hashedPassword);
    if (response.ok) {
        alert("Login successful!");

        removeLoginForm();
        cleanUpUrl();
		await showMainPage();  

    } else {
        alert("Invalid credentials");
    }
}

export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function loginInit(){
    if (await authenticateToken()) {
        removeLoginForm();
        cleanUpUrl();
        await showMainPage();


    } else {
        const loginButton = document.querySelector("#loginButton");

        loginButton.addEventListener("click", (e) => {
            e.preventDefault();
            const loginForm = document.querySelector("#loginForm");
            const formData = new FormData(loginForm);
            const loginDetails = Object.fromEntries(formData.entries());
            sendLogin(loginDetails.username, loginDetails.password);
        });
}}

async function showMainPage() {
    const mainPage = document.querySelector("main");

    mainPage.classList.remove("hidden");
    const userData = await getUserInfo();
    attachRole(userData.role);

    await init();
}

function removeLoginForm() {
    const loginScreen = document.querySelector("#loginScreen");
    if (loginScreen) {
        loginScreen.remove(); // Completely remove the login form from the DOM
    }
}

function attachRole(role) {
    const user = document.querySelector("#user");
    user.textContent = role;
}