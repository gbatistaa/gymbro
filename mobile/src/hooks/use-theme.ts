/**
 * Palette do template do Expo. O app é escuro apenas, então não há alternância de esquema.
 *
 * // task 7: este hook e os componentes que o consomem são removidos com o resto do template.
 */

import { LegacyColors } from '@/constants/theme';

export function useTheme() {
  return LegacyColors;
}
