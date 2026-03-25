import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { getBookings } from '../services/storageService';
import { MOCK_BOOKINGS } from '../constants/mockData';
import SessionCard from '../components/SessionCard';

export default function SessionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming');

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async () => {
    const saved = await getBookings();
    // Merge with demo data if no saved bookings
    const all = saved.length > 0 ? saved : MOCK_BOOKINGS;
    setBookings(all);
  };

  const upcoming = bookings.filter((b) => b.status === 'confirmed');
  const past = bookings.filter((b) => b.status === 'completed');
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>
            Past ({past.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SessionCard booking={item} onPress={() => {}} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'upcoming'
                ? 'Browse hosts and book your first workout'
                : 'Your completed sessions will appear here'}
            </Text>
            {tab === 'upcoming' && (
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('Browse')}
              >
                <Text style={styles.browseBtnText}>Find a Gym Partner</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Font.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
  },
  tabActive: {
    backgroundColor: Colors.accentMuted,
  },
  tabText: {
    fontSize: Font.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Font.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Font.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  browseBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  browseBtnText: {
    fontSize: Font.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
