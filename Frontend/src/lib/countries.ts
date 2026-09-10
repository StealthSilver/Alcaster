export type LatLng = [number, number];
export type CountryBounds = [LatLng, LatLng];

export type CountryView = {
  name: string;
  center: LatLng;
  zoom: number;
  bounds: CountryBounds;
};

const COUNTRY_VIEWS: CountryView[] = [
  {
    name: "India",
    center: [22.35, 79],
    zoom: 5,
    bounds: [
      [6.75, 68.1],
      [35.5, 97.4],
    ],
  },
  {
    name: "United States",
    center: [39.8, -98.6],
    zoom: 4,
    bounds: [
      [24.5, -125],
      [49.4, -66.9],
    ],
  },
  {
    name: "United Kingdom",
    center: [54.2, -2.5],
    zoom: 6,
    bounds: [
      [49.8, -8.7],
      [58.7, 1.8],
    ],
  },
  {
    name: "Germany",
    center: [51.2, 10.4],
    zoom: 6,
    bounds: [
      [47.3, 5.9],
      [55.1, 15.0],
    ],
  },
  {
    name: "Australia",
    center: [-25.3, 133.8],
    zoom: 4,
    bounds: [
      [-43.6, 113.3],
      [-10.7, 153.6],
    ],
  },
  {
    name: "Brazil",
    center: [-14.2, -51.9],
    zoom: 4,
    bounds: [
      [-33.7, -73.9],
      [5.3, -34.8],
    ],
  },
  {
    name: "South Africa",
    center: [-28.5, 24.7],
    zoom: 5,
    bounds: [
      [-34.8, 16.5],
      [-22.1, 32.9],
    ],
  },
  {
    name: "United Arab Emirates",
    center: [24.3, 54.3],
    zoom: 7,
    bounds: [
      [22.6, 51.5],
      [26.1, 56.4],
    ],
  },
  {
    name: "Saudi Arabia",
    center: [23.9, 45.1],
    zoom: 5,
    bounds: [
      [16.3, 34.5],
      [32.2, 55.7],
    ],
  },
  {
    name: "Spain",
    center: [40.2, -3.7],
    zoom: 6,
    bounds: [
      [36.0, -9.3],
      [43.8, 3.3],
    ],
  },
  {
    name: "France",
    center: [46.6, 2.3],
    zoom: 6,
    bounds: [
      [41.3, -5.1],
      [51.1, 9.6],
    ],
  },
  {
    name: "China",
    center: [35.9, 104.2],
    zoom: 4,
    bounds: [
      [18.2, 73.5],
      [53.6, 134.8],
    ],
  },
  {
    name: "Japan",
    center: [36.2, 138.3],
    zoom: 5,
    bounds: [
      [30.2, 129.3],
      [45.5, 145.8],
    ],
  },
  {
    name: "Mexico",
    center: [23.6, -102.5],
    zoom: 5,
    bounds: [
      [14.5, -117.1],
      [32.7, -86.7],
    ],
  },
  {
    name: "Canada",
    center: [56.1, -96.8],
    zoom: 4,
    bounds: [
      [41.7, -141],
      [83.1, -52.6],
    ],
  },
  {
    name: "Chile",
    center: [-35.7, -71.5],
    zoom: 4,
    bounds: [
      [-55.9, -75.6],
      [-17.5, -66.4],
    ],
  },
  {
    name: "Morocco",
    center: [31.8, -7.1],
    zoom: 6,
    bounds: [
      [21.4, -13.2],
      [35.9, -1.0],
    ],
  },
  {
    name: "Egypt",
    center: [26.8, 30.8],
    zoom: 6,
    bounds: [
      [22.0, 24.7],
      [31.7, 36.9],
    ],
  },
  {
    name: "Turkey",
    center: [39.0, 35.2],
    zoom: 6,
    bounds: [
      [36.0, 26.0],
      [42.1, 44.8],
    ],
  },
  {
    name: "Italy",
    center: [42.5, 12.6],
    zoom: 6,
    bounds: [
      [36.6, 6.6],
      [47.1, 18.5],
    ],
  },
  {
    name: "Vietnam",
    center: [16.0, 107.0],
    zoom: 5,
    bounds: [
      [8.4, 102.1],
      [23.4, 109.5],
    ],
  },
  {
    name: "Philippines",
    center: [12.9, 121.8],
    zoom: 6,
    bounds: [
      [4.6, 116.9],
      [21.1, 126.6],
    ],
  },
  {
    name: "Indonesia",
    center: [-2.5, 118.0],
    zoom: 5,
    bounds: [
      [-11.0, 95.0],
      [6.0, 141.0],
    ],
  },
  {
    name: "Pakistan",
    center: [30.4, 69.3],
    zoom: 5,
    bounds: [
      [23.7, 60.9],
      [37.1, 77.8],
    ],
  },
  {
    name: "Bangladesh",
    center: [23.7, 90.3],
    zoom: 7,
    bounds: [
      [20.7, 88.0],
      [26.6, 92.7],
    ],
  },
  {
    name: "Sri Lanka",
    center: [7.9, 80.7],
    zoom: 7,
    bounds: [
      [5.9, 79.6],
      [9.8, 81.9],
    ],
  },
  {
    name: "Nepal",
    center: [28.4, 84.1],
    zoom: 7,
    bounds: [
      [26.3, 80.0],
      [30.4, 88.2],
    ],
  },
];

const COUNTRY_ALIASES: Record<string, string> = {
  india: "India",
  bharat: "India",
  "united states": "United States",
  "united states of america": "United States",
  usa: "United States",
  us: "United States",
  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  deutschland: "Germany",
  germany: "Germany",
  australia: "Australia",
  brasil: "Brazil",
  brazil: "Brazil",
  "south africa": "South Africa",
  rsa: "South Africa",
  "united arab emirates": "United Arab Emirates",
  uae: "United Arab Emirates",
  "saudi arabia": "Saudi Arabia",
  ksa: "Saudi Arabia",
  spain: "Spain",
  espana: "Spain",
  france: "France",
  china: "China",
  prc: "China",
  japan: "Japan",
  mexico: "Mexico",
  canada: "Canada",
  chile: "Chile",
  morocco: "Morocco",
  egypt: "Egypt",
  turkey: "Turkey",
  turkiye: "Turkey",
  italy: "Italy",
  vietnam: "Vietnam",
  philippines: "Philippines",
  indonesia: "Indonesia",
  pakistan: "Pakistan",
  bangladesh: "Bangladesh",
  "sri lanka": "Sri Lanka",
  nepal: "Nepal",
};

const REGION_COUNTRY: Record<string, string> = {
  karnataka: "India",
  rajasthan: "India",
  gujarat: "India",
  "tamil nadu": "India",
  maharashtra: "India",
  "andhra pradesh": "India",
  telangana: "India",
  "madhya pradesh": "India",
  "uttar pradesh": "India",
  "west bengal": "India",
  odisha: "India",
  orissa: "India",
  punjab: "India",
  haryana: "India",
  "himachal pradesh": "India",
  kerala: "India",
  goa: "India",
  bihar: "India",
  jharkhand: "India",
  chhattisgarh: "India",
  assam: "India",
  ladakh: "India",
  "jammu and kashmir": "India",
  uttarakhand: "India",
  sikkim: "India",
  delhi: "India",
  "new delhi": "India",
  puducherry: "India",
  chandigarh: "India",
};

const UNKNOWN_COUNTRY = "Unknown";

const REGION_CENTROIDS: Record<string, LatLng> = {
  "andhra pradesh": [15.9129, 79.74],
  assam: [26.2006, 92.9376],
  bihar: [25.0961, 85.3131],
  chhattisgarh: [21.2787, 81.8661],
  goa: [15.2993, 74.124],
  gujarat: [22.2587, 71.1924],
  haryana: [29.0588, 76.0856],
  "himachal pradesh": [31.1048, 77.1734],
  jharkhand: [23.6102, 85.2799],
  karnataka: [15.3173, 75.7139],
  kerala: [10.8505, 76.2711],
  "madhya pradesh": [22.9734, 78.6569],
  maharashtra: [19.7515, 75.7139],
  odisha: [20.9517, 85.0985],
  orissa: [20.9517, 85.0985],
  punjab: [31.1471, 75.3412],
  rajasthan: [27.0238, 74.2179],
  "tamil nadu": [11.1271, 78.6569],
  telangana: [18.1124, 79.0193],
  "uttar pradesh": [26.8467, 80.9462],
  uttarakhand: [30.0668, 79.0193],
  "west bengal": [22.9868, 87.855],
  delhi: [28.6139, 77.209],
  "new delhi": [28.6139, 77.209],
  "jammu and kashmir": [33.7782, 76.5762],
  ladakh: [34.2268, 77.5619],
  chandigarh: [30.7333, 76.7794],
};

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getCountryView(name: string): CountryView | null {
  return COUNTRY_VIEWS.find((country) => country.name === name) ?? null;
}

export function countryFromAddress(address: string): string | null {
  const parts = address
    .split(",")
    .map((part) => normalizeToken(part))
    .filter(Boolean);
  if (parts.length === 0) return null;

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const token = parts[index];
    const country = COUNTRY_ALIASES[token] ?? REGION_COUNTRY[token];
    if (country) return country;
  }

  const last = parts[parts.length - 1];
  if (last.length >= 3 && !/\d/.test(last)) return titleCase(last);
  return null;
}

export function countryFromCoordinates(latitude: number, longitude: number) {
  let match: CountryView | null = null;
  let area = Number.POSITIVE_INFINITY;

  for (const country of COUNTRY_VIEWS) {
    const [[south, west], [north, east]] = country.bounds;
    if (
      latitude >= south &&
      latitude <= north &&
      longitude >= west &&
      longitude <= east
    ) {
      const nextArea = (north - south) * (east - west);
      if (nextArea < area) {
        match = country;
        area = nextArea;
      }
    }
  }

  return match?.name ?? null;
}

export function countryForLocation(
  address: string,
  latitude: number,
  longitude: number,
) {
  return (
    countryFromAddress(address) ??
    countryFromCoordinates(latitude, longitude) ??
    UNKNOWN_COUNTRY
  );
}

export function formatCoordinate(value: number) {
  return value.toFixed(4);
}

export function hasStoredCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
}

export function coordinatesFromAddress(address: string): LatLng | null {
  const parts = address
    .split(",")
    .map((part) => normalizeToken(part))
    .filter(Boolean);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const token = parts[index];
    const region = REGION_CENTROIDS[token];
    if (region) return region;
    const countryName = COUNTRY_ALIASES[token] ?? REGION_COUNTRY[token];
    const view = countryName ? getCountryView(countryName) : null;
    if (view) return view.center;
  }

  return null;
}

export function resolveSiteCoordinates(
  address: string,
  latitude: number,
  longitude: number,
): { latitude: number; longitude: number; approximate: boolean } | null {
  if (hasStoredCoordinates(latitude, longitude)) {
    return { latitude, longitude, approximate: false };
  }

  const fromAddress = coordinatesFromAddress(address);
  if (fromAddress) {
    return {
      latitude: fromAddress[0],
      longitude: fromAddress[1],
      approximate: true,
    };
  }

  return null;
}
