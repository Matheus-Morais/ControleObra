import { Linking } from 'react-native';

import { formatCurrency } from './format';

interface ShareItemParams {
  name: string;
  brand?: string | null;
  price?: number | null;
  store?: string | null;
  url?: string | null;
}

export async function shareViaWhatsApp(item: ShareItemParams): Promise<void> {
  let message = `🏠 *ControleObra*\n\n`;
  message += `📦 *${item.name}*\n`;
  if (item.brand) message += `🏷️ Marca: ${item.brand}\n`;
  if (item.price) message += `💰 Preço: ${formatCurrency(item.price)}\n`;
  if (item.store) message += `🏪 Loja: ${item.store}\n`;
  if (item.url) message += `🔗 Link: ${item.url}\n`;

  const encoded = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;

  const canOpen = await Linking.canOpenURL(whatsappUrl);
  if (canOpen) {
    await Linking.openURL(whatsappUrl);
  }
}
