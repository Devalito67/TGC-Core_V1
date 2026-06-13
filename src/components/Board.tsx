import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CardComponent } from './Card';
import { Player, TurnPhase } from '../types';
import { Graveyard } from './Graveyard';

interface BoardProps {
  player: Player;
  opponent: Player;
  isCurrentPlayer: boolean;
  turnPhase: TurnPhase;
  onAttackSelf: (attackerId: string, defenderId: string) => void;
  onAttackOpponent: (attackerId: string) => void;
  onEndTurn: () => void;
}

export const Board: React.FC<BoardProps> = ({
  player,
  opponent,
  isCurrentPlayer,
  turnPhase,
  onAttackSelf,
  onAttackOpponent,
  onEndTurn,
}) => {
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);

  // Dans handleSelectAttacker :
  const handleSelectAttacker = (cardId: string) => {
    if (!isCurrentPlayer) return;
    if (turnPhase !== 'attack') {
      Alert.alert('⚔️', "Tu ne peux attaquer que pendant la phase Attack !");
      return;
    }
    setSelectedAttackerId((prev) => (prev === cardId ? null : cardId));
  };

  const handleAttackDefender = (defenderId: string) => {
    if (!selectedAttackerId) {
      Alert.alert('⚔️', "Sélectionne d'abord une de tes cartes pour attaquer !");
      return;
    }
    onAttackSelf(selectedAttackerId, defenderId);
    setSelectedAttackerId(null);
  };

  const handleAttackHero = () => {
    if (!selectedAttackerId) {
      Alert.alert('⚔️', "Sélectionne d'abord une de tes cartes pour attaquer !");
      return;
    }
    onAttackOpponent(selectedAttackerId);
    setSelectedAttackerId(null);
  };

  const handleEndTurnPress = () => {
    setSelectedAttackerId(null);
    onEndTurn();
  };

  const phases: { key: TurnPhase; label: string }[] = [
    { key: 'draw', label: 'Draw' },
    { key: 'main1', label: 'Main 1' },
    { key: 'attack', label: 'Attack' },
    { key: 'defense', label: 'Defense' },
    { key: 'main2', label: 'Main 2' },
    { key: 'end', label: 'End' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <TouchableOpacity
          onPress={handleAttackHero}
          style={[
            styles.heroAvatarContainer,
            selectedAttackerId && styles.heroAvatarTargetable,
          ]}
          activeOpacity={selectedAttackerId ? 0.6 : 1}
        >
          <View style={styles.healthBadge}>
            <Text style={styles.healthText}>{opponent.health}</Text>
          </View>
          <Text style={styles.heroSubText}>OPPONENT</Text>
          {selectedAttackerId && <Text style={styles.targetIcon}>🎯</Text>}
        </TouchableOpacity>

        <View style={styles.spacer} />

        <View style={styles.heroAvatarContainer}>
          <View style={[styles.healthBadge, styles.playerHealthBadge]}>
            <Text style={styles.healthText}>{player.health}</Text>
          </View>
          <Text style={styles.heroSubText}>YOU</Text>
          <View style={styles.manaRow}>
            {Array.from({ length: player.maxMana }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.manaDot,
                  i < player.mana ? styles.manaDotActive : styles.manaDotInactive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.battlefield}>
        <View style={styles.opponentBoard}>
          <ScrollView horizontal contentContainerStyle={styles.cardsScroll}>
            {opponent.board.length === 0 ? (
              <Text style={styles.emptyText}>Empty Battlefield</Text>
            ) : (
              opponent.board.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => handleAttackDefender(card.id)}
                  style={[
                    styles.cardSlot,
                    selectedAttackerId && styles.cardSlotTargetable,
                  ]}
                >
                  <CardComponent card={card} size="small" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.phaseDivider}>
          {phases.map((phase, index) => {
            const isActive = turnPhase === phase.key;

            return (
              <React.Fragment key={phase.key}>
                <View style={styles.phaseStepWrapper}>
                  <View style={[styles.phaseStep, isActive && styles.phaseStepActive]}>
                    <Text style={[styles.phaseStepText, isActive && styles.phaseStepTextActive]}>
                      {phase.label}
                    </Text>
                  </View>
                </View>

                {index < phases.length - 1 && (
                  <View style={[styles.phaseConnector, isActive && styles.phaseConnectorActive]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.playerBoard}>
          <ScrollView horizontal contentContainerStyle={styles.cardsScroll}>
            {player.board.length === 0 ? (
              <Text style={styles.emptyText}>Deploy cards to the Rift</Text>
            ) : (
              player.board.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => handleSelectAttacker(card.id)}
                  style={[
                    styles.cardSlot,
                    turnPhase !== 'attack' && { opacity: 0.5 },
                    selectedAttackerId === card.id && styles.cardSlotSelected,
                  ]}
                >
                  <CardComponent card={card} size="small" />
                  {selectedAttackerId === card.id && (
                    <View style={styles.attackerBadge}>
                      <Text style={styles.attackerEmoji}>⚔️</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <View style={styles.sidebarRight}>
        <Graveyard player={opponent} isOwn={false} />

        <TouchableOpacity style={styles.endTurnButton} onPress={handleEndTurnPress}>
          <Text style={styles.endTurnText}>END{'\n'}TURN</Text>
        </TouchableOpacity>

        <Graveyard player={player} isOwn />
      </View>

      {selectedAttackerId && (
        <View style={styles.actionOverlay}>
          <Text style={styles.actionOverlayText}>Select target or strike the Hero</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0c0e11',
    paddingVertical: 10,
  },
  sidebar: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  sidebarRight: {
    width: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderLeftWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  battlefield: {
    flex: 1,
    paddingHorizontal: 10,
  },
  heroAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d4af37',
    backgroundColor: '#1a1c1f',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroAvatarTargetable: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    shadowColor: '#FF6B6B',
    shadowRadius: 10,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  healthBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#111316',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  playerHealthBadge: {
    borderColor: '#d4af37',
  },
  healthText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Sora',
  },
  heroSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 15,
  },
  targetIcon: {
    fontSize: 20,
    position: 'absolute',
  },
  manaRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  manaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  manaDotActive: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  manaDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  spacer: {
    height: '20%',
  },
  opponentBoard: {
    flex: 1,
    justifyContent: 'center',
    opacity: 0.8,
    transform: [{ perspective: 1000 }, { rotateX: '10deg' }],
  },
  playerBoard: {
    flex: 1,
    justifyContent: 'center',
  },
  cardsScroll: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  cardSlot: {
    padding: 2,
    borderRadius: 6,
  },
  cardSlotSelected: {
    borderWidth: 2,
    borderColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowRadius: 15,
    shadowOpacity: 0.8,
    elevation: 10,
    transform: [{ scale: 1.1 }],
  },
  cardSlotTargetable: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowRadius: 10,
    shadowOpacity: 0.6,
  },
  attackerBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#d4af37',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attackerEmoji: {
    fontSize: 12,
  },
  endTurnButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  endTurnText: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.1)',
    fontStyle: 'italic',
    fontSize: 12,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 20,
    left: '20%',
    right: '20%',
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionOverlayText: {
    color: '#111316',
    fontWeight: 'bold',
    fontSize: 12,
  },
  phaseDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 8,
  },
  phaseStepWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseStep: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.14)',
    alignItems: 'center',
  },
  phaseStepActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  phaseStepText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  phaseStepTextActive: {
    color: '#d4af37',
    fontWeight: '900',
  },
  phaseConnector: {
    flex: 1,
    maxWidth: 26,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  phaseConnectorActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
});