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
    onLayout: (width: number) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
    player,
    opponent,
    turnPhase,
    onNextPhase,
    onEndTurn,
    onLayout,
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
            onLayout={(e) => onLayout(e.nativeEvent.layout.width)}
        >
            <View style={styles.sidebarRight}>
                <Graveyard player={opponent} isOwn={false} />

                <TouchableOpacity style={styles.endTurnButton} onPress={handleTurnButtonPress}>
                    <Text style={styles.endTurnText}>
                        {isEndPhase ? 'END\nTURN' : 'PASS'}
                    </Text>
                </TouchableOpacity>

                <Graveyard player={player} isOwn />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    sidebarRight: {
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