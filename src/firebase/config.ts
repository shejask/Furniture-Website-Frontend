import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAsqOHcpNB5Q1Ek-OEUsOjBQfhA1YKbAns",
  authDomain: "meal4all-3ea4c.firebaseapp.com",
  databaseURL: "https://meal4all-3ea4c-default-rtdb.firebaseio.com",
  projectId: "meal4all-3ea4c",
  storageBucket: "meal4all-3ea4c.appspot.com",
  messagingSenderId: "909695172244",
  appId: "1:909695172244:web:5d9e1b6b06a54f5eb3fe81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

export default app;
