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

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
    selectionChanged,
  };
}

