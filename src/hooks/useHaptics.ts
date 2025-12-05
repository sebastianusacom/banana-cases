import { useTelegram } from './useTelegram';

export function useHaptics() {
  const { tg } = useTelegram();

  const impactLight = () => {
    tg.HapticFeedback.impactOccurred('light');
  };

  const impactMedium = () => {
    tg.HapticFeedback.impactOccurred('medium');
  };

  const impactHeavy = () => {
    tg.HapticFeedback.impactOccurred('heavy');
  };

  const notificationSuccess = () => {
    tg.HapticFeedback.notificationOccurred('success');
  };

  const notificationError = () => {
    tg.HapticFeedback.notificationOccurred('error');
  };

  const selectionChanged = () => {
    tg.HapticFeedback.selectionChanged();
  };

  const crashImpact = (multiplier: number) => {
    // Cap multiplier to avoid overly long vibration chains
    const normalized = Math.min(Math.max(multiplier, 1), 30);

    // Short rumble lead-in that scales with how high we climbed
    const rumbleCount = Math.min(3, Math.floor(normalized / 6));
    const heavyCount = 2 + Math.floor(normalized / 12); // 2-4 heavy hits
    const rumbleGap = 60;
    const heavyGap = 90;

    for (let i = 0; i < rumbleCount; i += 1) {
      setTimeout(impactMedium, i * rumbleGap);
    }

    for (let i = 0; i < heavyCount; i += 1) {
      setTimeout(impactHeavy, rumbleCount * rumbleGap + i * heavyGap);
    }

    // Finish with an error notification so the crash feels final
    setTimeout(
      notificationError,
      rumbleCount * rumbleGap + heavyCount * heavyGap + 70
    );
  };

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
    selectionChanged,
    crashImpact,
  };
}

