
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  username: string;
  role: 'patient' | 'doctor';
  name: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: 'patient' | 'doctor') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const MOCK_USERS = [
  { id: 'p1', username: 'patient', password: 'password', role: 'patient', name: 'John Doe', image: '/patient.jpg' },
  { id: 'p2', username: 'patient2', password: 'password', role: 'patient', name: 'Alice Smith', image: '/patient2.jpg' },
  { id: 'd1', username: 'doctor', password: 'password', role: 'doctor', name: 'Dr. Jane Wilson', image: '/doctor.jpg' },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('medilink_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data', error);
        localStorage.removeItem('medilink_user');
      }
    }
  }, []);

  const login = async (username: string, password: string, role: 'patient' | 'doctor'): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = MOCK_USERS.find(
      u => u.username === username && u.password === password && u.role === role
    );
    
    if (foundUser) {
      // Omit password from user object
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      localStorage.setItem('medilink_user', JSON.stringify(userWithoutPassword));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userWithoutPassword.name}!`,
      });
      return true;
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username, password, or role.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medilink_user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
