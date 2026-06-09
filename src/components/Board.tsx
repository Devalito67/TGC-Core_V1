import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CardComponent } from './Card';
import { Player } from '../types';
import { Graveyard } from './Graveyard';

interface BoardProps {
  player: Player;
  opponent: Player;
  isCurrentPlayer: boolean;
  onAttackSelf: (attackerId: string, defenderId: string) => void;
  onAttackOpponent: (attackerId: string) => void;
}

export const Board: React.FC<BoardProps> = ({
  player,
  opponent,
  isCurrentPlayer,
  onAttackSelf,
  onAttackOpponent,
}) => {
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);

  const handleSelectAttacker = (cardId: string) => {
    if (!isCurrentPlayer) return;
    setSelectedAttackerId(prev => prev === cardId ? null : cardId);
  };

  const handleAttackDefender = (defenderId: string) => {
    if (!selectedAttackerId) {
      Alert.alert('⚔️', 'Sélectionne d\'abord une de tes cartes pour attaquer !');
      return;
    }
    onAttackSelf(selectedAttackerId, defenderId);
    setSelectedAttackerId(null);
  };

  const handleAttackHero = () => {
    if (!selectedAttackerId) {
      Alert.alert('⚔️', 'Sélectionne d\'abord une de tes cartes pour attaquer !');
      return;
    }
    onAttackOpponent(selectedAttackerId);
    setSelectedAttackerId(null);
  };

  return (
    <View style={styles.heroRow}>

      {/* === ZONE ADVERSAIRE === */}
      <TouchableOpacity
        onPress={handleAttackHero}
        style={[styles.heroZone, selectedAttackerId && styles.heroZoneTargetable]}
        activeOpacity={selectedAttackerId ? 0.6 : 1}
      >
        <Text style={styles.heroName}>{opponent.name}</Text>
        <Text style={styles.heroStats}>
          ❤️ {opponent.health}/{opponent.maxHealth}
        </Text>
        {selectedAttackerId && (
          <Text style={styles.attackHint}>👆 Appuie pour attaquer ce héros</Text>
        )}
      </TouchableOpacity>
      <Graveyard player={opponent} isOwn={false} />

      {/* Board adversaire */}
      <View style={styles.opponentBoardZone}>
        <Text style={styles.zoneLabel}>Terrain adverse ({opponent.board.length}/7)</Text>
        <View style={styles.cardsRow}>
          {opponent.board.length === 0 ? (
            <Text style={styles.emptyZone}>— Terrain vide —</Text>
          ) : (
            opponent.board.map(card => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleAttackDefender(card.id)}
                style={[
                  styles.cardWrapper,
                  selectedAttackerId && styles.cardTargetable,
                ]}
              >
                <CardComponent card={card} size="small" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Séparateur central */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>
          {isCurrentPlayer ? `⚔️ Tour de ${player.name}` : `⏳ ${player.name}`}
        </Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Board joueur actif */}
      <View style={styles.playerBoardZone}>
        <Text style={styles.zoneLabel}>Ton terrain ({player.board.length}/7)</Text>
        <View style={styles.cardsRow}>
          {player.board.length === 0 ? (
            <Text style={styles.emptyZone}>— Joue des cartes depuis ta main —</Text>
          ) : (
            player.board.map(card => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleSelectAttacker(card.id)}
                style={[
                  styles.cardWrapper,
                  selectedAttackerId === card.id && styles.cardSelected,
                ]}
              >
                <CardComponent card={card} size="small" />
                {selectedAttackerId === card.id && (
                  <Text style={styles.selectedBadge}>⚔️</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* === ZONE JOUEUR === */}
      <View style={styles.playerHeroZone}>
        <Text style={styles.heroName}>{player.name}</Text>
        <Text style={styles.heroStats}>
          ❤️ {player.health}/{player.maxHealth}
          {'   '}
          💧 {player.mana}/{player.maxMana}
          {'   '}
          🃏 {player.deck.length} cartes
        </Text>
        <Graveyard player={player} isOwn={true} />
      </View>

      {/* Hint sélection */}
      {selectedAttackerId && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>
            ⚔️ Cible sélectionnée — Appuie sur une carte ennemie ou sur le héros adverse
          </Text>
          <TouchableOpacity onPress={() => setSelectedAttackerId(null)}>
            <Text style={styles.cancelText}>✕ Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  heroZone: {
    backgroundColor: 'rgba(255, 70, 70, 0.15)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 70, 70, 0.3)',
  },
  heroZoneTargetable: {
    backgroundColor: 'rgba(255, 70, 70, 0.4)',
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  heroName: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroStats: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  attackHint: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  opponentBoardZone: {
    backgroundColor: 'rgba(255, 100, 100, 0.08)',
    borderRadius: 10,
    padding: 8,
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.2)',
  },
  playerBoardZone: {
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderRadius: 10,
    padding: 8,
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.2)',
  },
  zoneLabel: {
    color: '#aaa',
    fontSize: 11,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  emptyZone: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  cardWrapper: {
    position: 'relative',
  },
  cardSelected: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  cardTargetable: {
    transform: [{ scale: 1.03 }],
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
  },
  playerHeroZone: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.3)',
  },
  hintBanner: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  hintText: {
    color: '#FFD700',
    fontSize: 12,
    flex: 1,
  },
  cancelText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  heroRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
});