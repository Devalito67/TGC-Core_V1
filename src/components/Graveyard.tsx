import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal
} from 'react-native';
import { Player } from '../types';
import { CardComponent } from './Card';

interface GraveyardProps {
  player: Player;
  isOwn: boolean; // true = ton cimetière, false = celui de l'adversaire
}

export const Graveyard: React.FC<GraveyardProps> = ({ player, isOwn }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const count = player.graveyard.length;

  return (
    <>
      {/* Bouton compact cimetière */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.graveyardButton, isOwn ? styles.ownGrave : styles.enemyGrave]}
      >
        <Text style={styles.graveyardIcon}>💀</Text>
        <Text style={styles.graveyardCount}>{count}</Text>
        <Text style={styles.graveyardLabel}>{isOwn ? 'Cimetière' : `Cimetière\n${player.name}`}</Text>
      </TouchableOpacity>

      {/* Modal de consultation */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                💀 Cimetière de {player.name} ({count} cartes)
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Stats rapides */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {player.graveyard.filter(c => c.type === 'minion').length}
                </Text>
                <Text style={styles.statLabel}>Serviteurs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {player.graveyard.filter(c => c.type === 'spell').length}
                </Text>
                <Text style={styles.statLabel}>Sorts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {player.graveyard.filter(c => c.type === 'weapon').length}
                </Text>
                <Text style={styles.statLabel}>Armes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{player.deck.length}</Text>
                <Text style={styles.statLabel}>Dans deck</Text>
              </View>
            </View>

            {/* Liste des cartes */}
            {count === 0 ? (
              <View style={styles.emptyGrave}>
                <Text style={styles.emptyGraveText}>Le cimetière est vide</Text>
              </View>
            ) : (
              <ScrollView style={styles.cardList} showsVerticalScrollIndicator={false}>
                {/* Groupé par type */}
                {(['minion', 'spell', 'weapon'] as const).map(type => {
                  const cards = player.graveyard.filter(c => c.type === type);
                  if (cards.length === 0) return null;
                  return (
                    <View key={type} style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        {type === 'minion' ? '🧙 Serviteurs' : type === 'spell' ? '✨ Sorts' : '⚔️ Armes'}
                        {' '}({cards.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.cardsRow}>
                          {cards.map((card, index) => (
                            <View key={`${card.id}-${index}`} style={styles.graveCard}>
                              <CardComponent card={card} size="small" />
                              <View style={styles.graveOverlay}>
                                <Text style={styles.graveOverlayText}>💀</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  );
                })}
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  graveyardButton: {
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    minWidth: 52,
    borderWidth: 1,
  },
  ownGrave: {
    backgroundColor: 'rgba(100,100,100,0.2)',
    borderColor: 'rgba(150,150,150,0.4)',
  },
  enemyGrave: {
    backgroundColor: 'rgba(150,50,50,0.2)',
    borderColor: 'rgba(200,50,50,0.4)',
  },
  graveyardIcon: { fontSize: 18 },
  graveyardCount: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  graveyardLabel: { color: '#aaa', fontSize: 9, textAlign: 'center', marginTop: 2 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
    borderTopWidth: 2,
    borderColor: 'rgba(150,150,150,0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#aaa', fontSize: 16, fontWeight: 'bold' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statValue: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 11, marginTop: 2 },

  // Liste
  cardList: { flex: 1 },
  section: { marginBottom: 16 },
  sectionTitle: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardsRow: { flexDirection: 'row', gap: 8 },
  graveCard: { position: 'relative', opacity: 0.75 },
  graveOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graveOverlayText: { fontSize: 12 },

  // Vide
  emptyGrave: {
    padding: 40,
    alignItems: 'center',
  },
  emptyGraveText: { color: '#555', fontSize: 16, fontStyle: 'italic' },
});