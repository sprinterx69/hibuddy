import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>&#128170;</Text>
        </View>
        <Text style={styles.title}>GymBud</Text>
        <Text style={styles.subtitle}>
          Stop working out alone.{'\n'}Find your gym partner.
        </Text>
      </View>

      {/* Value props */}
      <View style={styles.props}>
        <View style={styles.propRow}>
          <View style={styles.propDot} />
          <Text style={styles.propText}>Real gym-goers, not random trainers</Text>
        </View>
        <View style={styles.propRow}>
          <View style={styles.propDot} />
          <Text style={styles.propText}>Follow their actual workout routine</Text>
        </View>
        <View style={styles.propRow}>
          <View style={styles.propDot} />
          <Text style={styles.propText}>Build rapport, get real results</Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('RoleSelect')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.footnote}>
          Join 500+ people finding their perfect gym partner
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: Font.hero,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: Font.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 26,
  },
  props: {
    gap: Spacing.md,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  propDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  propText: {
    fontSize: Font.md,
    color: Colors.textSecondary,
  },
  bottom: {
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    width: '100%',
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: Font.lg,
    fontWeight: '800',
    color: Colors.white,
  },
  footnote: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
});
