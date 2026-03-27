import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const hasDestructive = buttons?.find((b) => b.style === 'destructive');
  const hasCancel = buttons?.find((b) => b.style === 'cancel');

  if (hasDestructive && hasCancel) {
    const display = message ? `${title}\n\n${message}` : title;
    if (window.confirm(display)) {
      hasDestructive.onPress?.();
    }
    return;
  }

  if (buttons && buttons.length > 0) {
    const actionBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[0];
    const display = message ? `${title}\n\n${message}` : title;
    window.alert(display);
    actionBtn.onPress?.();
    return;
  }

  const display = message ? `${title}: ${message}` : title;
  window.alert(display);
}
