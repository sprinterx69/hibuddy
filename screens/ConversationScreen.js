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
  Linking,
} from 'react-native';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
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
  const [statusText, setStatusText] = useState('Requesting mic access...');
  const [showLangOverride, setShowLangOverride] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recordingUriRef = useRef(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.url) {
      recordingUriRef.current = status.url;
    }
  });
  const scrollRef = useRef(null);
  const conversationStart = useRef(Date.now());
  const isStopped = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const profile = await getUserProfile();
      setUserLang(profile.languageCode || 'en');
      await setupAudio();
    };
    init();

    return () => {
      isStopped.current = true;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      recorder.stop();
    } catch (e) {
      // ignore
    }
    Speech.stop();
  };

  const setupAudio = async () => {
    try {
      // Check current permission status first
      const currentStatus = await AudioModule.getRecordingPermissionsAsync();
      console.log('Current mic permission status:', JSON.stringify(currentStatus));

      let granted = currentStatus.granted;

      if (!granted) {
        // Request permission — this should show the OS dialog
        const requestResult = await AudioModule.requestRecordingPermissionsAsync();
        console.log('Requested mic permission result:', JSON.stringify(requestResult));
        granted = requestResult.granted;
      }

      if (!granted) {
        console.log('Mic permission denied');
        setPermissionDenied(true);
        setStatusText('Microphone access denied');
        return;
      }

      console.log('Mic permission granted, setting audio mode...');

      // Enable recording mode on iOS
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      console.log('Audio mode set, starting to listen...');
      setStatusText('Listening...');
      startListening();
    } catch (error) {
      console.error('Audio setup error:', error);
      setStatusText('Mic setup failed');
      Alert.alert(
        'Microphone Error',
        'Could not set up the microphone: ' + (error.message || 'Unknown error'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startListening = async () => {
    if (isStopped.current) return;

    try {
      setIsListening(true);
      setStatusText('Listening...');

      console.log('Preparing recorder...');
      await recorder.prepareToRecordAsync();
      console.log('Starting recorder...');
      recorder.record();
      console.log('Recorder started');

      // Auto-stop after 5 seconds, then process
      timerRef.current = setTimeout(() => {
        if (!isStopped.current) {
          processRecording();
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatusText('Recording failed — tap Stop and retry');
      setIsListening(false);
    }
  };

  const processRecording = async () => {
    setIsListening(false);
    setIsProcessing(true);
    setStatusText('Processing...');

    try {
      console.log('Stopping recorder...');
      await recorder.stop();
      // Try recorder.uri first, fall back to status callback URL
      const uri = recorder.uri || recordingUriRef.current;
      console.log('Recording URI:', uri);

      if (!uri) {
        setStatusText('No audio captured');
        setTimeout(() => startListening(), 1000);
        setIsProcessing(false);
        return;
      }

      // Read audio file as base64 — retry briefly if file isn't ready yet
      let base64Audio;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          break;
        } catch (readErr) {
          console.log(`File read attempt ${attempt + 1} failed:`, readErr.message);
          if (attempt < 2) await new Promise(r => setTimeout(r, 300));
          else throw readErr;
        }
      }
      console.log('Audio base64 length:', base64Audio?.length || 0);

      // Build possible language codes for detection
      const userLangData = getLanguageByCode(userLang);
      const possibleCodes = [userLangData.speechCode];
      if (otherLang) {
        possibleCodes.push(getLanguageByCode(otherLang).speechCode);
      } else {
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

  const handleStop = async () => {
    isStopped.current = true;
    setIsListening(false);
    setIsProcessing(false);
    cleanup();

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

  if (permissionDenied) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Microphone Access Needed</Text>
        <Text style={styles.permissionText}>
          HiBuddy needs microphone access to listen and translate conversations.
          Please enable it in your device settings.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: Colors.textSecondary, marginTop: 12 }]}
          onPress={() => setupAudio()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 24 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontSize: 16, color: Colors.textSecondary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
