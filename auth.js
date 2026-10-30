/*
  AUTHENTICATION DEMO
  -------------------
  This file handles the sign-in and create-account screens for the prototype.
  It stores a demo account in this browser only. It is not production security:
  use a real authentication service and server-side password hashing for a live site.
*/

const ACCOUNT_STORAGE_KEY = "yourbrand-demo-account";
const DASHBOARD_STORAGE_KEY = "yourbrand-dashboard-v1";
const SESSION_STORAGE_KEY = "yourbrand-demo-session";

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const messageBox = document.querySelector("#authMessage");

function showMessage(message) {
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.classList.add("is-visible");
}

function clearMessage() {
  if (!messageBox) return;
  messageBox.textContent = "";
  messageBox.classList.remove("is-visible");
}

function readAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveSession(account) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    email: account.email,
    signedInAt: new Date().toISOString()
  }));
}

/*
  This demo hashes the password before saving it locally.
  A production site must use server-side password hashing (Argon2/bcrypt),
  real sessions, and a database instead of browser storage.
*/
async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error("Secure browser features are unavailable. Open the project through localhost to continue.");
  }

  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", passwordBytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createSalt() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function updateDashboardProfile(name, email) {
  try {
    const dashboard = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY)) || {};
    dashboard.profile = {
      ...(dashboard.profile || {}),
      name,
      email
    };
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashboard));
  } catch {
    // The dashboard can still open with its starter profile.
  }
}

/* Create-account form */
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const formData = new FormData(registerForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (name.length < 2) return showMessage("Please enter your full name.");
    if (username.length < 3) return showMessage("Your username needs at least 3 characters.");
    if (password.length < 8) return showMessage("Choose a password with at least 8 characters.");
    if (password !== confirmPassword) return showMessage("Those passwords don't match yet. Please check them.");

    const existingAccount = readAccount();
    if (existingAccount?.email === email) {
      return showMessage("An account with that email already exists. Try signing in instead.");
    }

    try {
      const salt = createSalt();
      const passwordHash = await hashPassword(password, salt);
      const account = {
        name,
        email,
        username,
        salt,
        passwordHash,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
      updateDashboardProfile(name, email);
      saveSession(account);
      showMessage("Your account is ready. Taking you to your workspace...");

      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 650);
    } catch (error) {
      showMessage(error.message || "We couldn't create your account. Please try again.");
    }
  });
}

/* Sign-in form */
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const account = readAccount();

    if (!email || !password) return showMessage("Enter your email address and password to sign in.");

    if (!account || account.email !== email) {
      return showMessage("We couldn't find an account with those details. Check them or create an account.");
    }

    try {
      const enteredHash = await hashPassword(password, account.salt);

      if (enteredHash !== account.passwordHash) {
        return showMessage("That password doesn't look right. Please try again.");
      }

      saveSession(account);
      updateDashboardProfile(account.name, account.email);
      showMessage("You're signed in. Opening your workspace...");

      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (error) {
      showMessage(error.message || "We couldn't sign you in. Please try again.");
    }
  });
}
