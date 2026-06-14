import { Dimensions } from 'react-native';

// Ratio poker standard : 2.5" × 3.5" → 1 : 1.4
const POKER_RATIO = 1.4;

/**
 * Dimensions de la carte en mode preview (grande, plein écran)
 * Prend le petit côté de l'écran comme référence (compatible paysage et portrait)
 */
export const getPreviewCardDimensions = (heightPercent = 0.75) => {
  const { width, height } = Dimensions.get('window');
  const cardHeight = Math.min(width, height) * heightPercent;
  const cardWidth = cardHeight / POKER_RATIO;
  return { cardWidth, cardHeight };
};

/**
 * Dimensions de la carte en mode main (petite, dans le ScrollView)
 * Prend le petit côté de l'écran comme référence
 */
export const getHandCardDimensions = (heightPercent = 0.16) => {
  const { width, height } = Dimensions.get('window');
  const cardHeight = Math.min(width, height) * heightPercent;
  const cardWidth = cardHeight / POKER_RATIO;
  return { cardWidth, cardHeight };
};