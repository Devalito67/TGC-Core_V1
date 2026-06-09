// ============================================================
//  TCG CORE CONFIG — Modifie ce fichier pour personnaliser
//  ton jeu sans toucher au moteur.
// ============================================================

export const GameConfig = {
    // Mode de jeu — 'normal' | 'commander'
    GAME_MODE: 'normal' as 'normal' | 'commander',

    // Normal Like
    NORMAL: {
        DECK_MIN: 40,
        DECK_MAX: 60,
        MAX_COPIES: 4,
        STARTING_HEALTH: 30,
        STARTING_HAND: 3,
    },

    // Commander Like (1v1) — activer en V3
    COMMANDER: {
        DECK_SIZE: 99,
        MAX_COPIES: 1,        // Singleton
        STARTING_HEALTH: 40,
        STARTING_HAND: 7,
        COMMANDER_ZONE: true,
        COMMANDER_TAX: 2,     // +2 mana à chaque relance du commandant
    },

    // ── Joueurs ─────────────────────────────────────────────
    PLAYER_STARTING_HEALTH: 30,   // PV de départ
    PLAYER_MAX_HEALTH: 30,        // PV maximum (cap pour les soins)

    // ── Mana ────────────────────────────────────────────────
    MANA_START: 1,                // Mana au tour 1
    MANA_MAX: 10,                 // Mana maximum
    MANA_PER_TURN: 1,             // +X mana par tour

    // ── Deck ────────────────────────────────────────────────
    DECK_MIN_SIZE: 40,            // Taille minimum pour jouer
    DECK_MAX_SIZE: 60,            // Taille maximum
    MAX_COPIES_PER_CARD: 4,       // Exemplaires max d'une même carte

    // ── Board ───────────────────────────────────────────────
    BOARD_MAX_CARDS: 7,           // Cartes max sur le terrain

    // ── Main ────────────────────────────────────────────────
    HAND_MAX_CARDS: 10,           // Cartes max en main
    STARTING_HAND_SIZE: 6,        // Cartes piochées au début

    // ── Noms affichés ───────────────────────────────────────
    PLAYER_1_NAME: 'Joueur 1',
    PLAYER_2_NAME: 'Joueur 2',

    // ── Éléments disponibles ────────────────────────────────
    ELEMENTS: ['fire', 'water', 'earth', 'air', 'shadow', 'light'] as const,

    // ── Raretés et couleurs associées ───────────────────────
    RARITY_COLORS: {
        common: '#aaaaaa',
        rare: '#4ECDC4',
        epic: '#9B59B6',
        legendary: '#FFD700',
    } as const,

    // ── Couleurs des éléments ────────────────────────────────
    ELEMENT_COLORS: {
        fire: '#FF6B6B',
        water: '#4ECDC4',
        earth: '#8B7355',
        air: '#E8F4FD',
        shadow: '#9B59B6',
        light: '#FFD700',
    } as const,

    // ── Couleurs des types de cartes ─────────────────────────
    TYPE_COLORS: {
        minion: '#4ECDC4',
        spell: '#FF6B6B',
        weapon: '#FFD700',
    } as const,
};