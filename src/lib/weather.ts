export type WeatherLookupSource = "browser" | "manual";

export interface WeatherRegionOption {
  label: string;
  latitude: number;
  longitude: number;
}

export interface WeatherContext {
  locationLabel: string;
  todaySummary: string;
  tomorrowSummary: string;
  today: WeatherDaySnapshot;
  tomorrow: WeatherDaySnapshot;
}

export type WeatherIconKey =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "stormy"
  | "foggy";

export interface WeatherDaySnapshot {
  label: string;
  description: string;
  mood: string;
  minTemperature: number | null;
  maxTemperature: number | null;
  precipitationProbability: number | null;
  iconKey: WeatherIconKey;
  summary: string;
}

interface OpenMeteoDailyResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

interface WeatherLookupInput {
  latitude: number;
  longitude: number;
  locationLabel: string;
}

const weatherCodeMap: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "부분적으로 흐림",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  56: "약한 어는비",
  57: "강한 어는비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  66: "약한 어는비",
  67: "강한 어는비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  77: "진눈깨비",
  80: "소나기",
  81: "강한 소나기",
  82: "매우 강한 소나기",
  85: "약한 눈보라",
  86: "강한 눈보라",
  95: "뇌우",
  96: "약한 우박 동반 뇌우",
  99: "강한 우박 동반 뇌우",
};

export const weatherRegionOptions: WeatherRegionOption[] = [
  { label: "서울", latitude: 37.5665, longitude: 126.978 },
  { label: "부산", latitude: 35.1796, longitude: 129.0756 },
  { label: "인천", latitude: 37.4563, longitude: 126.7052 },
  { label: "대구", latitude: 35.8714, longitude: 128.6014 },
  { label: "대전", latitude: 36.3504, longitude: 127.3845 },
  { label: "광주", latitude: 35.1595, longitude: 126.8526 },
  { label: "울산", latitude: 35.5384, longitude: 129.3114 },
  { label: "제주", latitude: 33.4996, longitude: 126.5312 },
];

function getWeatherDescription(code: number | undefined) {
  if (typeof code !== "number") {
    return "알 수 없는 날씨";
  }

  return weatherCodeMap[code] ?? "변화가 있는 날씨";
}

function getWeatherIconKey(code: number | undefined): WeatherIconKey {
  if (typeof code !== "number") {
    return "cloudy";
  }

  if (code === 0 || code === 1) {
    return "sunny";
  }

  if (code === 45 || code === 48) {
    return "foggy";
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "rainy";
  }

  if (code >= 71 && code <= 86) {
    return "snowy";
  }

  if (code >= 95) {
    return "stormy";
  }

  return "cloudy";
}

function getTemperatureMood(max: number | undefined, min: number | undefined) {
  if (typeof max !== "number" || typeof min !== "number") {
    return "기온 변화가 있는 날씨";
  }

  const average = (max + min) / 2;

  if (average >= 28) {
    return "더운 날씨";
  }

  if (average >= 20) {
    return "따뜻한 날씨";
  }

  if (average >= 12) {
    return "선선한 날씨";
  }

  if (average >= 4) {
    return "쌀쌀한 날씨";
  }

  return "추운 날씨";
}

function getRainHint(precipitationProbability: number | undefined) {
  if (typeof precipitationProbability !== "number") {
    return "";
  }

  if (precipitationProbability >= 70) {
    return "비 가능성이 높습니다";
  }

  if (precipitationProbability >= 40) {
    return "비 가능성이 있습니다";
  }

  return "강수 가능성은 낮습니다";
}

function formatDailyWeatherSummary(input: {
  dayLabel: string;
  weatherCode: number | undefined;
  maxTemperature: number | undefined;
  minTemperature: number | undefined;
  precipitationProbability: number | undefined;
}) {
  const description = getWeatherDescription(input.weatherCode);
  const mood = getTemperatureMood(input.maxTemperature, input.minTemperature);
  const rainHint = getRainHint(input.precipitationProbability);
  const temperatureRange =
    typeof input.minTemperature === "number" && typeof input.maxTemperature === "number"
      ? `${Math.round(input.minTemperature)}도에서 ${Math.round(input.maxTemperature)}도 사이`
      : "기온 정보 확인이 어려움";

  return `${input.dayLabel}은 ${description}이고 ${temperatureRange}의 ${mood}입니다.${rainHint ? ` ${rainHint}.` : ""}`;
}

function buildWeatherDaySnapshot(input: {
  label: string;
  weatherCode: number | undefined;
  maxTemperature: number | undefined;
  minTemperature: number | undefined;
  precipitationProbability: number | undefined;
}): WeatherDaySnapshot {
  const description = getWeatherDescription(input.weatherCode);
  const mood = getTemperatureMood(input.maxTemperature, input.minTemperature);
  const minTemperature =
    typeof input.minTemperature === "number" ? Math.round(input.minTemperature) : null;
  const maxTemperature =
    typeof input.maxTemperature === "number" ? Math.round(input.maxTemperature) : null;
  const precipitationProbability =
    typeof input.precipitationProbability === "number"
      ? Math.round(input.precipitationProbability)
      : null;

  return {
    label: input.label,
    description,
    mood,
    minTemperature,
    maxTemperature,
    precipitationProbability,
    iconKey: getWeatherIconKey(input.weatherCode),
    summary: formatDailyWeatherSummary({
      dayLabel: input.label,
      weatherCode: input.weatherCode,
      maxTemperature: input.maxTemperature,
      minTemperature: input.minTemperature,
      precipitationProbability: input.precipitationProbability,
    }),
  };
}

function assertWeatherData(data: OpenMeteoDailyResponse) {
  const daily = data.daily;

  if (
    !daily ||
    !Array.isArray(daily.weather_code) ||
    !Array.isArray(daily.temperature_2m_max) ||
    !Array.isArray(daily.temperature_2m_min) ||
    daily.weather_code.length < 2 ||
    daily.temperature_2m_max.length < 2 ||
    daily.temperature_2m_min.length < 2
  ) {
    throw new Error("날씨 정보를 충분히 가져오지 못했습니다.");
  }

  return daily;
}

export async function fetchWeatherContext({
  latitude,
  longitude,
  locationLabel,
}: WeatherLookupInput): Promise<WeatherContext> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
    ].join(","),
  );
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("날씨 정보를 가져오지 못했습니다.");
  }

  const data = (await response.json()) as OpenMeteoDailyResponse;
  const daily = assertWeatherData(data);
  const today = buildWeatherDaySnapshot({
    label: "오늘",
    weatherCode: daily.weather_code?.[0],
    maxTemperature: daily.temperature_2m_max?.[0],
    minTemperature: daily.temperature_2m_min?.[0],
    precipitationProbability: daily.precipitation_probability_max?.[0],
  });
  const tomorrow = buildWeatherDaySnapshot({
    label: "내일",
    weatherCode: daily.weather_code?.[1],
    maxTemperature: daily.temperature_2m_max?.[1],
    minTemperature: daily.temperature_2m_min?.[1],
    precipitationProbability: daily.precipitation_probability_max?.[1],
  });

  return {
    locationLabel,
    todaySummary: today.summary,
    tomorrowSummary: tomorrow.summary,
    today,
    tomorrow,
  };
}
