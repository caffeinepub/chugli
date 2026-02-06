import { useEffect, useState } from 'react';
import { loadAreaSelection, saveAreaSelection, type AreaSelection, AVAILABLE_AREAS } from '../storage/areaSelectionStorage';
import { findClosestIndianState } from '../utils/location/closestIndianState';

export function useAreaSelection() {
  const [selection, setSelection] = useState<AreaSelection>({
    locationEnabled: false,
    areaId: null,
    areaLabel: null,
  });

  useEffect(() => {
    const stored = loadAreaSelection();
    if (stored) {
      setSelection(stored);
    }
  }, []);

  const updateSelection = (updates: Partial<AreaSelection>) => {
    const updated = { ...selection, ...updates };
    saveAreaSelection(updated);
    setSelection(updated);
  };

  const setArea = (areaId: string | null, areaLabel: string | null) => {
    updateSelection({ areaId, areaLabel });
  };

  // Enable location access: request geolocation and auto-select closest state
  const enableLocationAccess = async (): Promise<{ success: boolean; stateName?: string; error?: string }> => {
    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation is not supported by your browser' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Validate coordinates before processing
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            resolve({ 
              success: false, 
              error: 'Invalid location coordinates received. Please try again or select your area manually.' 
            });
            return;
          }
          
          // Find closest state (coordinates used only in-memory, never persisted)
          const closestStateId = findClosestIndianState(latitude, longitude);
          
          if (closestStateId) {
            const state = AVAILABLE_AREAS.find(a => a.id === closestStateId);
            if (state) {
              // Update area and enable location
              updateSelection({
                locationEnabled: true,
                areaId: state.id,
                areaLabel: state.label,
              });
              resolve({ success: true, stateName: state.label });
              return;
            }
          }
          
          // Fallback: could not determine closest state
          resolve({ 
            success: false, 
            error: 'Could not determine closest area. Please select your area manually.' 
          });
        },
        (error) => {
          let errorMessage = 'Location access denied';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information unavailable. Please select your area manually.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Location request timed out. Please try again or select your area manually.';
          }
          resolve({ success: false, error: errorMessage });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  };

  // Disable location access: just update the flag, don't change area
  const disableLocationAccess = () => {
    updateSelection({ locationEnabled: false });
  };

  return { 
    selection, 
    updateSelection, 
    setArea, 
    enableLocationAccess, 
    disableLocationAccess 
  };
}
