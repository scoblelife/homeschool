/**
 * Hook for loading state requirements data via OTA IPC with bundled fallback.
 *
 * Calls window.api.stateRequirementsGetData() on mount and listens for
 * stateRequirements:updated events to re-fetch.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  StateRequirements,
  StateRequirementsData,
  RegulationLevel,
} from "../../../data/stateRequirementsTypes";
import { stateRequirements as bundledData } from "../../../data/stateRequirementsTypes";

interface UseStateRequirementsReturn {
  data: StateRequirementsData;
  isLoading: boolean;
  source: string;
  getAllStates: () => Array<{ code: string; name: string }>;
  getStateRequirements: (code: string) => StateRequirements | null;
  formatRequirements: (state: StateRequirements) => string[];
}

function formatStateRequirements(state: StateRequirements): string[] {
  const requirements: string[] = [];

  if (state.requiresNotification) {
    requirements.push("Notification required");
  }

  if (state.requiredDaysPerYear) {
    requirements.push(
      `${state.requiredDaysPerYear} days of instruction per year`,
    );
  }

  if (state.requiredHoursPerYear) {
    requirements.push(
      `${state.requiredHoursPerYear} hours of instruction per year`,
    );
  }

  if (state.assessmentRequired) {
    requirements.push("Annual assessment/testing required");
  }

  if (state.recordKeepingRequired) {
    requirements.push("Record keeping/portfolio required");
  }

  if (state.parentQualifications) {
    requirements.push(
      `Parent qualification: ${state.parentQualifications.replace(/_/g, " ")}`,
    );
  }

  if (state.requiredSubjects && state.requiredSubjects.length > 0) {
    requirements.push(
      `Required subjects: ${state.requiredSubjects.map((s) => s.replace(/_/g, " ")).join(", ")}`,
    );
  }

  return requirements;
}

export function useStateRequirements(): UseStateRequirementsReturn {
  const [data, setData] = useState<StateRequirementsData>(bundledData);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState("bundled");

  const loadData = useCallback(async () => {
    try {
      const otaData = await window.api.stateRequirementsGetData();
      if (otaData && typeof otaData === "object") {
        const typed = otaData as StateRequirementsData;
        if (typed.states && typed.regulationLevels && typed.commonSubjects) {
          setData(typed);
        }
      }

      const status = await window.api.stateRequirementsGetUpdateStatus();
      setSource(status.source);
    } catch (error) {
      console.warn(
        "[useStateRequirements] IPC failed, using bundled data:",
        error,
      );
      setData(bundledData);
      setSource("bundled");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for OTA updates
  useEffect(() => {
    if (!window.api.onStateRequirementsUpdated) return;

    const cleanup = window.api.onStateRequirementsUpdated(() => {
      loadData();
    });

    return cleanup;
  }, [loadData]);

  const getAllStates = useCallback((): Array<{
    code: string;
    name: string;
  }> => {
    return Object.entries(data.states)
      .map(([code, stateData]) => ({
        code,
        name: stateData.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const getStateReqs = useCallback(
    (code: string): StateRequirements | null => {
      return data.states[code] || null;
    },
    [data],
  );

  return useMemo(
    () => ({
      data,
      isLoading,
      source,
      getAllStates,
      getStateRequirements: getStateReqs,
      formatRequirements: formatStateRequirements,
    }),
    [data, isLoading, source, getAllStates, getStateReqs],
  );
}
