import type { RandomProfile, SendPayload } from '../types/models';

const triangular = (min: number, max: number): number => {
  const r = Math.random();
  if (r < 0.5) {
    return min + Math.sqrt(r * (max - min) * (max - min) / 2);
  }
  return max - Math.sqrt((1 - r) * (max - min) * (max - min) / 2);
};

const uniform = (min: number, max: number): number => min + Math.random() * (max - min);

const roundCfg = (value: number) => Math.round(value * 10) / 10;

const clampRange = (range: { min: number; max: number }) => {
  const min = Math.min(range.min, range.max);
  const max = Math.max(range.min, range.max);
  return { min, max };
};

export const DEFAULT_RANDOM_PROFILES: Record<string, RandomProfile> = {
  strict: {
    cfg: { min: 5.5, max: 9.0 },
    steps: { min: 24, max: 40 },
    samplerPool: ['k_euler', 'dpmpp_2m'],
    resolutions: [
      { w: 832, h: 1216 },
      { w: 1024, h: 1024 },
      { w: 1216, h: 832 }
    ],
    distribution: 'triangular',
    label: 'Strict',
    description: 'Narrow ranges with center weighting.'
  },
  creative: {
    cfg: { min: 3, max: 12 },
    steps: { min: 20, max: 60 },
    samplerPool: ['k_euler', 'k_euler_a', 'dpmpp_2m', 'dpmpp_2m_sde', 'ddim'],
    resolutions: [
      { w: 768, h: 1152 },
      { w: 896, h: 1152 },
      { w: 1024, h: 1024 },
      { w: 1216, h: 832 }
    ],
    distribution: 'uniform',
    label: 'Creative',
    description: 'Broader ranges for experimentation.'
  },
  wildcard: {
    cfg: { min: 2, max: 14 },
    steps: { min: 12, max: 80 },
    samplerPool: [
      'k_euler',
      'k_euler_a',
      'dpmpp_2m',
      'dpmpp_2m_sde',
      'ddim',
      'heun',
      'plms'
    ],
    resolutions: [
      { w: 640, h: 1536 },
      { w: 768, h: 1344 },
      { w: 896, h: 1152 },
      { w: 1344, h: 768 }
    ],
    distribution: 'uniform',
    label: 'Wildcard',
    description: 'Widest ranges and playful choices.'
  }
};

export function randomizeFromProfile(profile: RandomProfile): SendPayload['settings'] {
  const cfgRange = clampRange(profile.cfg);
  const stepsRange = clampRange(profile.steps);
  const sampler = profile.samplerPool[Math.floor(Math.random() * profile.samplerPool.length)];
  const resolution = profile.resolutions[Math.floor(Math.random() * profile.resolutions.length)];
  const samplerFn = profile.distribution === 'triangular' ? triangular : uniform;

  const cfg = roundCfg(samplerFn(cfgRange.min, cfgRange.max));
  const steps = Math.round(samplerFn(stepsRange.min, stepsRange.max));

  return {
    cfg,
    steps,
    sampler,
    width: resolution.w,
    height: resolution.h
  };
}

export function mergeRandomizedSettings(
  randomized: SendPayload['settings'],
  overrides?: SendPayload['settings']
): SendPayload['settings'] {
  return {
    ...randomized,
    ...Object.fromEntries(
      Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined && value !== null)
    )
  };
}
