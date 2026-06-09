import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Player } from '../types';

interface GameOverModalProps {
  visible: boolean;
  winner: Player | null;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ 
  visible, 
  winner, 
  onRestart 
}) => {
  if (!winner) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🏆 Partie terminée!</Text>
          <Text style={styles.winnerText}>
            {winner.name} gagne!
          </Text>
          <TouchableOpacity 
            onPress={onRestart}
            style={styles.restartButton}
          >
            <Text style={styles.restartText}>🔄 Rejouer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  winnerText: {
    fontSize: 22,
    color: '#4ECDC4',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  restartButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  restartText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
});