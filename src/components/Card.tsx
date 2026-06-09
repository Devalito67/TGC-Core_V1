import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card } from '../types';

interface CardComponentProps {
  card: Card;
  onPress?: () => void;
  playable?: boolean;
  size?: 'small' | 'normal' | 'large';
}

export const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  onPress, 
  playable = false,
  size = 'normal' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { width: 80, height: 110, fontSize: 10 };
      case 'large': return { width: 140, height: 190, fontSize: 16 };
      default: return { width: 100, height: 140, fontSize: 12 };
    }
  };

  const dims = getSize();

  const getElementColor = () => {
    const colors = {
      fire: '#FF6B6B',
      water: '#4ECDC4',
      earth: '#8B4513',
      air: '#87CEEB',
      shadow: '#4A4A4A',
      light: '#FFE66D',
    };
    return colors[card.element || 'air'];
  };

  const getRarityBorder = () => {
    const colors = {
      common: '#C0C0C0',
      rare: '#00BFFF',
      epic: '#9932CC',
      legendary: '#FFD700',
    };
    return colors[card.rarity || 'common'];
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!playable}
      style={[
        styles.card,
        { 
          width: dims.width, 
          height: dims.height,
          borderColor: getRarityBorder(),
          backgroundColor: getElementColor(),
        },
        playable && styles.playable,
      ]}
    >
      <Text style={[styles.cardName, { fontSize: dims.fontSize }]}>
        {card.name}
      </Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{card.cost}</Text>
        <Text style={styles.stat}>⚔️{card.attack}</Text>
        <Text style={styles.stat}>❤️{card.health}</Text>
      </View>
      {card.type === 'spell' && (
        <Text style={styles.spellBadge}>SORT</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 3,
    padding: 8,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  playable: {
    opacity: 1,
  },
  cardName: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#9370DB',
    color: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
});