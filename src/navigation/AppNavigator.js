import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  console.log("[PERF] APPNAVIGATOR RENDER", { loading, hasUser: !!user, time: Date.now() - global.startupTime });

  if (loading) {
    return <SplashScreen />;
  }

  console.log("[PERF] APPNAVIGATOR HIDING SPLASH", Date.now() - global.startupTime);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Main App
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          // Auth Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
