import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({ isUser, originalText, translatedText }) {
  return (
    <View style={[styles.container, isUser ? styles.userBubble : styles.otherBubble]}>
      <Text style={isUser ? styles.userOriginalText : styles.otherOriginalText}>
        {originalText}
      </Text>
      {translatedText ? (
        <Text style={isUser ? styles.userTranslatedText : styles.otherTranslatedText}>
          {translatedText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#22c55e',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 6,
  },
  userOriginalText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 24,
  },
  userTranslatedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  otherOriginalText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 24,
  },
  otherTranslatedText: {
    fontSize: 14,
    color: '#22c55e',
    marginTop: 6,
    lineHeight: 20,
  },
});
