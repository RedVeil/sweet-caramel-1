import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export const useIsConnected = () => {
  const { address } = useAccount();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (connected !== !!address) {
      setConnected(!!address);
    }
  }, [connected, address]);

  return connected;
};
