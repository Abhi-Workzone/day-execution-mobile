import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import PlanScreen from '../screens/PlanScreen';
import ExecutionScreen from '../screens/ExecutionScreen';
import TodoScreen from '../screens/TodoScreen';
import RoutineScreen from '../screens/RoutineScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Execution"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Routines':
              iconName = focused ? 'repeat' : 'repeat-outline';
              break;
            case 'Todos':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Execution':
              iconName = focused ? 'flash' : 'flash-outline';
              // Special handling for the center Today button
              return (
                <View style={[
                  styles.executionIconContainer,
                  focused && styles.executionIconActive
                ]}>
                  <Ionicons name={iconName} size={30} color={focused ? '#FFFFFF' : '#3B82F6'} />
                </View>
              );
            case 'Plan':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 10,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? 88 : 70, // Standard iPhone height with home indicator
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          // Subtle shadow to make it feel premium
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 20,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Routines" 
        component={RoutineScreen}
        options={{ title: 'Routines' }}
      />
      <Tab.Screen 
        name="Todos" 
        component={TodoScreen}
        options={{ title: 'Todos' }}
      />
      <Tab.Screen 
        name="Execution" 
        component={ExecutionScreen}
        options={{ 
          title: 'Execution',
          tabBarLabel: '' // Hide label for the prominent center button
        }}
      />
      <Tab.Screen 
        name="Plan" 
        component={PlanScreen}
        options={{ title: 'Plan' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      {/* <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      /> */}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  executionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 30, // Lift the center button
    borderWidth: 4,
    borderColor: '#F9FAFB',
  },
  executionIconActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#DBEAFE',
  },
});

export default TabNavigator;
