// /auth/signup.js
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase";

const errorMap = {
  "auth/email-already-in-use": "This email is already in use.",
  "auth/invalid-email": "Invalid email address.",
  "auth/weak-password": "Password is too weak.",
  "auth/operation-not-allowed":
    "Email/password accounts are not enabled for this project.",
};

export async function signupWithEmail({ fullName, email, password }) {
  try {
    // 1) Create the user account
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2) Update profile with displayName
    await updateProfile(cred.user, { displayName: fullName });

    // 3) Send email verification
    // await sendEmailVerification(cred.user);

    return { user: cred.user };
  } catch (err) {
    const msg = errorMap[err.code] || "Signup failed. Please try again.";
    throw new Error(msg);
  }
}
