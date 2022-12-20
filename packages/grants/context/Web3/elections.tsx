import { GrantElectionAdapter } from "helper/adapters";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ContractsContext } from "./contracts";
import { ElectionMetadata } from "helper/types";
import { Contract } from "ethers/lib/ethers";

interface ElectionsContext {
  elections: ElectionMetadata[];
  refresh: Function;
}

export const ElectionsContext = createContext<ElectionsContext>(null);

interface ElectionsProviderProps {
  children: React.ReactNode;
}

export function ElectionsProvider({ children }: ElectionsProviderProps): React.ReactElement {
  const { contracts } = useContext(ContractsContext);
  const [elections, setElections] = useState<ElectionMetadata[]>([]);
  const [shouldRefresh, refresh] = useState(false);

  async function getElectionMetadata(electionsContract: Contract) {
    setElections(
      [],
      // await Promise.all(
      //   [0].map(async (term) => await GrantElectionAdapter(electionsContract).getElectionMetadata(term)),
      // ),
    );
  }

  useEffect(() => {
    if (contracts?.grantElections || shouldRefresh) {
      getElectionMetadata(contracts.grantElections);
      refresh(false);
    }
  }, [contracts, shouldRefresh]);

  return (
    <ElectionsContext.Provider
      value={{
        elections: [...elections],
        refresh: () => refresh(true),
      }}
    >
      {children}
    </ElectionsContext.Provider>
  );
}

export default ElectionsProvider;
