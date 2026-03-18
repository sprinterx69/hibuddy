import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useAudioRecorder, AudioModule, IOSOutputFormat, AudioQuality } from 'expo-audio';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import { LANGUAGES, getLanguageByCode, getLanguageLabel } from '../constants/languages';
import { getUserProfile, saveConversation } from '../services/storageService';
import { transcribeAudio, translateText } from '../services/translationService';
import ChatBubble from '../components/ChatBubble';

// Custom preset: LINEAR16 WAV for Google Speech-to-Text compatibility
const LINEAR16_PRESET = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  android: {
    outputFormat: 'default',
    audioEncoder: 'default',
  },
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export default function ConversationScreen({ navigation }) {
  const [userLang, setUserLang] = useState('en');
  const [otherLang, setOtherLang] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Requesting mic access...');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recordingUriRef = useRef(null);
  const recorder = useAudioRecorder(LINEAR16_PRESET, (status) => {
    if (status.url) {
      recordingUriRef.current = status.url;
    }
  });
  const otherScrollRef = useRef(null);
  const userScrollRef = useRef(null);
  const conversationStart = useRef(Date.now());
  const isStopped = useRef(false);
  const timerRef = useRef(null);

  // Pulsing green dot animation for listening state
  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

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

      // Build language batches for STT detection
      // Google STT v1 allows max 1 primary + 3 alternatives per request
      // When otherLang is unknown, we try multiple batches to find the right language
      const userSpeechCode = getLanguageByCode(userLang).speechCode;
      let languageBatches;

      if (otherLang) {
        // Other language is known — single batch with user + other
        const otherSpeechCode = getLanguageByCode(otherLang).speechCode;
        languageBatches = [[userSpeechCode, otherSpeechCode]];
      } else {
        // Other language unknown — try batches of 3 alternatives each
        // Each batch: [userLang (primary), alt1, alt2, alt3]
        // Ordered by global speaker count for best chance of quick detection
        const allOtherCodes = LANGUAGES
          .filter((l) => l.code !== userLang)
          .map((l) => l.speechCode);

        languageBatches = [];
        for (let i = 0; i < allOtherCodes.length; i += 3) {
          languageBatches.push([
            userSpeechCode,
            ...allOtherCodes.slice(i, i + 3),
          ]);
        }
      }
      console.log('STT language batches:', JSON.stringify(languageBatches));

      // Transcribe with language detection (tries batches until confident)
      const { transcript, detectedLanguage, confidence } = await transcribeAudio(base64Audio, languageBatches);
      console.log(`Detected: lang=${detectedLanguage}, confidence=${confidence}, text="${transcript}"`);

      if (!transcript) {
        setStatusText('No speech detected — listening...');
        setTimeout(() => startListening(), 500);
        setIsProcessing(false);
        return;
      }

      // Determine who is speaking based on detected language
      const isUserSpeaking = detectedLanguage === userLang;

      // Auto-detect the other person's language on first non-user speech
      if (!isUserSpeaking && !otherLang) {
        console.log(`Auto-detected other language: ${detectedLanguage} (${getLanguageLabel(detectedLanguage)})`);
        setOtherLang(detectedLanguage);
        setStatusText(`Detected ${getLanguageLabel(detectedLanguage)}!`);
      }

      // Determine translation target
      const targetLang = isUserSpeaking ? (otherLang || detectedLanguage) : userLang;
      setStatusText(isUserSpeaking
        ? `Translating to ${getLanguageLabel(targetLang)}...`
        : `Translating to ${getLanguageLabel(userLang)}...`
      );
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
      setIsSpeaking(true);
      setIsProcessing(false);
      setStatusText('Speaking...');
      Speech.speak(translated, {
        language: targetLangData.speechCode,
        onDone: () => {
          setIsSpeaking(false);
          if (!isStopped.current) startListening();
        },
        onError: () => {
          setIsSpeaking(false);
          if (!isStopped.current) startListening();
        },
      });
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

  // Derive status mode for the divider pill
  const statusMode = isSpeaking ? 'speaking' : isProcessing ? 'thinking' : isListening ? 'listening' : 'idle';

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
          style={[styles.permissionButton, { backgroundColor: '#6b7280', marginTop: 12 }]}
          onPress={() => setupAudio()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 24 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontSize: 16, color: '#6b7280' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== TOP HALF — Other person (dark) ===== */}
      <View style={styles.halfTop}>
        <View style={styles.topLangPill}>
          <Text style={styles.topLangText}>
            {otherLang ? getLanguageLabel(otherLang) : 'Detecting...'}
          </Text>
        </View>
        <ScrollView
          style={styles.chatScroll}
          ref={otherScrollRef}
          onContentSizeChange={() => otherScrollRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.chatContent}
        >
          {exchanges
            .filter((e) => !e.isUser)
            .map((e) => (
              <ChatBubble
                key={e.id}
                isUser={false}
                originalText={e.originalText}
                translatedText={e.translatedText}
              />
            ))}
        </ScrollView>
      </View>

      {/* ===== GREEN DIVIDER with status pill ===== */}
      <View style={styles.dividerWrapper}>
        <View style={styles.dividerLine} />
        <View style={styles.statusPill}>
          {statusMode === 'listening' && (
            <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
          )}
          {statusMode === 'thinking' && (
            <ActivityIndicator size="small" color="#22c55e" style={{ marginRight: 6 }} />
          )}
          {statusMode === 'speaking' && (
            <Text style={styles.statusIcon}>{'))) '}</Text>
          )}
          <Text style={styles.statusLabel}>
            {statusMode === 'listening' ? 'LISTENING'
              : statusMode === 'thinking' ? 'THINKING'
              : statusMode === 'speaking' ? 'SPEAKING'
              : 'READY'}
          </Text>
        </View>
      </View>

      {/* ===== BOTTOM HALF — User (white) ===== */}
      <View style={styles.halfBottom}>
        <ScrollView
          style={styles.chatScroll}
          ref={userScrollRef}
          onContentSizeChange={() => userScrollRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.chatContent}
        >
          {exchanges
            .filter((e) => e.isUser)
            .map((e) => (
              <ChatBubble
                key={e.id}
                isUser={true}
                originalText={e.originalText}
                translatedText={e.translatedText}
              />
            ))}
        </ScrollView>
        <View style={styles.bottomLangPill}>
          <Text style={styles.bottomLangText}>{getLanguageLabel(userLang)}</Text>
        </View>
      </View>

      {/* ===== Stop button ===== */}
      <View style={styles.stopWrapper}>
        <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
          <View style={styles.stopIcon} />
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const GREEN = '#22c55e';
const DARK_BG = '#1a1a1a';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // ===== TOP HALF (dark) =====
  halfTop: {
    flex: 1,
    backgroundColor: DARK_BG,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
  },
  topLangPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  topLangText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },
  // ===== BOTTOM HALF (white) =====
  halfBottom: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bottomLangPill: {
    alignSelf: 'flex-start',
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  bottomLangText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  // ===== Chat =====
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 4,
  },
  // ===== DIVIDER =====
  dividerWrapper: {
    height: 4,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: GREEN,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
    marginRight: 8,
  },
  statusIcon: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  // ===== STOP BUTTON =====
  stopWrapper: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 8,
    backgroundColor: '#ffffff',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // ===== PERMISSION SCREEN =====
  permissionContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: GREEN,
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
