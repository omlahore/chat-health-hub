// src/components/Login.tsx (or wherever your file lives)

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAoaN90cwBj81lQLYmboCaETeG-KtsWGvY",
  authDomain: "medilink-77925.firebaseapp.com",
  projectId: "medilink-77925",
  storageBucket: "medilink-77925.appspot.com",
  messagingSenderId: "107456943684",
  appId: "1:107456943684:web:9f7f43dbea7c5eb28a4e11",
  measurementId: "G-0CXJ9HSV9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Login Function
const Login = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ User signed in:", user);
      // Store user info to localStorage or context if needed
    } catch (error) {
      console.error("❌ Login failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl mb-4">Login to MediLink</h2>
      <button
        onClick={handleLogin}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
