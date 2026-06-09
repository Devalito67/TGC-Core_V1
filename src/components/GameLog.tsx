import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface GameLogProps {
  logs: string[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Journal de jeu</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.log}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  logContainer: {
    maxHeight: 100,
  },
  log: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 3,
  },
});