import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";

export const useBlockNumber = () => {
  const { library } = useWeb3();

  const [blockNumber, setBlockNumber] = useState(library?._lastBlockNumber || 0);

  useEffect(() => {
    setInterval(() => {
      if (library?._lastBlockNumber !== blockNumber) setBlockNumber(library?._lastBlockNumber || 0);
    }, 1000);
  }, []);

  return blockNumber;
};
