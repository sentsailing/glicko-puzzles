import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | undefined;
let _auth: Auth | undefined;

function getAdminApp(): App {
  if (!_app) {
    if (getApps().length === 0) {
      _app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID?.trim(),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim(),
        }),
      });
    } else {
      _app = getApps()[0];
    }
  }
  return _app;
}

export function getAdminAuth(): Auth {
  if (!_auth) {
    getAdminApp();
    _auth = getAuth();
  }
  return _auth;
}
