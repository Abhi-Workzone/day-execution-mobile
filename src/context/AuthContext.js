import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getMe();
          setUser(response.data);
        } catch (error) {
          await AsyncStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const { token, ...userData } = response.data;
    await AsyncStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    const { token, ...newUserData } = response.data;
    await AsyncStorage.setItem('token', token);
    setUser(newUserData);
    return newUserData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
