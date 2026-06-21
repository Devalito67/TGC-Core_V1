import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player, TurnPhase } from '../types';
import { Graveyard } from './Graveyard';
import { useGameStore } from '../stores';

const PHASE_LABELS: Record<TurnPhase, { button: string; hint: string; color: string }> = {
  draw: { button: 'DRAW', hint: '', color: '#888' },
  main1: { button: 'PASS', hint: 'Main Phase 1', color: '#d4af37' },
  attack: { button: 'PASS', hint: 'Attack Phase', color: '#FF6B6B' },
  defense: { button: 'SKIP', hint: 'Defense Phase', color: '#4ECDC4' },
  main2: { button: 'PASS', hint: 'Main Phase 2', color: '#d4af37' },
  end: { button: 'END\nTURN', hint: 'End Phase', color: '#d4af37' },
};

interface RightPanelProps {
  player1: Player;
  player2: Player;
  turnPhase: TurnPhase;
  onEndTurn: () => void;
  onNextPhase: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  player1,
  player2,
  turnPhase,
  onNextPhase,
  onEndTurn,
}) => {
  const phaseInfo = PHASE_LABELS[turnPhase];
  const confirmAttacks = useGameStore(s => s.confirmAttacks);
  const confirmDefense = useGameStore(s => s.confirmDefense);
  const attacks = useGameStore(s => s.state.combat.attacks);
  const blocks = useGameStore(s => s.state.combat.blocks);

  // En defense, c'est le défenseur (l'autre joueur) qui agit sur le board
  // mais le bouton PASS/END reste toujours sous contrôle du joueur actif
  const isDefensePhase = turnPhase === 'defense';

  const handlePress = () => {
    if (turnPhase === 'end') {
      onEndTurn();
    } else {
      onNextPhase();
    }
  };

  return (
    <View style={styles.container}>
      <Graveyard player={player2} isOwn={false} />

      <View style={styles.centerBlock}>

        {turnPhase === 'attack' && (
          <TouchableOpacity
            style={[styles.actionButton, attacks.length === 0 && styles.actionButtonDim]}
            onPress={confirmAttacks}
          >
            <Text style={styles.actionButtonText}>⚔️</Text>
            <Text style={styles.actionButtonText}>
              {attacks.length > 0 ? `Attaquer\n(${attacks.length})` : 'Passer'}
            </Text>
          </TouchableOpacity>
        )}

        {turnPhase === 'defense' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={confirmDefense}
          >
            <Text style={styles.actionButtonText}>🛡️</Text>
            <Text style={styles.actionButtonText}>
              {blocks.length > 0 ? `Défendre\n(${blocks.length})` : 'Passer'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bouton PASS / END — toujours visible sauf en defense où il est masqué */}
        {!isDefensePhase && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: phaseInfo.color }]}
            onPress={handlePress}
          >
            <Text style={[styles.actionButtonText, { color: phaseInfo.color }]}>
              {phaseInfo.button}
            </Text>
          </TouchableOpacity>
        )}

      </View>

      <Graveyard player={player1} isOwn />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderLeftWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  centerBlock: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    minWidth: 56,
  },
  actionButtonDim: {
    opacity: 0.4,   // ← simple opacity au lieu de dupliquer tout le style
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#d4af37',
  },
});