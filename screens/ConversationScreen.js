import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/colors';
import { LANGUAGES, getLanguageByCode, getLanguageLabel } from '../constants/languages';
import { getUserProfile, saveConversation } from '../services/storageService';
import { transcribeAudio, translateText } from '../services/translationService';
import Waveform from '../components/Waveform';
import ChatBubble from '../components/ChatBubble';

export default function ConversationScreen({ navigation }) {
  const [userLang, setUserLang] = useState('en');
  const [otherLang, setOtherLang] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Starting...');
  const [showLangOverride, setShowLangOverride] = useState(false);

  const recording = useRef(null);
  const scrollRef = useRef(null);
  const conversationStart = useRef(Date.now());
  const isStopped = useRef(false);

  useEffect(() => {
    const init = async () => {
      const profile = await getUserProfile();
      setUserLang(profile.languageCode || 'en');
      await requestMicPermission();
    };
    init();

    return () => {
      isStopped.current = true;
      stopRecording();
    };
  }, []);

  const requestMicPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Microphone Permission',
        'HiBuddy needs microphone access to translate conversations. Please enable it in settings.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    startListening();
  };

  const startListening = async () => {
    if (isStopped.current) return;

    try {
      setIsListening(true);
      setStatusText('Listening...');

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = rec;

      // Auto-stop after a silence period (simplified: stop after 5 seconds, then process)
      setTimeout(async () => {
        if (recording.current && !isStopped.current) {
          await processRecording();
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatusText('Tap to retry');
      setIsListening(false);
    }
  };

  const processRecording = async () => {
    if (!recording.current) return;

    setIsListening(false);
    setIsProcessing(true);
    setStatusText('Processing...');

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Build possible language codes for detection
      const userLangData = getLanguageByCode(userLang);
      const possibleCodes = [userLangData.speechCode];
      if (otherLang) {
        possibleCodes.push(getLanguageByCode(otherLang).speechCode);
      } else {
        // Add common languages for initial detection
        LANGUAGES.forEach((l) => {
          if (l.code !== userLang && possibleCodes.length < 4) {
            possibleCodes.push(l.speechCode);
          }
        });
      }

      // Transcribe and detect language
      const { transcript, detectedLanguage } = await transcribeAudio(base64Audio, possibleCodes);

      if (!transcript) {
        setStatusText('No speech detected');
        setTimeout(() => startListening(), 1000);
        setIsProcessing(false);
        return;
      }

      const isUserSpeaking = detectedLanguage === userLang;

      if (!isUserSpeaking && !otherLang) {
        setOtherLang(detectedLanguage);
      }

      const targetLang = isUserSpeaking ? (otherLang || detectedLanguage) : userLang;
      const translated = await translateText(transcript, targetLang, detectedLanguage);

      const exchange = {
        id: Date.now().toString(),
        isUser: isUserSpeaking,
        originalText: transcript,
        translatedText: translated,
        originalLang: detectedLanguage,
        targetLang: targetLang,
        timestamp: new Date().toISOString(),
      };

      setExchanges((prev) => [...prev, exchange]);

      // Speak the translation out loud
      const targetLangData = getLanguageByCode(targetLang);
      Speech.speak(translated, {
        language: targetLangData.speechCode,
        onDone: () => {
          if (!isStopped.current) startListening();
        },
        onError: () => {
          if (!isStopped.current) startListening();
        },
      });

      setIsProcessing(false);
      setStatusText('Speaking translation...');
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
      setStatusText('Error — retrying...');
      Alert.alert('Translation Error', error.message || 'Something went wrong. Retrying...');
      setTimeout(() => startListening(), 2000);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      Speech.stop();
    } catch (e) {
      // Ignore cleanup errors
    }
  };

  const handleStop = async () => {
    isStopped.current = true;
    setIsListening(false);
    setIsProcessing(false);
    await stopRecording();

    if (exchanges.length > 0) {
      const duration = Math.round((Date.now() - conversationStart.current) / 1000);
      const conversation = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration,
        userLang,
        otherLang: otherLang || 'unknown',
        exchanges,
      };
      await saveConversation(conversation);
    }

    navigation.goBack();
  };

  const handleLangOverride = (langCode) => {
    setOtherLang(langCode);
    setShowLangOverride(false);
  };

  return (
    <View style={styles.container}>
      {/* Language override button */}
      <TouchableOpacity
        style={styles.overrideButton}
        onPress={() => setShowLangOverride(true)}
      >
        <Text style={styles.overrideText}>
          {otherLang ? getLanguageLabel(otherLang) : 'Auto-detect'}
        </Text>
      </TouchableOpacity>

      {/* Other person's half */}
      <View style={styles.halfTop}>
        <Text style={styles.halfLabel}>
          {otherLang ? getLanguageLabel(otherLang) : 'Detecting...'}
        </Text>
        <ScrollView
          style={styles.chatScroll}
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {exchanges
            .filter((e) => !e.isUser)
            .map((e) => (
              <ChatBubble
                key={e.id}
                isUser={false}
                originalText={e.originalText}
                translatedText={e.translatedText}
                languageLabel={getLanguageLabel(e.originalLang)}
              />
            ))}
        </ScrollView>
      </View>

      {/* Waveform divider */}
      <View style={styles.divider}>
        <Waveform active={isListening} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* User's half */}
      <View style={styles.halfBottom}>
        <Text style={styles.halfLabel}>{getLanguageLabel(userLang)}</Text>
        <ScrollView style={styles.chatScroll}>
          {exchanges
            .filter((e) => e.isUser)
            .map((e) => (
              <ChatBubble
                key={e.id}
                isUser={true}
                originalText={e.originalText}
                translatedText={e.translatedText}
                languageLabel={getLanguageLabel(e.originalLang)}
              />
            ))}
        </ScrollView>
      </View>

      {/* Stop button */}
      <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
        <Text style={styles.stopButtonText}>Stop</Text>
      </TouchableOpacity>

      {/* Language override modal */}
      <Modal visible={showLangOverride} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select other person's language</Text>
            <FlatList
              data={LANGUAGES.filter((l) => l.code !== userLang)}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleLangOverride(item.code)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowLangOverride(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  overrideButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overrideText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  halfTop: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  halfBottom: {
    flex: 1,
    paddingHorizontal: 16,
  },
  halfLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  chatScroll: {
    flex: 1,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  stopButton: {
    backgroundColor: Colors.danger,
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemText: {
    fontSize: 18,
    color: Colors.text,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 18,
    color: Colors.danger,
    fontWeight: '600',
  },
});
