import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { MOCK_HOSTS, WORKOUT_TYPES } from '../constants/mockData';
import HostCard from '../components/HostCard';

const FILTER_OPTIONS = ['All', ...WORKOUT_TYPES.slice(0, 6)];

export default function BrowseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    let hosts = MOCK_HOSTS;
    if (search.trim()) {
      const q = search.toLowerCase();
      hosts = hosts.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.workoutType.toLowerCase().includes(q) ||
          h.gym.name.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== 'All') {
      hosts = hosts.filter((h) => h.workoutType === activeFilter);
    }
    return hosts;
  }, [search, activeFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your{'\n'}Gym Partner</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, workout, gym..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterChip, activeFilter === opt && styles.filterChipActive]}
            onPress={() => setActiveFilter(opt)}
          >
            <Text style={[styles.filterText, activeFilter === opt && styles.filterTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Host list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HostCard
            host={item}
            onPress={() => navigation.navigate('HostProfile', { hostId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hosts match your search</Text>
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
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Font.md,
    color: Colors.text,
  },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Font.md,
    color: Colors.textMuted,
  },
});
