import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export default function ChatBubble({ isUser, originalText, translatedText, languageLabel }) {
  return (
    <View style={[styles.container, isUser ? styles.userBubble : styles.otherBubble]}>
      <Text style={styles.languageLabel}>{languageLabel}</Text>
      <Text style={styles.originalText}>{originalText}</Text>
      {translatedText ? (
        <Text style={styles.translatedText}>{translatedText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginVertical: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ecfdf5',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 4,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  originalText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  translatedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
