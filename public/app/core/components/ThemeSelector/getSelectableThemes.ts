import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

export function getSelectableThemes() {
  const allowedExtraThemes = [];

  if (config.featureToggles.extraThemes) {
    allowedExtraThemes.push('debug');
  }

  if (config.featureToggles.grafanaconThemes) {
    allowedExtraThemes.push('desertbloom');
    allowedExtraThemes.push('gildedgrove');
    allowedExtraThemes.push('sapphiredusk');
    allowedExtraThemes.push('tron');
    allowedExtraThemes.push('gloom');


    allowedExtraThemes.push('stella');

    allowedExtraThemes.push('debug');
    allowedExtraThemes.push('aubergine');
    allowedExtraThemes.push('mars');
    allowedExtraThemes.push('matrix');
    allowedExtraThemes.push('synthwave');
    allowedExtraThemes.push('victorian');
    allowedExtraThemes.push('zen');
  }

  return getBuiltInThemes(allowedExtraThemes);
}
