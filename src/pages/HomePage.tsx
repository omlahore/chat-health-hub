
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, UserRound, Calendar, Video, MessageSquare, Lock, Users, Google } from "lucide-react";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePatientLogin = () => {
    toast({
      title: "Demo Patient Login",
      description: "Logging you in as a patient...",
    });
    
    // Demo login with preset credentials
    setTimeout(() => {
      navigate('/patient-dashboard');
    }, 1000);
  };

  const handleDoctorLogin = () => {
    toast({
      title: "Demo Doctor Login",
      description: "Logging you in as a doctor...",
    });
    
    // Demo login with preset credentials
    setTimeout(() => {
      navigate('/doctor-dashboard');
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('✅ Signed in with Google:', user);
      toast({
        title: "Google Login Successful",
        description: "Welcome to MediLink!",
      });
      navigate('/patient-dashboard');
    } catch (error) {
      console.error('❌ Google login failed:', error);
      toast({
        title: "Login Failed",
        description: "Unable to login with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-900">MediLink</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col lg:flex-row items-center">
        {/* Left side content */}
        <div className="lg:w-1/2 lg:pr-12">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6 leading-tight">
            Virtual Healthcare <br/>
            <span className="text-blue-600">For Everyone</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with licensed doctors, schedule appointments, and receive quality care from the comfort of your home.
          </p>
          
          {/* Login Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Patient Demo Login */}
            <Card className="hover-lift overflow-hidden border-blue-100">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <UserRound className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Patient Demo</h3>
                <p className="text-sm text-gray-500 mb-4">Experience MediLink as a patient</p>
                <Button 
                  onClick={handlePatientLogin} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Try Patient Mode
                </Button>
              </CardContent>
            </Card>

            {/* Doctor Demo Login */}
            <Card className="hover-lift overflow-hidden border-blue-100">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Doctor Demo</h3>
                <p className="text-sm text-gray-500 mb-4">Experience MediLink as a doctor</p>
                <Button 
                  onClick={handleDoctorLogin} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Try Doctor Mode
                </Button>
              </CardContent>
            </Card>

            {/* Google Login */}
            <Card className="hover-lift overflow-hidden border-blue-100 md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Google className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Google Sign In</h3>
                <p className="text-sm text-gray-500 mb-4">Use your Google account to access MediLink</p>
                <Button 
                  onClick={handleGoogleLogin} 
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right side image */}
        <div className="lg:w-1/2 mt-12 lg:mt-0">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full z-0"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-200 rounded-full z-0"></div>
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Telemedicine consultation" 
              className="relative rounded-2xl shadow-xl z-10"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Why Choose MediLink?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Video Consultations</h3>
              <p className="text-gray-600">Meet with healthcare providers face-to-face through secure video appointments.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Easy Scheduling</h3>
              <p className="text-gray-600">Book appointments that work for your schedule with our simple booking system.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your health information is protected with top-tier security and encryption.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="h-6 w-6 text-blue-300" />
                <h3 className="text-xl font-bold">MediLink</h3>
              </div>
              <p className="text-blue-200 max-w-xs">
                Connecting patients and healthcare providers through secure telemedicine solutions.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-blue-200">
                  <li>For Patients</li>
                  <li>For Doctors</li>
                  <li>For Hospitals</li>
                  <li>Pricing</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-blue-200">
                  <li>About Us</li>
                  <li>Careers</li>
                  <li>Blog</li>
                  <li>Contact</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-blue-200">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                  <li>HIPAA Compliance</li>
                  <li>Accessibility</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-300 text-sm">© 2025 MediLink. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
