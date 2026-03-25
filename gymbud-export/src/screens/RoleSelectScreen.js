import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';

export default function RoleSelectScreen({ navigation }) {
  const handleSelect = (role) => {
    navigation.navigate('ProfileSetup', { role });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How will you{'\n'}use GymBud?</Text>
      <Text style={styles.subtitle}>You can always switch later</Text>

      <View style={styles.cards}>
        {/* Client card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelect('client')}
          activeOpacity={0.7}
        >
          <Text style={styles.cardEmoji}>&#127939;</Text>
          <Text style={styles.cardTitle}>Join Workouts</Text>
          <Text style={styles.cardDesc}>
            Find dedicated gym-goers and follow their routine. Like working out with a knowledgeable friend.
          </Text>
          <View style={styles.cardBtn}>
            <Text style={styles.cardBtnText}>I want a gym partner</Text>
          </View>
        </TouchableOpacity>

        {/* Host card */}
        <TouchableOpacity
          style={[styles.card, styles.cardHost]}
          onPress={() => handleSelect('host')}
          activeOpacity={0.7}
        >
          <Text style={styles.cardEmoji}>&#128176;</Text>
          <Text style={styles.cardTitle}>Host Workouts</Text>
          <Text style={styles.cardDesc}>
            You already work out consistently. Let others join your sessions and earn money doing what you love.
          </Text>
          <View style={[styles.cardBtn, styles.cardBtnHost]}>
            <Text style={[styles.cardBtnText, styles.cardBtnTextHost]}>
              I want to earn
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
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
  cards: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHost: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardBtn: {
    backgroundColor: Colors.bgElevated,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cardBtnHost: {
    backgroundColor: Colors.accentMuted,
  },
  cardBtnText: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cardBtnTextHost: {
    color: Colors.accent,
  },
});
