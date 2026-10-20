export function getCountryInfo(code) {
  const COUNTRY_MAP = {
    GH: { name: 'Ghana', flag: '🇬🇭' },
    US: { name: 'United States', flag: '🇺🇸' },
    GB: { name: 'United Kingdom', flag: '🇬🇧' },
    CA: { name: 'Canada', flag: '🇨🇦' },
    NG: { name: 'Nigeria', flag: '🇳🇬' },
    DE: { name: 'Germany', flag: '🇩🇪' },
    JP: { name: 'Japan', flag: '🇯🇵' },
    FR: { name: 'France', flag: '🇫🇷' },
    IN: { name: 'India', flag: '🇮🇳' },
    BR: { name: 'Brazil', flag: '🇧🇷' },
  };
  const upper = (code || '').toUpperCase();
  if (COUNTRY_MAP[upper]) return COUNTRY_MAP[upper];
  if (upper.length === 2) {
    const codePoints = upper.split('').map((c) => 127397 + c.charCodeAt(0));
    try {
      return { name: upper, flag: String.fromCodePoint(...codePoints) };
    } catch { return { name: upper, flag: '🌐' }; }
  }
  return { name: upper || 'Unknown', flag: '🌐' };
}
