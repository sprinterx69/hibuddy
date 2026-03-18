import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_NAME: '@hibuddy_user_name',
  USER_LANGUAGE: '@hibuddy_user_language',
  ONBOARDED: '@hibuddy_onboarded',
  CONVERSATIONS: '@hibuddy_conversations',
};

// --- User Profile ---

export const saveUserProfile = async (name, languageCode) => {
  await AsyncStorage.multiSet([
    [KEYS.USER_NAME, name],
    [KEYS.USER_LANGUAGE, languageCode],
    [KEYS.ONBOARDED, 'true'],
  ]);
};

export const getUserProfile = async () => {
  const values = await AsyncStorage.multiGet([KEYS.USER_NAME, KEYS.USER_LANGUAGE]);
  return {
    name: values[0][1],
    languageCode: values[1][1],
  };
};

export const hasOnboarded = async () => {
  const value = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return value === 'true';
};

// --- Conversations ---

export const getConversations = async () => {
  const json = await AsyncStorage.getItem(KEYS.CONVERSATIONS);
  return json ? JSON.parse(json) : [];
};

export const saveConversation = async (conversation) => {
  // conversation: { id, date, duration, userLang, otherLang, exchanges: [] }
  const existing = await getConversations();
  existing.unshift(conversation);
  await AsyncStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(existing));
};

export const deleteConversation = async (conversationId) => {
  const existing = await getConversations();
  const filtered = existing.filter((c) => c.id !== conversationId);
  await AsyncStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(filtered));
};
