import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player, TurnPhase } from '../types';
import { Graveyard } from './Graveyard';

interface RightPanelProps {
    player: Player;
    opponent: Player;
    turnPhase: TurnPhase;
    onEndTurn: () => void;
    onNextPhase: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
    player,
    opponent,
    turnPhase,
    onNextPhase,
    onEndTurn,
}) => {
    const isEndPhase = turnPhase === 'end';

    const handleTurnButtonPress = () => {
        if (isEndPhase) {
            onEndTurn();
        } else {
            onNextPhase();
        }
    };

    return (
        <View
            style={styles.container}
        >
            <Graveyard player={opponent} isOwn={false} />

            <TouchableOpacity style={styles.endTurnButton} onPress={handleTurnButtonPress}>
                <Text style={styles.endTurnText}>
                    {isEndPhase ? 'END\nTURN' : 'PASS'}
                </Text>
            </TouchableOpacity>

            <Graveyard player={player} isOwn />
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
});