import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetwork(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Check connectivity on mount
    Network.getNetworkStateAsync().then((state) => {
      setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
    });

    // Listen for connectivity changes
    const subscription = Network.addNetworkStateListener((state) => {
      setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { isOnline };
}
