import { t } from '../../i18n/index.js';

export const jr = w => w.ja ? (w.jaRare ? t('word.rare_reading', { r: w.ja }) : w.ja) : '';
export const kr = w => w.ko ? (w.koRare ? t('word.rare_reading', { r: w.ko }) : w.ko) : '';
