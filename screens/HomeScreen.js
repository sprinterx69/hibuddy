import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { getUserProfile } from '../services/storageService';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      setUserName(profile.name || 'Friend');
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>HiBuddy</Text>

      <Text style={styles.greeting}>Ready, {userName}</Text>

      <View style={styles.buttonContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Conversation')}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonIcon}>🎙</Text>
            <Text style={styles.startButtonText}>Start{'\n'}Conversation</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('History')}
        activeOpacity={0.7}
      >
        <Text style={styles.historyIcon}>📋</Text>
        <Text style={styles.historyText}>History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingTop: 80,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
  },
  greeting: {
    fontSize: 22,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 50,
    gap: 8,
  },
  historyIcon: {
    fontSize: 22,
  },
  historyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
