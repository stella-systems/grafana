import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

export function getSelectableThemes() {
  const allowedExtraThemes = [];
  /** StellaNow customization */
  allowedExtraThemes.push('stella');
  /** StellaNow customization - END */

  if (config.featureToggles.extraThemes) {
    allowedExtraThemes.push('debug');
  }

  if (config.featureToggles.grafanaconThemes) {
    allowedExtraThemes.push('desertbloom');
    allowedExtraThemes.push('gildedgrove');
    allowedExtraThemes.push('sapphiredusk');
    allowedExtraThemes.push('tron');
    allowedExtraThemes.push('gloom');
    /** StellaNow customization */
    allowedExtraThemes.push('aubergine');
    allowedExtraThemes.push('mars');
    allowedExtraThemes.push('matrix');
    allowedExtraThemes.push('synthwave');
    allowedExtraThemes.push('victorian');
    allowedExtraThemes.push('zen');
    /** StellaNow customization - END */
  }

  return getBuiltInThemes(allowedExtraThemes);
}
