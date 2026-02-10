const admin = require("firebase-admin");
const path = require("path");

let db = null;

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      db = admin.database();
      return db;
    }

    // Try to load service account key
    let serviceAccount;
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log("✅ Firebase credentials loaded from environment variable");
      }
     
      // else {
      //   serviceAccount = require("../serviceAccountKey.json");
      //   console.warn(
      //     "⚠️ Firebase credentials loaded from file (không an toàn cho production)",
      //   );
      // }
    } catch (error) {
      console.error(
        "Service account key not found. Please add serviceAccountKey.json to config folder.",
      );
      console.error(
        "Download it from Firebase Console > Project Settings > Service Accounts",
      );
      throw new Error("Firebase configuration missing");
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    db = admin.database();
    console.log("Firebase initialized successfully");
    return db;
  } catch (error) {
    console.error("Error initializing Firebase:", error.message);
    throw error;
  }
};

const getDatabase = () => {
  if (!db) {
    return initializeFirebase();
  }
  return db;
};

module.exports = {
  initializeFirebase,
  getDatabase,
  admin,
};
