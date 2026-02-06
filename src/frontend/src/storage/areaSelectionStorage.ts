import { INDIA_STATES } from '../data/indiaStates';

export interface AreaSelection {
  locationEnabled: boolean;
  areaId: string | null;
  areaLabel: string | null;
}

const STORAGE_KEY = 'chugli_area_selection';
const STORAGE_VERSION = 1;

// Sentinel value for "All areas" selection
export const ALL_AREAS_ID = '__all_areas__';
export const ALL_AREAS_LABEL = 'All areas';

export function loadAreaSelection(): AreaSelection | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data.version !== STORAGE_VERSION) return null;
    return data.selection;
  } catch {
    return null;
  }
}

export function saveAreaSelection(selection: AreaSelection): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      selection,
    }));
  } catch (e) {
    console.error('Failed to save area selection:', e);
  }
}

// All available areas: "All areas" sentinel + all Indian states
export const AVAILABLE_AREAS = [
  { id: ALL_AREAS_ID, label: ALL_AREAS_LABEL },
  ...INDIA_STATES,
];
