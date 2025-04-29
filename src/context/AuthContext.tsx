import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

type RegisterData = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  dob: string; 
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          
          const decoded = jwtDecode<User & { exp: number }>(storedToken);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            throw new Error("Token expired");
          }

          setUser({
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
          });
          setToken(storedToken);
        } catch (error) {
          console.error("Auth error:", error);
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    setAuthError(null); // Clear previous errors
    try {
      const response = await fetch("https://gym-application-gsim.onrender.com/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.loginMessage || "Login failed");
      }

      
      
      const receivedToken = data.token; 
      const decoded: any = jwtDecode(receivedToken); 

      const loggedInUser: User = {
        id: decoded.id, 
        email,
        name: decoded.name, 
        role: decoded.role, 
      };

      localStorage.setItem("token", receivedToken);
      setUser(loggedInUser);
      setToken(receivedToken);

      toast.success(data.loginMessage || "Login successful!");

    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "An unexpected error occurred during login."); // Use state to show error in UI
      toast.error(error.message || "Login failed. Please try again.");
      throw error; // Re-throw to be caught by the component
    } finally {
      setIsLoading(false);
    }
  };

  // Registration function
  const register = async (data: RegisterData) => {
    setIsLoading(true);

    setAuthError(null); // Clear previous errors
    try {
      const response = await fetch("https://gym-application-gsim.onrender.com/api/v1/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.responseMessage || "Registration failed");
      }

      toast.success(responseData.responseMessage || "Registration successful!"); 
    
      // await login(data.email, data.password);

    } catch (error: any) {
      console.error("Registration error:", error);
      setAuthError(error.message || "An unexpected error occurred during registration."); // Use state to show error in UI
      toast.error(error.message || "Registration failed. Please try again.");
      throw error; // Re-throw to be caught by the component
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setAuthError(null);
    toast.success("Logged out successfully");
    // Navigation will be handled by the component that calls logout
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, isLoading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
