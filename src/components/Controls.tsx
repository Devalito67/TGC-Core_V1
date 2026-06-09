import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ControlsProps {
  onDraw: () => void;
  onEndTurn: () => void;
  canDraw: boolean;
  canEndTurn: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
  onDraw, 
  onEndTurn, 
  canDraw, 
  canEndTurn 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onDraw}
        disabled={!canDraw}
        style={[styles.button, styles.drawButton, !canDraw && styles.disabled]}
      >
        <Text style={styles.buttonText}>🃏 Piocher</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={onEndTurn}
        disabled={!canEndTurn}
        style={[styles.button, styles.endButton, !canEndTurn && styles.disabled]}
      >
        <Text style={styles.buttonText}>⏭️ Fin du tour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  drawButton: {
    backgroundColor: '#4ECDC4',
  },
  endButton: {
    backgroundColor: '#FF6B6B',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});