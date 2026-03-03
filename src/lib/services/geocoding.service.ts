export interface GeocodedLocation {
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  formatted: string;
}

interface NominatimResult {
  address: {
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    ISO3166_2_lvl4?: string;
  };
}

export async function resolveLocation(query: string): Promise<GeocodedLocation | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');
    url.searchParams.set('accept-language', 'pt');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ProspectHunter/1.0 (lead-generation-app)' },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as NominatimResult[];
    if (!data.length) return null;

    const { address } = data[0];
    const city = address.city ?? address.town ?? address.municipality ?? address.village ?? query;
    const state = address.state ?? '';
    const stateCode = address.ISO3166_2_lvl4?.split('-')[1] ?? '';
    const country = address.country ?? '';
    const countryCode = (address.country_code ?? '').toUpperCase();

    return {
      city,
      state,
      stateCode,
      country,
      countryCode,
      formatted: stateCode ? `${city}, ${stateCode}` : city,
    };
  } catch {
    return null;
  }
}
