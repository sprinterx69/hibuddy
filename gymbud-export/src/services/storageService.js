import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PROFILE: '@gymbud_user',
  BOOKINGS: '@gymbud_bookings',
  ONBOARDED: '@gymbud_onboarded',
};

// User profile
export const getUserProfile = async () => {
  const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
};

export const saveUserProfile = async (profile) => {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
};

// Onboarding
export const hasOnboarded = async () => {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
};

export const setOnboarded = async () => {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
};

// Bookings
export const getBookings = async () => {
  const data = await AsyncStorage.getItem(KEYS.BOOKINGS);
  return data ? JSON.parse(data) : [];
};

export const saveBooking = async (booking) => {
  const existing = await getBookings();
  existing.push(booking);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(existing));
  return existing;
};

export const updateBookingStatus = async (bookingId, status) => {
  const existing = await getBookings();
  const updated = existing.map((b) =>
    b.id === bookingId ? { ...b, status } : b
  );
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(updated));
  return updated;
};

// Reset (for development)
export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};
