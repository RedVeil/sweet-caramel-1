import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import { Contract } from "ethers";
import { useEffect, useState } from "react";

// TODO: Remove this file
export default function useButterBatchAdapter(butterBatch: Contract): ButterBatchAdapter | undefined {
  const [butterBatchAdapter, setButterBatchAdapter] = useState<ButterBatchAdapter>(undefined);
  useEffect(() => {
    if (butterBatch) {
      setButterBatchAdapter(new ButterBatchAdapter(butterBatch));
    }
  }, [butterBatch]);
  return butterBatchAdapter;
}
