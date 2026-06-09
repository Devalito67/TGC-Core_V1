import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from '../types';
import { CardComponent } from './Card';
import { useGameStore } from '../stores';
import { spellNeedsTarget } from '../rules/spellEffects';

interface HandProps {
  cards: Card[];
}

export const Hand: React.FC<HandProps> = ({ cards }) => {
  const playCard = useGameStore((s) => s.playCard);
  const playSpell = useGameStore((s) => s.playSpell);
  const state = useGameStore((s) => s.state);

  const [pendingSpell, setPendingSpell] = useState<Card | null>(null);
  const [directSpell, setDirectSpell] = useState<Card | null>(null);

  const currentPlayerIndex = state.currentPlayerIndex;
  const player = state.players[currentPlayerIndex];
  const opponentIdx = currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIdx];

  useEffect(() => {
    setPendingSpell(null);
  }, [currentPlayerIndex]);

  const handleCardPress = (card: Card) => {
    const s = useGameStore.getState().state;
    const p = s.players[s.currentPlayerIndex];
    const oppIdx = s.currentPlayerIndex === 0 ? 1 : 0;
    const opp = s.players[oppIdx];

    if (p.mana < card.cost) {
      // Sur web, Alert ne fonctionne pas — affiche un message inline à la place
      setDirectSpell({ ...card, description: `❌ Mana insuffisant ! Coût: ${card.cost} 💧 | Tu as: ${p.mana} 💧` });
      setTimeout(() => setDirectSpell(null), 2000);
      return;
    }

    if (card.type === 'minion') {
      playCard(card);
      return;
    }

    if (card.type === 'spell' && spellNeedsTarget(card.name)) {
      if (opp.board.length === 0) {
        // ✅ Affiche confirmation inline au lieu de Alert
        setDirectSpell(card);
      } else {
        setPendingSpell(card);
      }
      return;
    }

    if (card.type === 'spell') {
      // Sort sans cible → joue directement, pas besoin de confirmation
      playSpell(card);
      return;
    }
  };

  const handleDirectSpellConfirm = () => {
    if (!directSpell) return;
    playSpell(directSpell);
    setDirectSpell(null);
  };

  const handleTargetSelect = (targetCardId: string) => {
    if (!pendingSpell) return;
    playSpell(pendingSpell, targetCardId);
    setPendingSpell(null);
  };

  const handleTargetHero = () => {
    if (!pendingSpell) return;
    playSpell(pendingSpell);
    setPendingSpell(null);
  };

  return (
    <View>
      {pendingSpell && (
        <View style={styles.targetZone}>
          <View style={styles.targetHeader}>
            <Text style={styles.targetLabel}>🎯 {pendingSpell.name} — Choisis une cible :</Text>
            <TouchableOpacity onPress={() => setPendingSpell(null)}>
              <Text style={styles.cancelText}>✕ Annuler</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.targetRow}>
              <TouchableOpacity style={styles.targetHeroButton} onPress={handleTargetHero}>
                <Text style={styles.targetHeroIcon}>👤</Text>
                <Text style={styles.targetHeroName}>{opponent.name}</Text>
                <Text style={styles.targetHeroHp}>❤️ {opponent.health}</Text>
              </TouchableOpacity>
              {opponent.board.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.targetCardWrapper}
                  onPress={() => handleTargetSelect(card.id)}
                >
                  <CardComponent card={card} size="small" />
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetBadgeText}>🎯</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {directSpell && (
        <View style={styles.directSpellBanner}>
          <Text style={styles.directSpellText}>
            🔥 {directSpell.name} — Attaquer {opponent.name} directement ? (3 dégâts)
          </Text>
          <View style={styles.directSpellButtons}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleDirectSpellConfirm}
            >
              <Text style={styles.confirmText}>💥 Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.denyButton}
              onPress={() => setDirectSpell(null)}
            >
              <Text style={styles.denyText}>✕ Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hand}
      >
        {cards.length === 0 ? (
          <Text style={styles.emptyHand}>Main vide — Pioche une carte ⬆️</Text>
        ) : (
          cards.map(card => (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleCardPress(card)}
              disabled={pendingSpell !== null && pendingSpell.id !== card.id}
              style={[
                styles.cardWrapper,
                player.mana < card.cost && styles.cardUnplayable,
                pendingSpell?.id === card.id && styles.cardPending,
                pendingSpell !== null && pendingSpell.id !== card.id && styles.cardDimmed,
              ]}
            >
              <CardComponent card={card} size="small" />
              <View style={[styles.costBadge, player.mana >= card.cost ? styles.costOk : styles.costNok]}>
                <Text style={styles.costText}>💧{card.cost}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  hand: { flexDirection: 'row', padding: 6, gap: 8, alignItems: 'flex-end' },
  emptyHand: { color: '#555', fontSize: 13, fontStyle: 'italic', padding: 16 },
  cardWrapper: { position: 'relative' },
  cardUnplayable: { opacity: 0.35 },
  cardDimmed: { opacity: 0.4 },
  cardPending: {
    transform: [{ scale: 1.08 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 12,
  },
  costBadge: { position: 'absolute', top: -6, left: -6, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
  costOk: { backgroundColor: '#4ECDC4' },
  costNok: { backgroundColor: '#FF6B6B' },
  costText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  targetZone: {
    backgroundColor: 'rgba(255,70,70,0.12)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,70,70,0.45)',
  },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  targetLabel: { color: '#FF6B6B', fontSize: 13, fontWeight: 'bold', flex: 1 },
  cancelText: { color: '#aaa', fontSize: 13, fontWeight: 'bold', marginLeft: 10 },
  targetRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  targetHeroButton: {
    backgroundColor: 'rgba(255,70,70,0.25)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    minWidth: 65,
  },
  targetHeroIcon: { fontSize: 22 },
  targetHeroName: { color: '#FF6B6B', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  targetHeroHp: { color: '#fff', fontSize: 11, marginTop: 2 },
  targetCardWrapper: { position: 'relative' },
  targetBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBadgeText: { fontSize: 11 },
  directSpellBanner: {
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.6)',
  },
  directSpellText: {
    color: '#FFA500',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  directSpellButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  denyButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  denyText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 14,
  },
});