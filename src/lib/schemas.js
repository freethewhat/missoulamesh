import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, 'not a real calendar date');

export const settingsSchema = z.object({
  lastReviewed: isoDate,
  radio: z.object({
    presetName: z.string().min(1),
    frequencyMHz: z.number().positive(),
    bandwidthKHz: z.number().positive(),
    spreadingFactor: z.number().int().min(5).max(12),
    codingRate: z.number().int().min(5).max(8),
  }),
  pathHashMode: z.number().int().min(0).max(2),
  channels: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['public', 'hashtag']),
    purpose: z.string().min(1),
  }).refine((c) => c.type !== 'hashtag' || c.name.startsWith('#'), 'hashtag channels start with #')),
  fccNote: z.string().min(1),
});

export const repeaterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).nullable(),
  area: z.string().min(1),
  status: z.enum(['testing', 'on-air', 'down', 'unknown']),
  lastChecked: isoDate,
  contact: z.string().min(1).nullable(),
  notes: z.string().min(1).nullable(),
});

export const repeatersSchema = z.array(repeaterSchema);

// Store links must be plain: https, no query string or fragment (no affiliate tags).
const plainUrl = z.string().url().refine((s) => s.startsWith('https://') && !/[?#]/.test(s), 'plain https URL with no query string');

export const hardwareSchema = z.array(z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  role: z.enum(['companion', 'repeater']),
  url: plainUrl,
  priceUSD: z.number().positive(),
  facts: z.string().min(1),
  triedHere: z.boolean(),
  lastChecked: isoDate,
}));
