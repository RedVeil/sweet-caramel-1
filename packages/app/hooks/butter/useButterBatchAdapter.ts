import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import { useEffect, useState } from "react";
import useButterBatch from "./useButterBatch";

export default function useButterBatchAdapter(): ButterBatchAdapter | undefined {
  const butterBatch = useButterBatch();
  const [butterBatchAdapter, setButterBatchAdapter] = useState<ButterBatchAdapter>(undefined);
  useEffect(() => {
    if (butterBatch) {
      setButterBatchAdapter(new ButterBatchAdapter(butterBatch));
    }
  }, [butterBatch]);
  return butterBatchAdapter;
}
