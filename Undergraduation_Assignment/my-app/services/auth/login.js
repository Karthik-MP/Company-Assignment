// /services/auth/login.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const errorMap = {
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
};

export async function loginWithEmail({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Optional: check email verification status
    if (!cred.user.emailVerified) {
      throw new Error("Please verify your email before logging in.");
    }

    return { user: cred.user };
  } catch (err) {
    const msg = errorMap[err.code] || err.message || "Login failed. Please try again.";
    throw new Error(msg);
  }
}
