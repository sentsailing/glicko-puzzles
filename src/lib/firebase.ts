import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    if (getApps().length === 0) {
      _app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
      });
    } else {
      _app = getApps()[0];
    }
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}
