// Loads and validates the data files at build time. A bad file fails the build.
import settingsRaw from '../data/settings.json' with { type: 'json' };
import repeatersRaw from '../data/repeaters.json' with { type: 'json' };
import hardwareRaw from '../data/hardware.json' with { type: 'json' };
import roomServerRaw from '../data/room-server.json' with { type: 'json' };
import coverageRaw from '../data/coverage.json' with { type: 'json' };
import { settingsSchema, repeatersSchema, hardwareSchema, roomServerSchema, coverageSchema } from './schemas.js';

export const settings = settingsSchema.parse(settingsRaw);
export const repeaters = repeatersSchema.parse(repeatersRaw);
export const hardware = hardwareSchema.parse(hardwareRaw);
export const roomServer = roomServerSchema.parse(roomServerRaw);
export const coverage = coverageSchema.parse(coverageRaw);

if (!repeaters.some((r) => r.id === roomServer.nearRepeater)) {
  throw new Error(`room-server.json: nearRepeater "${roomServer.nearRepeater}" is not in repeaters.json`);
}
