import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

// Define User type including token
type User = {
  id: string;
  email: string;
  name: string; 
  role: "user" | "admin";
  token?: string; 
};

type RegisterData = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  dob: string;
  gender: "male" | "female" | "other";
};

type SessionData = {
  startTime: string;
};

type EditSessionData = {
  sessionId: string;
  newTime: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  bookSession: (data: SessionData) => Promise<void>;
  editSession: (data: EditSessionData) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  viewSessions: () => Promise<void>;
  getAvailableSessions: (date: string) => Promise<void>;
  reportUsage: (startTime: string) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  bookings: any[]; 
};

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]); 

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const decoded = jwtDecode<User & { exp: number }>(storedToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) throw new Error("Token expired");

          setUser({ ...decoded, token: storedToken }); 
        } catch (error) {
          console.error("Auth error:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("https://gymapp-ho99.onrender.com/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      const receivedToken = data.token;
      const decoded: User = { 
        id: data.id, 
        email: data.email, 
        name: data.fullName, 
        role: data.role,
        token: receivedToken
      };

      setUser(decoded); 
      localStorage.setItem("token", receivedToken); 
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "An unexpected error occurred during login.");
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("https://gymapp-ho99.onrender.com/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok || responseData.responseCode !== "00") {
        throw new Error(responseData.responseMessage || "Registration failed");
      }

      toast.success(responseData.responseMessage || "Registration successful!");
    } catch (error: any) {
      console.error("Registration error:", error);
      setAuthError(error.message || "An unexpected error occurred during registration.");
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const apiFetch = async (url: string, options: RequestInit) => {
    const token = user?.token;
    if (token) {
      options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
      };
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  };

  const bookSession = async (data: SessionData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await apiFetch("https://gymapp-ho99.onrender.com/api/v1/bookSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      toast.success(responseData.responseMessage || "Session booked successfully!");
    } catch (error: any) {
      console.error("Booking error:", error);
      setAuthError(error.message || "An unexpected error occurred while booking.");
      toast.error(error.message || "Booking failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const editSession = async (data: EditSessionData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await apiFetch("https://gymapp-ho99.onrender.com/api/v1/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      toast.success(responseData.responseMessage || "Session updated successfully!");
    } catch (error: any) {
      console.error("Editing session error:", error);
      setAuthError(error.message || "An unexpected error occurred while editing the session.");
      toast.error(error.message || "Editing session failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await apiFetch("https://gymapp-ho99.onrender.com/api/v1/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      toast.success(responseData.responseMessage || "Session deleted successfully!");
    } catch (error: any) {
      console.error("Deleting session error:", error);
      setAuthError(error.message || "An unexpected error occurred while deleting the session.");
      toast.error(error.message || "Deleting session failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const viewSessions = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await apiFetch("https://gymapp-ho99.onrender.com/api/v1/view", {
        method: "GET",
      });
      
      setBookings(responseData.bookedSessions || []); // Assuming the response contains booked sessions
    } catch (error: any) {
      console.error("Fetching sessions error:", error);
      setAuthError(error.message || "An unexpected error occurred while fetching sessions.");
      toast.error(error.message || "Failed to fetch sessions.");
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSessions = async (date: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await apiFetch("https://gymapp-ho99.onrender.com/api/v1/available", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });

      setBookings(responseData.availabilityList || []); // Assuming the response contains availability list
      toast.success(responseData.responseMessage || "Available sessions fetched successfully!");
    } catch (error: any) {
      console.error("Fetching available sessions error:", error);
      setAuthError(error.message || "An unexpected error occurred while fetching available sessions.");
      toast.error(error.message || "Fetching available sessions failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reportUsage = async (startTime: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await apiFetch("https://gymapp-ho99.onrender.com/api/v1/report", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime }),
      });

      toast.success(responseData.responseMessage || "Usage reported successfully!");
    } catch (error: any) {
      console.error("Reporting usage error:", error);
      setAuthError(error.message || "An unexpected error occurred while reporting usage.");
      toast.error(error.message || "Reporting usage failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAuthError(null);
    setBookings([]); // Clear bookings on logout
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, bookSession, editSession, deleteSession, viewSessions, getAvailableSessions, reportUsage, isLoading, authError, bookings }}>
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