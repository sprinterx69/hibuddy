import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { getUserProfile, clearAll } from '../services/storageService';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    const p = await getUserProfile();
    setProfile(p);
  };

  const handleLogout = () => {
    Alert.alert('Reset App', 'This will clear all data and take you back to setup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  if (!profile) return null;

  const isHost = profile.role === 'host';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{isHost ? 'Host' : 'Client'}</Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{profile.age}</Text>
            <Text style={styles.infoLabel}>Age</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{profile.gym?.name?.split(' - ')[0] || 'N/A'}</Text>
            <Text style={styles.infoLabel}>Gym</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{profile.workoutType || 'Any'}</Text>
            <Text style={styles.infoLabel}>Style</Text>
          </View>
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Edit Profile</Text>
            <Text style={styles.settingArrow}>&#8250;</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>&#8250;</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Payment Methods</Text>
            <Text style={styles.settingArrow}>&#8250;</Text>
          </TouchableOpacity>
          {isHost && (
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingText}>Payout Settings</Text>
              <Text style={styles.settingArrow}>&#8250;</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingArrow}>&#8250;</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>GymBud</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleLogout}>
          <Text style={styles.resetText}>Reset App</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  profileCard: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Font.xxl,
    fontWeight: '700',
    color: Colors.accent,
  },
  name: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  rolePill: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleText: {
    fontSize: Font.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoValue: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: Font.lg,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  settingsGroup: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingText: {
    fontSize: Font.md,
    color: Colors.text,
  },
  settingArrow: {
    fontSize: Font.xl,
    color: Colors.textMuted,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  appVersion: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerMuted,
  },
  resetText: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.danger,
  },
});
