import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { MOCK_HOSTS, MOCK_REVIEWS } from '../constants/mockData';
import { saveBooking } from '../services/storageService';
import ReviewCard from '../components/ReviewCard';

export default function HostProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { hostId } = route.params;
  const host = MOCK_HOSTS.find((h) => h.id === hostId);
  const reviews = MOCK_REVIEWS[hostId] || [];
  const [selectedDay, setSelectedDay] = useState(null);

  if (!host) return null;

  const handleBook = async () => {
    if (!selectedDay) {
      Alert.alert('Select a day', 'Tap a workout day to book that session.');
      return;
    }

    const booking = {
      id: Date.now().toString(),
      hostId: host.id,
      date: getNextDate(selectedDay.day),
      day: selectedDay.day,
      time: selectedDay.time,
      focus: selectedDay.focus,
      status: 'confirmed',
      price: host.pricePerSession,
    };

    await saveBooking(booking);
    Alert.alert(
      'Session Booked!',
      `${selectedDay.focus} with ${host.name}\n${selectedDay.day} @ ${selectedDay.time}`,
      [{ text: 'View My Sessions', onPress: () => navigation.navigate('Sessions') },
       { text: 'OK' }]
    );
    setSelectedDay(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>&#8592; Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{host.initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{host.name}</Text>
              {host.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>
              {host.age} · {host.experience} experience · {host.sessionsHosted} sessions
            </Text>
          </View>
        </View>

        {/* Workout type + gym */}
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>{host.workoutType}</Text>
          </View>
          <Text style={styles.gymName}>{host.gym.name}, {host.gym.city}</Text>
        </View>

        {/* Bio */}
        <Text style={styles.bio}>{host.bio}</Text>

        {/* Tags */}
        <View style={styles.tags}>
          {host.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingRow}>
          <View style={styles.priceCard}>
            <Text style={styles.priceAmount}>${host.pricePerSession}</Text>
            <Text style={styles.priceLabel}>per session</Text>
          </View>
          <View style={[styles.priceCard, styles.priceCardWeekly]}>
            <Text style={[styles.priceAmount, styles.priceAmountWeekly]}>${host.weeklyPrice}</Text>
            <Text style={[styles.priceLabel, styles.priceLabelWeekly]}>per week</Text>
            <Text style={styles.savings}>
              Save ${(host.pricePerSession * 5 - host.weeklyPrice)}
            </Text>
          </View>
        </View>

        {/* Schedule */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        <Text style={styles.sectionSubtitle}>Tap a day to book</Text>
        <View style={styles.schedule}>
          {host.schedule.map((s, i) => {
            const isRest = s.time === 'Rest';
            const isSelected = selectedDay === s;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.scheduleItem,
                  isRest && styles.scheduleRest,
                  isSelected && styles.scheduleSelected,
                ]}
                onPress={() => !isRest && setSelectedDay(s)}
                disabled={isRest}
                activeOpacity={0.7}
              >
                <Text style={[styles.scheduleDay, isRest && styles.scheduleDayRest]}>
                  {s.day.substring(0, 3)}
                </Text>
                {isRest ? (
                  <Text style={styles.scheduleRestText}>Rest</Text>
                ) : (
                  <>
                    <Text style={[styles.scheduleTime, isSelected && styles.scheduleTimeSelected]}>
                      {s.time}
                    </Text>
                    <Text style={[styles.scheduleFocus, isSelected && styles.scheduleFocusSelected]}>
                      {s.focus}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reviews */}
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>&#9733; {host.rating}</Text>
            <Text style={styles.reviewCount}>({host.reviewCount})</Text>
          </View>
        </View>
        {reviews.length > 0 ? (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        ) : (
          <Text style={styles.noReviews}>No reviews yet</Text>
        )}
      </ScrollView>

      {/* Bottom booking bar */}
      <View style={[styles.bookingBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.bookingPrice}>
          <Text style={styles.bookingPriceText}>${host.pricePerSession}</Text>
          <Text style={styles.bookingPriceLabel}>/session</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, !selectedDay && styles.bookBtnDisabled]}
          onPress={handleBook}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>
            {selectedDay ? `Book ${selectedDay.day}` : 'Select a Day'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper to get next occurrence of a weekday
function getNextDate(dayName) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const todayIndex = today.getDay();
  const targetIndex = days.indexOf(dayName);
  let diff = targetIndex - todayIndex;
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  backBtn: {
    marginBottom: Spacing.md,
  },
  backText: {
    fontSize: Font.md,
    color: Colors.accent,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Font.xxl,
    fontWeight: '700',
    color: Colors.accent,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: Font.xl,
    fontWeight: '800',
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
  meta: {
    fontSize: Font.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoPill: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  infoPillText: {
    fontSize: Font.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  gymName: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
  },
  bio: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: Font.xs,
    color: Colors.textSecondary,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  priceCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceCardWeekly: {
    borderColor: Colors.accent,
  },
  priceAmount: {
    fontSize: Font.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  priceAmountWeekly: {
    color: Colors.accent,
  },
  priceLabel: {
    fontSize: Font.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  priceLabelWeekly: {
    color: Colors.textMuted,
  },
  savings: {
    fontSize: Font.xs,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Font.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  schedule: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  scheduleItem: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleRest: {
    opacity: 0.4,
  },
  scheduleSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  scheduleDay: {
    fontSize: Font.sm,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scheduleDayRest: {
    color: Colors.textMuted,
  },
  scheduleRestText: {
    fontSize: Font.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  scheduleTime: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.text,
  },
  scheduleTimeSelected: {
    color: Colors.accent,
  },
  scheduleFocus: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scheduleFocusSelected: {
    color: Colors.text,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.star,
  },
  reviewCount: {
    fontSize: Font.sm,
    color: Colors.textMuted,
  },
  noReviews: {
    fontSize: Font.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  // Booking bar
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bookingPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: Spacing.md,
  },
  bookingPriceText: {
    fontSize: Font.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  bookingPriceLabel: {
    fontSize: Font.sm,
    color: Colors.textMuted,
  },
  bookBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  bookBtnDisabled: {
    opacity: 0.4,
  },
  bookBtnText: {
    fontSize: Font.md,
    fontWeight: '800',
    color: Colors.white,
  },
});
