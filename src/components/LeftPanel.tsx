import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Player } from '../types';

interface LeftPanelProps {
    player: Player;
    opponent: Player;
    selectedAttackerId: string | null;
    onAttackHero: (attackerId: string) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
    player,
    opponent,
    selectedAttackerId,
    onAttackHero,
}) => {
    const handleAttackHero = () => {
        if (!selectedAttackerId) {
            Alert.alert('⚔️', "Sélectionne d'abord une de tes cartes pour attaquer !");
            return;
        }
        onAttackHero(selectedAttackerId);
    };

    return (
        <View
            style={styles.container}
        >
            <TouchableOpacity
                onPress={handleAttackHero}
                style={[
                    styles.heroAvatarContainer,
                    !!selectedAttackerId && styles.heroAvatarTargetable,
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
    );
};

const styles = StyleSheet.create({
    container: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
        paddingVertical: 20,
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
        flex: 1,
    },
});