import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Colors, Font } from '../constants/theme';
import { hasOnboarded } from '../services/storageService';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import BrowseScreen from '../screens/BrowseScreen';
import HostProfileScreen from '../screens/HostProfileScreen';
import SessionsScreen from '../screens/SessionsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }) {
  const icons = {
    Browse: '&#128269;',
    Sessions: '&#128197;',
    Profile: '&#128100;',
  };

  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {label === 'Browse' ? '\uD83D\uDD0D' : label === 'Sessions' ? '\uD83D\uDCC5' : '\uD83D\uDC64'}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Browse" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Sessions" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const done = await hasOnboarded();
    setOnboarded(done);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>GymBud</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={onboarded ? 'MainTabs' : 'Welcome'}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="HostProfile" component={HostProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 88,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Font.hero,
    fontWeight: '800',
    color: Colors.accent,
  },
});
