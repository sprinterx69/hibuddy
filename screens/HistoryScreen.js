import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { getLanguageLabel } from '../constants/languages';
import { getConversations, deleteConversation } from '../services/storageService';
import ChatBubble from '../components/ChatBubble';

export default function HistoryScreen() {
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    const data = await getConversations();
    setConversations(data);
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Conversation', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteConversation(id);
          await loadConversations();
        },
      },
    ]);
  };

  const handleShare = async (convo) => {
    const userLangLabel = getLanguageLabel(convo.userLang);
    const otherLangLabel = getLanguageLabel(convo.otherLang);

    let transcript = `HiBuddy Conversation — ${formatDate(convo.date)}\n`;
    transcript += `${userLangLabel} ↔ ${otherLangLabel}\n\n`;

    convo.exchanges.forEach((e) => {
      const speaker = e.isUser ? 'You' : 'Other';
      transcript += `[${speaker}] ${e.originalText}\n`;
      transcript += `→ ${e.translatedText}\n\n`;
    });

    try {
      await Share.share({ message: transcript });
    } catch (error) {
      // User cancelled
    }
  };

  const renderConversation = ({ item }) => {
    const userLangLabel = getLanguageLabel(item.userLang);
    const otherLangLabel = getLanguageLabel(item.otherLang);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedConvo(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>
            {formatDate(item.date)} at {formatTime(item.date)}
          </Text>
          <Text style={styles.cardDuration}>{formatDuration(item.duration)}</Text>
        </View>
        <Text style={styles.cardLanguages}>
          {userLangLabel} ↔ {otherLangLabel}
        </Text>
        <Text style={styles.cardExchanges}>
          {item.exchanges.length} exchange{item.exchanges.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionButton}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionButton}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation and it will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Transcript Modal */}
      <Modal visible={!!selectedConvo} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedConvo(null)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Transcript</Text>
            <TouchableOpacity onPress={() => selectedConvo && handleShare(selectedConvo)}>
              <Text style={styles.modalShare}>Share</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.transcriptScroll} contentContainerStyle={{ padding: 16 }}>
            {selectedConvo?.exchanges.map((e) => (
              <ChatBubble
                key={e.id}
                isUser={e.isUser}
                originalText={e.originalText}
                translatedText={e.translatedText}
                languageLabel={getLanguageLabel(e.originalLang)}
              />
            ))}
          </ScrollView>
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cardDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardLanguages: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  cardExchanges: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  shareText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 16,
    color: Colors.danger,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalClose: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalShare: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '600',
  },
  transcriptScroll: {
    flex: 1,
  },
});
