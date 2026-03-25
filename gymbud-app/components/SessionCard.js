import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { MOCK_HOSTS } from '../constants/mockData';

export default function SessionCard({ booking, onPress }) {
  const host = MOCK_HOSTS.find((h) => h.id === booking.hostId);
  if (!host) return null;

  const isUpcoming = booking.status === 'confirmed';
  const isPast = booking.status === 'completed';

  return (
    <TouchableOpacity
      style={[styles.card, isPast && styles.cardPast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Date strip */}
      <View style={[styles.dateStrip, isPast && styles.dateStripPast]}>
        <Text style={styles.dateDay}>{booking.day.substring(0, 3).toUpperCase()}</Text>
        <Text style={styles.dateNum}>{booking.date.split('-')[2]}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.focus}>{booking.focus}</Text>
        <Text style={styles.host}>with {host.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{booking.time}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>{host.gym.name}</Text>
        </View>
      </View>

      {/* Status */}
      <View style={[styles.statusBadge, isPast ? styles.statusPast : styles.statusUpcoming]}>
        <Text style={[styles.statusText, isPast ? styles.statusTextPast : styles.statusTextUpcoming]}>
          {isPast ? 'Done' : 'Upcoming'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPast: {
    opacity: 0.6,
  },
  dateStrip: {
    width: 48,
    height: 56,
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateStripPast: {
    backgroundColor: Colors.bgElevated,
  },
  dateDay: {
    fontSize: Font.xs,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1,
  },
  dateNum: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  focus: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.text,
  },
  host: {
    fontSize: Font.sm,
    color: Colors.accent,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  meta: {
    fontSize: Font.xs,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: Font.xs,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusUpcoming: {
    backgroundColor: Colors.successMuted,
  },
  statusPast: {
    backgroundColor: Colors.bgElevated,
  },
  statusText: {
    fontSize: Font.xs,
    fontWeight: '700',
  },
  statusTextUpcoming: {
    color: Colors.success,
  },
  statusTextPast: {
    color: Colors.textMuted,
  },
});
