// Mirrors App\Services\WeightStatisticsService so the live preview matches what the server stores.

export const DEFAULT_UNIFORMITY_BAND = 10;
export const UNIFORMITY_BANDS = [5, 10, 15] as const;

export type WeightStats = {
  count: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  stdDev: number | null;
  cvPercent: number | null;
  uniformityPercent: number | null;
  birdsWithinBand: number;
  bandPercent: number;
  bandLow: number | null;
  bandHigh: number | null;
  target: number | null;
  deviationG: number | null;
  deviationPercent: number | null;
};

const round = (value: number, dp: number) => {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
};

const medianOf = (sorted: number[]) => {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export function computeWeightStats(
  weightsG: number[],
  targetG: number | null = null,
  bandPercent: number = DEFAULT_UNIFORMITY_BAND
): WeightStats {
  const weights = weightsG.map(Number).filter((w) => Number.isFinite(w) && w > 0).sort((a, b) => a - b);
  const count = weights.length;
  const target = targetG && targetG > 0 ? targetG : null;

  if (count === 0) {
    return {
      count: 0, mean: null, median: null, min: null, max: null, stdDev: null, cvPercent: null,
      uniformityPercent: null, birdsWithinBand: 0, bandPercent, bandLow: null, bandHigh: null,
      target, deviationG: null, deviationPercent: null,
    };
  }

  const mean = weights.reduce((a, b) => a + b, 0) / count;
  const median = medianOf(weights);
  const stdDev = count > 1
    ? Math.sqrt(weights.reduce((acc, w) => acc + (w - mean) ** 2, 0) / (count - 1))
    : 0;
  const bandLow = mean * (1 - bandPercent / 100);
  const bandHigh = mean * (1 + bandPercent / 100);
  const within = weights.filter((w) => w >= bandLow && w <= bandHigh).length;
  const deviationG = target ? mean - target : null;

  return {
    count,
    mean: round(mean, 1),
    median: round(median, 1),
    min: round(weights[0], 1),
    max: round(weights[count - 1], 1),
    stdDev: round(stdDev, 2),
    cvPercent: mean > 0 ? round((stdDev / mean) * 100, 2) : null,
    uniformityPercent: round((within / count) * 100, 2),
    birdsWithinBand: within,
    bandPercent,
    bandLow: round(bandLow, 1),
    bandHigh: round(bandHigh, 1),
    target,
    deviationG: deviationG !== null ? round(deviationG, 1) : null,
    deviationPercent: deviationG !== null && target ? round((deviationG / target) * 100, 2) : null,
  };
}

const RANGE_TO_SD: Array<[number, number]> = [
  [2, 1.128], [3, 1.693], [4, 2.059], [5, 2.326], [6, 2.534], [7, 2.704], [8, 2.847],
  [9, 2.97], [10, 3.078], [15, 3.472], [20, 3.735], [25, 3.931], [30, 4.086],
  [40, 4.322], [50, 4.498], [75, 4.806], [100, 5.015], [150, 5.296], [200, 5.492],
  [300, 5.756], [500, 6.073], [1000, 6.483],
]

const rangeToSd = (n: number) => {
  if (n <= RANGE_TO_SD[0][0]) return RANGE_TO_SD[0][1]
  for (let i = 1; i < RANGE_TO_SD.length; i++) {
    const [k, v] = RANGE_TO_SD[i]
    if (n <= k) {
      const [pk, pv] = RANGE_TO_SD[i - 1]
      return pv + ((n - pk) / (k - pk)) * (v - pv)
    }
  }
  return RANGE_TO_SD[RANGE_TO_SD.length - 1][1]
}

// Abramowitz & Stegun 7.1.26
const erf = (x: number) => {
  const sign = x < 0 ? -1 : 1
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return sign * y
}

export type SummaryUniformity = {
  stdDev: number | null
  cvPercent: number | null
  uniformityPercent: number | null
  birdsWithinBand: number | null
  method: 'counted' | 'estimated' | null
}

/** Mirrors WeightStatisticsService::estimateFromSummary. */
export function estimateUniformityFromSummary(
  averageG: number | null,
  minG: number | null,
  maxG: number | null,
  sampleSize: number | null,
  bandPercent: number = DEFAULT_UNIFORMITY_BAND,
  countedWithinBand: number | null = null
): SummaryUniformity {
  const none: SummaryUniformity = { stdDev: null, cvPercent: null, uniformityPercent: null, birdsWithinBand: null, method: null }
  if (!averageG || averageG <= 0 || !sampleSize || sampleSize < 2) return none

  let stdDev: number | null = null
  let cv: number | null = null
  if (minG && maxG && minG > 0 && maxG >= minG && averageG >= minG && averageG <= maxG) {
    stdDev = (maxG - minG) / rangeToSd(sampleSize)
    cv = (stdDev / averageG) * 100
  }

  if (countedWithinBand !== null && countedWithinBand >= 0 && countedWithinBand <= sampleSize) {
    return {
      stdDev: stdDev !== null ? round(stdDev, 2) : null,
      cvPercent: cv !== null ? round(cv, 2) : null,
      uniformityPercent: round((countedWithinBand / sampleSize) * 100, 2),
      birdsWithinBand: countedWithinBand,
      method: 'counted',
    }
  }
  if (stdDev === null || cv === null) return none

  const u = stdDev <= 0 ? 100 : erf(((bandPercent / 100) * averageG) / (stdDev * Math.SQRT2)) * 100
  const clamped = Math.min(100, Math.max(0, u))
  return {
    stdDev: round(stdDev, 2),
    cvPercent: round(cv, 2),
    uniformityPercent: round(clamped, 2),
    birdsWithinBand: Math.round((clamped / 100) * sampleSize),
    method: 'estimated',
  }
}

export const UNIFORMITY_METHOD_LABELS: Record<string, string> = {
  measured: 'Measured from individual weights',
  counted: 'Counted on farm',
  estimated: 'Estimated from min/max range',
}

/** More than 3 SD from the mean, or outside 50–200% of the median. Same order as input. */
export function outlierFlags(weightsG: number[]): boolean[] {
  const valid = weightsG.filter((w) => Number.isFinite(w) && w > 0);
  if (valid.length < 3) return weightsG.map((w) => !(Number.isFinite(w) && w > 0));

  const s = computeWeightStats(valid);
  const mean = s.mean ?? 0;
  const sd = s.stdDev ?? 0;
  const median = s.median ?? 0;

  return weightsG.map((w) => {
    if (!Number.isFinite(w) || w <= 0) return true;
    if (sd > 0 && Math.abs(w - mean) > 3 * sd) return true;
    return median > 0 && (w < 0.5 * median || w > 2 * median);
  });
}

export type UniformityGrade = 'good' | 'fair' | 'poor';

export function uniformityGrade(percent: number | null | undefined): UniformityGrade | null {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) return null;
  if (percent >= 80) return 'good';
  if (percent >= 70) return 'fair';
  return 'poor';
}

export const UNIFORMITY_GRADE_STYLES: Record<UniformityGrade, { label: string; text: string; badge: string }> = {
  good: { label: 'Good', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  fair: { label: 'Fair', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  poor: { label: 'Poor', text: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-200' },
};

/** CV ≤ 8% is excellent flock evenness, 8–10% acceptable, > 10% uneven. */
export function cvGrade(cv: number | null | undefined): UniformityGrade | null {
  if (cv === null || cv === undefined || !Number.isFinite(cv)) return null;
  if (cv <= 8) return 'good';
  if (cv <= 10) return 'fair';
  return 'poor';
}

export type HistogramBin = { label: string; from: number; to: number; count: number; inBand: boolean };

export function weightHistogram(weightsG: number[], bandLow: number | null, bandHigh: number | null, binCount = 12): HistogramBin[] {
  const weights = weightsG.filter((w) => Number.isFinite(w) && w > 0);
  if (weights.length === 0) return [];
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  if (min === max) {
    return [{ label: `${Math.round(min)}`, from: min, to: max, count: weights.length, inBand: true }];
  }

  const rawWidth = (max - min) / binCount;
  const width = Math.max(1, Math.ceil(rawWidth / 5) * 5);
  const start = Math.floor(min / width) * width;
  const bins: HistogramBin[] = [];
  for (let from = start; from <= max; from += width) {
    const to = from + width;
    const mid = from + width / 2;
    bins.push({
      label: `${from}–${to}`,
      from,
      to,
      count: 0,
      inBand: bandLow !== null && bandHigh !== null && mid >= bandLow && mid <= bandHigh,
    });
  }
  for (const w of weights) {
    const idx = Math.min(bins.length - 1, Math.floor((w - start) / width));
    bins[idx].count += 1;
  }
  return bins;
}

/** Parse pasted text (one per line, comma/space/tab separated) into weights. Values < 20 are treated as kg. */
export function parseWeightText(text: string, unit: 'g' | 'kg' | 'auto' = 'auto'): number[] {
  const nums = (text.match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((t) => Number(t.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return [];

  let isKg = unit === 'kg';
  if (unit === 'auto') {
    const sorted = [...nums].sort((a, b) => a - b);
    isKg = medianOf(sorted) < 20;
  }
  return nums.map((n) => (isKg ? round(n * 1000, 1) : round(n, 1)));
}

export const formatGrams = (g: number | null | undefined, dp = 0) =>
  g === null || g === undefined || !Number.isFinite(g) ? '—' : `${g.toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: dp })} g`;

export const WEIGHING_METHOD_LABELS: Record<string, string> = {
  manual_scale: 'Manual digital scale',
  hanging_scale: 'Hanging / spring scale',
  platform_auto: 'Automatic platform scale',
  crate: 'Crate (group) weighing',
};

export const DATA_SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  ai_image: 'AI (image)',
  ai_file: 'AI (file)',
  summary_only: 'Summary',
};

export const SEX_LABELS: Record<string, string> = {
  mixed: 'Mixed',
  male: 'Male',
  female: 'Female',
};
