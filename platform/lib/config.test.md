```javascript
const config = require('./config');

describe('config', () => {
  // We use the regular project podspec for testing as long as we only use attributes that are not likely to change
  it('Should build a grow podspec with languages, but without filter', () => {
    const podSpec = config.buildGrowPodSpec();

    expect(podSpec.localization.default_locale).toBe('en');

    const allLocales = podSpec.localization.locales;
    expect(allLocales.includes('en')).toBe(true);
    expect(allLocales.includes('es')).toBe(true);
    expect(allLocales.includes('fr')).toBe(true);

    expect(podSpec.deployments.default.filters).toBeUndefined();
  });

  it('Should build a grow podspec with languages and filters', () => {
    const podSpec = config.buildGrowPodSpec({locales: 'en,es'});

    const allLocales = podSpec.localization.locales;
    expect(allLocales.includes('en')).toBe(true);
    expect(allLocales.includes('es')).toBe(true);
    expect(allLocales.includes('fr')).toBe(true);

    expect(podSpec.deployments.default.filters.type).toBe('denylist');

    const filteredlocales = podSpec.deployments.default.filters.locales;
    expect(filteredlocales.includes('en')).toBe(false);
    expect(filteredlocales.includes('es')).toBe(false);
    expect(filteredlocales.includes('fr')).toBe(true);
  });
});
```