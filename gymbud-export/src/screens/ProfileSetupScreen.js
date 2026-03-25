import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { WORKOUT_TYPES, GYMS } from '../constants/mockData';
import { saveUserProfile, setOnboarded } from '../services/storageService';

export default function ProfileSetupScreen({ route, navigation }) {
  const { role } = route.params;
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [bio, setBio] = useState('');

  const isHost = role === 'host';
  const canContinue = name.trim() && age.trim() && selectedGym;

  const handleSave = async () => {
    const profile = {
      name: name.trim(),
      age: parseInt(age, 10),
      role,
      gym: selectedGym,
      workoutType: selectedWorkout,
      bio: bio.trim(),
      initials: name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2),
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
    await setOnboarded();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your{'\n'}profile</Text>
        <Text style={styles.subtitle}>
          {isHost ? 'People will see this when browsing hosts' : 'Help us find the right gym partner for you'}
        </Text>

        {/* Name */}
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={Colors.textMuted}
        />

        {/* Age */}
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={[styles.input, { width: 100 }]}
          value={age}
          onChangeText={setAge}
          placeholder="25"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />

        {/* Gym */}
        <Text style={styles.label}>Your gym</Text>
        <View style={styles.chipGrid}>
          {GYMS.map((gym) => (
            <TouchableOpacity
              key={gym.id}
              style={[styles.chip, selectedGym?.id === gym.id && styles.chipSelected]}
              onPress={() => setSelectedGym(gym)}
            >
              <Text style={[styles.chipText, selectedGym?.id === gym.id && styles.chipTextSelected]}>
                {gym.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workout type (optional) */}
        <Text style={styles.label}>
          {isHost ? 'Your workout split' : 'Preferred workout style (optional)'}
        </Text>
        <View style={styles.chipGrid}>
          {WORKOUT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, selectedWorkout === type && styles.chipSelected]}
              onPress={() => setSelectedWorkout(selectedWorkout === type ? null : type)}
            >
              <Text style={[styles.chipText, selectedWorkout === type && styles.chipTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bio (host only) */}
        {isHost && (
          <>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about your workout style, vibe, what to expect..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canContinue && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>
            {isHost ? 'Start Hosting' : 'Find Gym Partners'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.lg,
    paddingTop: 80,
    paddingBottom: 60,
  },
  title: {
    fontSize: Font.hero,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: Font.md,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Font.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Font.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: Font.lg,
    fontWeight: '800',
    color: Colors.white,
  },
});
