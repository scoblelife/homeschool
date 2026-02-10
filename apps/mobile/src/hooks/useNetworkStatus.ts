/**
 * Network Status Hook
 *
 * Tracks network connectivity and provides offline/online status.
 * Used to show offline indicator and manage sync behavior.
 */

import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook to track network connectivity status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}

/**
 * Simple hook for just offline/online status
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  // Consider online if connected AND (internet reachable OR unknown)
  return (
    isConnected &&
    (isInternetReachable === true || isInternetReachable === null)
  );
}
