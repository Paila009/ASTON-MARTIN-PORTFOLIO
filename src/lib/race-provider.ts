import { races, seasons, sources, team, verificationDate, snapshotThrough, type Race, type Season, type Source } from './data';

/** Provider contract for replacing the editorial snapshot with an authorised data service. */
export type RaceSnapshot = {
  mode: 'snapshot' | 'live';
  verifiedAt: string;
  resultsThrough: string;
  label: string;
  races: readonly Race[];
  seasons: readonly Season[];
  team: typeof team;
  sources: readonly Source[];
};

export interface RaceDataProvider {
  getSnapshot(): Promise<RaceSnapshot>;
}

/** No fetching, credentials, artificial latency or simulated telemetry. */
export const staticRaceProvider: RaceDataProvider = {
  async getSnapshot() {
    return {
      mode: 'snapshot',
      verifiedAt: verificationDate,
      resultsThrough: snapshotThrough,
      label: `Editorial snapshot · verified ${verificationDate} · results through ${snapshotThrough}`,
      races,
      seasons,
      team,
      sources,
    };
  },
};

// Static export is deliberately pinned to the local source. A future provider must
// preserve provenance, explicit timestamps and missing-data states in this contract.
export const raceProvider: RaceDataProvider = staticRaceProvider;
