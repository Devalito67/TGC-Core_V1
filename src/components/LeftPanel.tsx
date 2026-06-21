import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Player, TurnPhase } from '../types';

interface LeftPanelProps {
  player1: Player;
  player2: Player;
  turnPhase: TurnPhase;
  currentPlayerIndex: 0 | 1;
  selectedAttackerId: string | null;  // ← reçu depuis GameScreen
  onAttackHero: () => void;           // ← reçu depuis GameScreen
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  player1,
  player2,
  turnPhase,
  currentPlayerIndex,
  selectedAttackerId,
  onAttackHero,
}) => {
  const handleAttackHero = () => {
    if (!selectedAttackerId) {
      Alert.alert('⚔️', "Sélectionne d'abord une de tes cartes pour attaquer !");
      return;
    }
    onAttackHero();
  };

  return (
    <View style={styles.container}>

      {/* player2 — toujours en haut */}
      <View style={[styles.playerIndicator, currentPlayerIndex === 1 && styles.playerIndicatorActive]}>
        <View style={[styles.activeDot, currentPlayerIndex === 1 && styles.activeDotOn]} />
        <Text style={[styles.playerLabel, currentPlayerIndex === 1 && styles.playerLabelActive]}>
          {player2.name.slice(0, 6).toUpperCase()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleAttackHero}
        style={[
          styles.heroAvatarContainer,
          !!selectedAttackerId && turnPhase === 'attack' && styles.heroAvatarTargetable,
          currentPlayerIndex === 1 && styles.heroAvatarActive,
        ]}
        activeOpacity={selectedAttackerId ? 0.6 : 1}
      >
        <View style={styles.healthBadge}>
          <Text style={styles.healthText}>{player2.health}</Text>
        </View>
        <Text style={styles.heroSubText}>Player 2</Text>
        {selectedAttackerId && turnPhase === 'attack' && currentPlayerIndex === 0 && (
          <Text style={styles.targetIcon}>🎯</Text>)}
        <View style={styles.manaRow}>
          {Array.from({ length: player2.maxMana }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.manaDot,
                i < player2.mana ? styles.manaDotActive : styles.manaDotInactive,
              ]}
            />
          ))}
        </View>

      </TouchableOpacity>

      <View style={styles.spacer} />

      {/* player1 — toujours en bas */}
      {/* Héros player1 — toujours en bas */}
      <TouchableOpacity
        onPress={() => {
          if (selectedAttackerId && turnPhase === 'attack' && currentPlayerIndex === 1) {
            handleAttackHero(); // ← attaque le héros de player1
          }
        }}
        style={[
          styles.heroAvatarContainer,
          currentPlayerIndex === 0 && styles.heroAvatarActive,
          !!selectedAttackerId && turnPhase === 'attack' && currentPlayerIndex === 1 && styles.heroAvatarTargetable,
        ]}
        activeOpacity={selectedAttackerId && currentPlayerIndex === 1 ? 0.6 : 1}
      >
        <View style={[styles.healthBadge, styles.playerHealthBadge]}>
          <Text style={styles.healthText}>{player1.health}</Text>
        </View>
        <Text style={styles.heroSubText}>Player 1</Text>
        <View style={styles.manaRow}>
          {Array.from({ length: player1.maxMana }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.manaDot,
                i < player1.mana ? styles.manaDotActive : styles.manaDotInactive,
              ]}
            />
          ))}
        </View>
        {selectedAttackerId && turnPhase === 'attack' && currentPlayerIndex === 1 && (
          <Text style={styles.targetIcon}>🎯</Text>
        )}
      </TouchableOpacity>

      <View style={[styles.playerIndicator, currentPlayerIndex === 0 && styles.playerIndicatorActive]}>
        <View style={[styles.activeDot, currentPlayerIndex === 0 && styles.activeDotOn]} />
        <Text style={[styles.playerLabel, currentPlayerIndex === 0 && styles.playerLabelActive]}>
          {player1.name.slice(0, 6).toUpperCase()}
        </Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 12,
    gap: 8,
  },
  playerIndicator: {
    alignItems: 'center',
    gap: 3,
    opacity: 0.3,
  },
  playerIndicatorActive: {
    opacity: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeDotOn: {
    backgroundColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowRadius: 6,
    shadowOpacity: 0.8,
    elevation: 4,
  },
  playerLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  playerLabelActive: {
    color: '#d4af37',
  },
  heroAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.2)',
    backgroundColor: '#1a1c1f',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroAvatarActive: {
    borderColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation: 4,
  },
  heroAvatarTargetable: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    shadowColor: '#FF6B6B',
    shadowRadius: 10,
    shadowOpacity: 0.6,
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
  },
  heroSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 15,
  },
  targetIcon: {
    fontSize: 18,
    position: 'absolute',
  },
  manaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 4,
    justifyContent: 'center',
    maxWidth: 40,
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
    flex: 1,
  },
});