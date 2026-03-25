import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';

export default function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.author}>{review.author}</Text>
        <View style={styles.stars}>
          {stars.map((filled, i) => (
            <Text key={i} style={[styles.star, !filled && styles.starEmpty]}>
              &#9733;
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.text}>{review.text}</Text>
      <Text style={styles.date}>{review.date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  author: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.text,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 14,
    color: Colors.star,
  },
  starEmpty: {
    color: Colors.starEmpty,
  },
  text: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  date: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
