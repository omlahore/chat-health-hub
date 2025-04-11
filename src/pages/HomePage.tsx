import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyAoaN90cwBj81lQLYmboCaETeG-KtsWGvY',
  authDomain: 'medilink-77925.firebaseapp.com',
  projectId: 'medilink-77925',
  storageBucket: 'medilink-77925.appspot.com',
  messagingSenderId: '107456943684',
  appId: '1:107456943684:web:9f7f43dbea7c5eb28a4e11',
  measurementId: 'G-0CXJ9HSV9R',
};

initializeApp(firebaseConfig);
getAnalytics();

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('✅ Signed in with Google:', user);
      navigate('/patient-dashboard');
    } catch (error) {
      console.error('❌ Google login failed:', error);
      alert('Login failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1588776814546-ec7e3f0b7f3f"
          alt="Healthcare background"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative z-10 flex flex-col items-center justify-center py-32 px-6 text-center">
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            Welcome to MediLink
          </h1>
          <p className="text-xl max-w-2xl mb-6">
            Seamlessly connect with doctors, book appointments, and access care from anywhere.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            Login
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-center">Login Options</h2>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Login as Doctor
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Login as Patient
              </button>
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign in with Google (Patients Only)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
