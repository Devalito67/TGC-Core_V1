import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { CardComponent } from './Card';
import { Card, Player, TurnPhase } from '../types';

interface BoardProps {
  player: Player;
  opponent: Player;
  isCurrentPlayer: boolean;
  turnPhase: TurnPhase;
  selectedAttackerId: string | null;
  onSelectAttacker: (attackerId: string | null) => void;
  onAttackDefender: (targetType: 'hero' | 'unit', targetId?: string) => void;
  onConfirmAttack: () => void;
  onAssignDefender: (attackerId: string, blockerId: string) => void;
  onConfirmDefense: () => void;
  opponentFlex: Animated.Value;
  playerFlex: Animated.Value;
}

const PHASES: { key: TurnPhase; label: string }[] = [
  { key: 'main1', label: 'Main 1' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'main2', label: 'Main 2' },
  { key: 'end', label: 'End' },
];

export const Board: React.FC<BoardProps> = ({
  player,
  opponent,
  isCurrentPlayer,
  turnPhase,
  selectedAttackerId,
  onSelectAttacker,
  onAttackDefender,
  onConfirmAttack,
  onAssignDefender,
  onConfirmDefense,
  opponentFlex,
  playerFlex,
}) => {
  const handleSelectAttacker = (cardId: string) => {
    if (!isCurrentPlayer) return;
    if (turnPhase !== 'attack') {
      Alert.alert('⚔️', "Tu ne peux attaquer que pendant la phase Attack !");
      return;
    }
    onSelectAttacker(selectedAttackerId === cardId ? null : cardId);
  };

  const handleSelectTargetOnUnit = (targetId: string) => {
    if (!selectedAttackerId || turnPhase !== 'attack') return;
    onAttackDefender('unit', targetId);
    onSelectAttacker(null);
  };

  const renderOpponentCard = ({ item: card }: { item: Card }) => (
    <TouchableOpacity
      onPress={() => handleSelectTargetOnUnit(card.id)}
      style={[styles.cardSlot, !!selectedAttackerId && styles.cardSlotTargetable]}
    >
      <CardComponent card={card} size="small" />
    </TouchableOpacity>
  );

  const renderPlayerCard = ({ item: card }: { item: Card }) => (
    <TouchableOpacity
      onPress={() => {
        if (card.summoningSickness) {
          Alert.alert('⏳', "Cette carte vient d\'être invoquée, elle ne peut pas encore attaquer !");
          return;
        }
        handleSelectAttacker(card.id);
      }}
      style={[
        styles.cardSlot,
        turnPhase !== 'attack' && { opacity: 0.5 },
        card.summoningSickness && styles.cardSlotSick,
        selectedAttackerId === card.id && styles.cardSlotSelected,
      ]}
    >
      <CardComponent card={card} size="small" />
      {card.summoningSickness && (
        <View style={styles.sicknessBadge}>
          <Text style={styles.sicknessEmoji}>⏳</Text>
        </View>
      )}
      {selectedAttackerId === card.id && (
        <View style={styles.attackerBadge}>
          <Text style={styles.attackerEmoji}>⚔️</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* Plateau adverse — flex animé */}
      <Animated.View style={[styles.boardZone, { flex: opponentFlex }]}>
        {opponent.board.length === 0 ? (
          <View style={styles.emptyZone}>
            <Text style={styles.emptyText}>Empty Battlefield</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={opponent.board}
            keyExtractor={(card) => card.id}
            renderItem={renderOpponentCard}
            contentContainerStyle={styles.cardsScroll}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Barre de phases */}
      <View style={styles.phaseDivider}>
        {PHASES.map((phase, index) => {
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
              {index < PHASES.length - 1 && (
                <View style={[styles.phaseConnector, isActive && styles.phaseConnectorActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Hint défense */}
      {turnPhase === 'defense' && (
        <View style={styles.defenseHintContainer} pointerEvents="none">
          <Text style={styles.defenseHintText}>
            Swipe ↑↓ pour changer la vue • Sélectionne un défenseur
          </Text>
        </View>
      )}

      {/* Plateau joueur — flex animé */}
      <Animated.View style={[styles.boardZone, { flex: playerFlex }]}>
        {player.board.length === 0 ? (
          <View style={styles.emptyZone}>
            <Text style={styles.emptyText}>Deploy cards to the Rift</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={player.board}
            keyExtractor={(card) => card.id}
            renderItem={renderPlayerCard}
            contentContainerStyle={styles.cardsScroll}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Overlay hint attaque */}
      {selectedAttackerId && turnPhase === 'attack' && (
        <View style={styles.actionOverlay} pointerEvents="none">
          <Text style={styles.actionOverlayText}>
            Sélectionne une cible ou appuie sur le héros adverse
          </Text>
        </View>
      )}

      {turnPhase === 'attack' && (
        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirmAttack}>
            <Text style={styles.confirmButtonText}>Confirmer Attack ⚔️</Text>
          </TouchableOpacity>
        </View>
      )}

      {turnPhase === 'defense' && (
        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirmDefense}>
            <Text style={styles.confirmButtonText}>Confirmer Defense 🛡️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e11',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  boardZone: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsScroll: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: 'center',
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
  cardSlotSick: {
    opacity: 0.4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
  attackerEmoji: { fontSize: 12 },
  sicknessBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: '#1a1c1f',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sicknessEmoji: { fontSize: 12 },
  emptyText: {
    color: 'rgba(255,255,255,0.1)',
    fontStyle: 'italic',
    fontSize: 12,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 60,
    left: '15%',
    right: '15%',
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionOverlayText: {
    color: '#111316',
    fontWeight: 'bold',
    fontSize: 11,
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
  defenseHintContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  defenseHintText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '600',
  },
  confirmButtonContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: 'bold',
  },
});