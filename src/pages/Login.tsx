
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password, role);
      if (success) {
        navigate(role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample credentials helper
  const setDemoCredentials = (selectedRole: 'patient' | 'doctor') => {
    if (selectedRole === 'patient') {
      setUsername('patient');
      setPassword('password');
    } else {
      setUsername('doctor');
      setPassword('password');
    }
    setRole(selectedRole);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-medilink-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-medilink-dark mb-2">MediLink</h1>
          <p className="text-slate-500">Connect with healthcare professionals securely</p>
        </div>
        
        <Card className="w-full backdrop-blur-sm bg-white/90 border border-slate-100 shadow-subtle">
          <CardHeader>
            <CardTitle className="text-2xl font-medium text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup value={role} onValueChange={(value: 'patient' | 'doctor') => setRole(value)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="patient" id="patient" />
                    <Label htmlFor="patient" className="cursor-pointer">Patient</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="doctor" id="doctor" />
                    <Label htmlFor="doctor" className="cursor-pointer">Doctor</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full h-11 bg-medilink-primary hover:bg-medilink-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              <div className="text-sm text-center text-slate-500">
                <span>Demo credentials: </span>
                <button 
                  type="button" 
                  onClick={() => setDemoCredentials('patient')}
                  className="text-medilink-primary hover:underline mx-1"
                >
                  Patient
                </button>
                <span>or</span>
                <button 
                  type="button" 
                  onClick={() => setDemoCredentials('doctor')}
                  className="text-medilink-primary hover:underline mx-1"
                >
                  Doctor
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
