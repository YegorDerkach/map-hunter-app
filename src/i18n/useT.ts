import { useIntl } from 'react-intl';
import type { MessageKey } from './messages';

/**
 * Returns t(id) for UI keys and t(`monster.${id}`) / t(`item.${id}`) for dynamic content.
 * For unknown keys from backend, pass fallback so we still show something.
 */
export function useT() {
  const intl = useIntl();

  const t = (id: MessageKey | string, values?: Record<string, string | number>) => {
    const msg = intl.formatMessage({ id }, values as Record<string, string | number>);
    return msg || id;
  };

  /** Translate monster name by id; falls back to nameFromBackend if key missing. */
  const tMonster = (monsterId: string, nameFromBackend?: string) => {
    const key = `monster_${monsterId}` as MessageKey;
    const translated = intl.formatMessage({ id: key });
    return translated !== key ? translated : (nameFromBackend ?? monsterId);
  };

  /** Translate item name by id; falls back to nameFromBackend if key missing. */
  const tItemName = (itemId: string, nameFromBackend?: string) => {
    const key = `item_${itemId}`.replace(/-/g, '_') as MessageKey;
    const translated = intl.formatMessage({ id: key });
    return translated !== key ? translated : (nameFromBackend ?? itemId);
  };

  /** Translate item description by id. */
  const tItemDesc = (itemId: string, descFromBackend?: string) => {
    const key = `item_${itemId}_desc`.replace(/-/g, '_') as MessageKey;
    const translated = intl.formatMessage({ id: key });
    return translated !== key ? translated : (descFromBackend ?? '');
  };

  /** Translate map marker label (chest/event) or use tMonster for monster. */
  const tMarkerLabel = (type: string, labelOrId: string, monsterId?: string) => {
    if (type === 'monster' && monsterId) return tMonster(monsterId, labelOrId);
    const camel = labelOrId.replace(/\s+/g, '').replace(/^./, (c) => c.toLowerCase());
    const key = `marker_${camel}` as MessageKey;
    const translated = intl.formatMessage({ id: key });
    return translated !== key ? translated : labelOrId;
  };

  return { t, tMonster, tItemName, tItemDesc, tMarkerLabel };
}
