import * as ScreenOrientation from 'expo-screen-orientation';

export const lockLandscape = async () => {
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
  } catch (e) {
    console.log('Orientation lock error:', e);
  }
};

export const unlockOrientation = () =>
  ScreenOrientation.unlockAsync().catch(() => {});