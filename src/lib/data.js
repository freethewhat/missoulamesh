// Loads and validates the data files at build time. A bad file fails the build.
import settingsRaw from '../data/settings.json' with { type: 'json' };
import repeatersRaw from '../data/repeaters.json' with { type: 'json' };
import hardwareRaw from '../data/hardware.json' with { type: 'json' };
import { settingsSchema, repeatersSchema, hardwareSchema } from './schemas.js';

export const settings = settingsSchema.parse(settingsRaw);
export const repeaters = repeatersSchema.parse(repeatersRaw);
export const hardware = hardwareSchema.parse(hardwareRaw);
