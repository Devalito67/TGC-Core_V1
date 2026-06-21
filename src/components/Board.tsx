import React from 'react';
import {
  View, Text, TouchableOpacity, Alert, Animated,
  StyleSheet
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { CardComponent } from './Card';
import { Card, CombatAttack, CombatBlock, Player, TurnPhase } from '../types';

interface BoardProps {
  player1: Player;
  player2: Player;
  currentPlayerIndex: 0 | 1;
  turnPhase: TurnPhase;
  // Combat state venant du store via BoardContainer
  attacks: CombatAttack[];
  blocks: CombatBlock[];
  // Sélection locale UI (géré dans Board)
  selectedAttackerId: string | null;
  selectedBlockerId: string | null;
  onSelectAttacker: (id: string | null) => void;
  onSelectBlocker: (id: string | null) => void;
  // Callbacks vers le store
  onDeclareAttack: (attack: CombatAttack) => void;
  onCancelAttack: (attackerId: string) => void;
  onDeclareBlock: (block: CombatBlock) => void;
  onCancelBlock: (blockerId: string) => void;
  // Flex animé pour le swipe
  player2Flex: Animated.Value;
  player1Flex: Animated.Value;
}

const PHASES: { key: TurnPhase; label: string }[] = [
  { key: 'main1', label: 'Main 1' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'main2', label: 'Main 2' },
  { key: 'end', label: 'End' },
];

export const Board: React.FC<BoardProps> = ({
  player1, player2, currentPlayerIndex, turnPhase,
  attacks, blocks,
  selectedAttackerId, selectedBlockerId,
  onSelectAttacker, onSelectBlocker,
  onDeclareAttack, onCancelAttack, onDeclareBlock,
  onCancelBlock, player2Flex, player1Flex,
}) => {
  // ── Qui attaque / défend ce tour ───────────────────────────────────────────
  const attackingPlayer = currentPlayerIndex === 0 ? player1 : player2;
  const defendingPlayer = currentPlayerIndex === 0 ? player2 : player1;

  // ── Helpers inchangés ──────────────────────────────────────────────────────
  const getAttackByAttacker = (id: string) => attacks.find(a => a.attackerId === id);
  const getBlockByBlocker = (id: string) => blocks.find(b => b.blockerId === id);
  const getBlockByAttacker = (id: string) => blocks.find(b => b.attackerId === id);
  const attacksOnHero = attacks.filter(a => a.targetType === 'hero');

  // ── Tap sur une carte de player1 (toujours en bas) ─────────────────────────
  const handleTapPlayer1Card = (card: Card) => {
    if (turnPhase === 'attack' && currentPlayerIndex === 0) {
      handleTapAttacker(card);
      return;
    }
    if (turnPhase === 'defense' && currentPlayerIndex === 1) {
      // player2 attaque → player1 défend → sélection bloqueur
      handleTapBlocker(card);
      return;
    }
    if (turnPhase === 'defense' && currentPlayerIndex === 0) {
      // player1 attaque → player1 est l'attaquant → taper sa carte assigne le blocage
      handleTapTarget(card);
      return;
    }
    // Phase attack : carte adverse = cible
    handleTapTarget(card);
  };

  // ── Tap sur une carte de player2 (toujours en haut) ────────────────────────
  const handleTapPlayer2Card = (card: Card) => {
    if (turnPhase === 'attack' && currentPlayerIndex === 1) {
      handleTapAttacker(card);
      return;
    }
    if (turnPhase === 'defense' && currentPlayerIndex === 0) {
      // player1 attaque → player2 défend → sélection bloqueur
      handleTapBlocker(card);
      return;
    }
    if (turnPhase === 'defense' && currentPlayerIndex === 1) {
      // player2 attaque → player2 est l'attaquant → taper sa carte assigne le blocage
      handleTapTarget(card);
      return;
    }
    // Phase attack : carte adverse = cible
    handleTapTarget(card);
  };
  // ── Logique attaquant ───────────────────────────────────────────────────────
  const handleTapAttacker = (card: Card) => {
    if (card.summoningSickness) {
      Alert.alert('⏳', "Cette carte vient d'être invoquée !");
      return;
    }
    if (card.tapped) {
      Alert.alert('⚔️', "Cette carte a déjà attaqué ce tour !");
      return;
    }
    if (selectedAttackerId === card.id) {
      onSelectAttacker(null);
      if (getAttackByAttacker(card.id)) onCancelAttack(card.id);
      return;
    }
    onSelectAttacker(card.id);
  };

  // ── Logique bloqueur ────────────────────────────────────────────────────────
  const handleTapBlocker = (card: Card) => {
    const alreadyBlocking = getBlockByBlocker(card.id);
    if (alreadyBlocking) { onCancelBlock(card.id); return; }
    if (selectedBlockerId === card.id) { onSelectBlocker(null); return; }
    onSelectBlocker(card.id);
  };

  // ── Logique cible adverse ───────────────────────────────────────────────────
  const handleTapTarget = (card: Card) => {
    if (turnPhase === 'attack' && selectedAttackerId) {
      onDeclareAttack({ attackerId: selectedAttackerId, targetType: 'unit', targetId: card.id });
      onSelectAttacker(null);
      return;
    }
    if (turnPhase === 'defense' && selectedBlockerId) {
      const isAttackingHero = attacks.some(
        a => a.attackerId === card.id && a.targetType === 'hero'
      );
      if (!isAttackingHero) {
        Alert.alert('🛡️', "Cette carte n'attaque pas le héros !");
        return;
      }
      onDeclareBlock({ attackerId: card.id, blockerId: selectedBlockerId });
      onSelectBlocker(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderCard = (card: Card, onTap: (card: Card) => void) => {
    const attack = getAttackByAttacker(card.id);
    const blocking = getBlockByBlocker(card.id);
    const isAttacker = attacks.some(a => a.attackerId === card.id);
    const attackerAttack = attacks.find(a => a.attackerId === card.id);
    const isTargetedByAttack = attacks.some(a => a.targetId === card.id);
    const blocked = getBlockByAttacker(card.id);
    const isSelAttacker = selectedAttackerId === card.id;
    const isSelBlocker = selectedBlockerId === card.id;
    const isTargetable =
      (turnPhase === 'attack' && !!selectedAttackerId) ||
      (turnPhase === 'defense' && !!selectedBlockerId &&
        attacks.some(a => a.attackerId === card.id && a.targetType === 'hero'));

    return (
      <TouchableOpacity
        key={card.id}
        onPress={() => onTap(card)}
        style={[
          styles.cardSlot,
          card.tapped && styles.tapped,
          isAttacker && styles.tapped,       // attaquant déclaré = visuellement tapped
          card.summoningSickness && styles.sick,
          isSelAttacker && styles.selected,
          isSelBlocker && styles.selectedBlocker,
          !!attack && styles.declared,
          !!blocking && styles.blocking,
          isTargetable && styles.targetable,
          isTargetedByAttack && styles.targeted,
          !!blocked && styles.blocked,
        ]}
      >
        <CardComponent card={card} size="small" />
        {card.summoningSickness && <View style={styles.badge}><Text style={styles.badgeText}>⏳</Text></View>}
        {!!attack && <View style={styles.badge}><Text style={styles.badgeText}>{attack.targetType === 'hero' ? '💥' : '⚔️'}</Text></View>}
        {isAttacker && !attack && <View style={styles.badge}><Text style={styles.badgeText}>{attackerAttack?.targetType === 'hero' ? '💥' : '⚔️'}</Text></View>}
        {isSelAttacker && !attack && <View style={styles.badge}><Text style={styles.badgeText}>⚔️</Text></View>}
        {isSelBlocker && <View style={styles.badge}><Text style={styles.badgeText}>🛡️</Text></View>}
        {!!blocking && !isSelBlocker && <View style={styles.badge}><Text style={styles.badgeText}>🛡️</Text></View>}
        {isTargetedByAttack && !blocked && <View style={styles.badge}><Text style={styles.badgeText}>⚔️</Text></View>}
        {!!blocked && <View style={styles.badge}><Text style={styles.badgeText}>🛡️</Text></View>}
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>

      {/* Plateau adverse */}
      <Animated.View style={[styles.boardZone, { flex: player2Flex }]}>
        {player2.board.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Empty Battlefield</Text></View>
        ) : (
          <FlatList
            horizontal
            data={player2.board}
            keyExtractor={c => c.id}
            renderItem={({ item: card }) => renderCard(card, handleTapPlayer2Card)}
            contentContainerStyle={styles.scroll}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Barre de phases */}
      <View style={styles.phaseBar}>
        {PHASES.map((p, i) => (
          <React.Fragment key={p.key}>
            <View style={[styles.phaseStep, turnPhase === p.key && styles.phaseStepActive]}>
              <Text style={[styles.phaseText, turnPhase === p.key && styles.phaseTextActive]}>
                {p.label}
              </Text>
            </View>
            {i < PHASES.length - 1 && (
              <View style={[styles.phaseConnector, turnPhase === p.key && styles.phaseConnectorActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Hint défense */}
      {turnPhase === 'defense' && attacksOnHero.length > 0 && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>
            {attacksOnHero.length} attaque(s) vers le héros
            {selectedBlockerId ? ' — Tape un attaquant adverse pour bloquer' : ' — Sélectionne un défenseur'}
          </Text>
        </View>
      )}

      {/* Plateau joueur */}
      <Animated.View style={[styles.boardZone, { flex: player1Flex }]}>
        {player1.board.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Deploy cards to the Rift</Text></View>
        ) : (
          <FlatList
            horizontal
            data={player1.board}
            keyExtractor={c => c.id}
            renderItem={({ item: card }) => renderCard(card, handleTapPlayer1Card)}
            contentContainerStyle={styles.scroll}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Overlay hint attack */}
      {selectedAttackerId && turnPhase === 'attack' && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>Sélectionne une cible ou tape le héros adverse</Text>
        </View>
      )}

      {/* Résumé attaques déclarées */}
      {turnPhase === 'attack' && attacks.length > 0 && !selectedAttackerId && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>{attacks.length} attaque(s) déclarée(s) — Confirme ou continue</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0e11' },
  boardZone: { justifyContent: 'center' as const },
  scroll: { alignItems: 'center' as const, gap: 12, paddingHorizontal: 20 },
  empty: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  emptyText: { color: 'rgba(255,255,255,0.1)', fontStyle: 'italic' as const, fontSize: 12 },
  cardSlot: { padding: 2, borderRadius: 6 },
  tapped: { opacity: 0.5, transform: [{ rotate: '15deg' }] },
  sick: { opacity: 0.45 },
  selected: { borderWidth: 2, borderColor: '#d4af37', borderRadius: 6, transform: [{ scale: 1.1 }] },
  selectedBlocker: { borderWidth: 2, borderColor: '#4ECDC4', borderRadius: 6, transform: [{ scale: 1.1 }] },
  declared: { borderWidth: 2, borderColor: '#FF6B6B', borderRadius: 6 },
  blocking: { borderWidth: 2, borderColor: '#4ECDC4', borderRadius: 6 },
  targetable: { borderWidth: 2, borderColor: '#FF6B6B', borderRadius: 6 },
  targeted: { borderWidth: 2, borderColor: '#FF6B6B', borderRadius: 6, opacity: 0.8 },
  blocked: { borderWidth: 2, borderColor: '#4ECDC4', borderRadius: 6 },
  badge: { position: 'absolute' as const, top: -10, right: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1a1c1f', justifyContent: 'center' as const, alignItems: 'center' as const },
  badgeText: { fontSize: 11 },
  phaseBar: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, height: 56, paddingHorizontal: 8 },
  phaseStep: { minWidth: 62, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.14)', alignItems: 'center' as const },
  phaseStepActive: { backgroundColor: 'rgba(212,175,55,0.18)', borderColor: '#d4af37' },
  phaseText: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700' as const },
  phaseTextActive: { color: '#d4af37', fontWeight: '900' as const },
  phaseConnector: { flex: 1, maxWidth: 26, height: 2, marginHorizontal: 4, backgroundColor: 'rgba(212,175,55,0.12)' },
  phaseConnectorActive: { backgroundColor: 'rgba(212,175,55,0.3)' },
  hint: { marginVertical: 4, alignItems: 'center' as const },
  hintText: { color: '#d4af37', fontSize: 11, fontWeight: '600' as const },
  overlay: { position: 'absolute' as const, top: 50, left: '15%', right: '15%', backgroundColor: 'rgba(212,175,55,0.9)', paddingVertical: 6, borderRadius: 16, alignItems: 'center' as const },
  overlayText: { color: '#111316', fontWeight: 'bold' as const, fontSize: 11 },
  confirmRow: { position: 'absolute', bottom: 8, alignSelf: 'center', zIndex: 50 },
  btn: { backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderColor: '#d4af37', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  btnEmpty: { opacity: 0.5 },
  btnText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' as const },
});