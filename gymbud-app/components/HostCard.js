import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';

export default function HostCard({ host, onPress }) {
  const nextSession = host.schedule.find((s) => s.time !== 'Rest');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{host.initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{host.name}</Text>
            {host.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.workoutType}>{host.workoutType}</Text>
          <Text style={styles.gym}>{host.gym.name}</Text>
        </View>

        {/* Price */}
        <View style={styles.priceBox}>
          <Text style={styles.price}>${host.pricePerSession}</Text>
          <Text style={styles.priceLabel}>/session</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        {host.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Bottom row: rating + next session */}
      <View style={styles.bottomRow}>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>&#9733;</Text>
          <Text style={styles.ratingText}>{host.rating}</Text>
          <Text style={styles.reviewCount}>({host.reviewCount})</Text>
        </View>
        {nextSession && (
          <Text style={styles.nextSession}>
            Next: {nextSession.day} @ {nextSession.time}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Font.lg,
    fontWeight: '700',
    color: Colors.accent,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: Font.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  verifiedBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  workoutType: {
    fontSize: Font.sm,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  gym: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  priceLabel: {
    fontSize: Font.xs,
    color: Colors.textMuted,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 14,
    color: Colors.star,
  },
  ratingText: {
    fontSize: Font.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: Font.xs,
    color: Colors.textMuted,
  },
  nextSession: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
  },
});
