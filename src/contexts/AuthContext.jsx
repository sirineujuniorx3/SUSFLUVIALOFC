
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('ubs-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation to ensure user object is not corrupted
        if (parsedUser && parsedUser.name && parsedUser.role) {
            setUser(parsedUser);
        } else {
            console.warn("Invalid user data in localStorage, clearing.");
            localStorage.removeItem('ubs-user');
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('ubs-user');
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('ubs-user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ubs-user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
