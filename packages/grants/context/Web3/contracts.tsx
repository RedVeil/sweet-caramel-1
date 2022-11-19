import { Web3Provider } from "@ethersproject/providers";
import {
  BeneficiaryGovernance,
  BeneficiaryGovernance__factory,
  BeneficiaryRegistry,
  BeneficiaryRegistry__factory,
  ERC20,
  ERC20__factory,
  GovStaking,
  GovStaking__factory,
  GrantElections,
  GrantElections__factory,
} from "@popcorn/hardhat/typechain";
import { ChainId, networkMap } from "@popcorn/utils";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import { UserRejectedRequestError as UserRejectedRequestErrorInjected } from "@web3-react/injected-connector";
import activateRPCNetwork from "helper/activateRPCNetwork";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { setSingleActionModal } from "../actions";
import { store } from "../store";
import { useNamedAccounts } from "@popcorn/hooks";

export interface Contracts {
  staking?: GovStaking;
  beneficiaryRegistry?: BeneficiaryRegistry;
  grantElections?: GrantElections;
  pop?: ERC20;
  beneficiaryGovernance?: BeneficiaryGovernance;
}

interface ContractsContext {
  contracts: Contracts;
  setContracts: React.Dispatch<Contracts>;
}

export const ContractsContext = createContext<ContractsContext>(null);

interface ContractsWrapperProps {
  children: React.ReactNode;
}

function getErrorMessage(error: Error) {
  if (error instanceof UnsupportedChainIdError) {
    return `You're connected to an unsupported network. Please connect to ${
      networkMap[Number(process.env.CHAIN_ID) as ChainId]
    }.`;
  } else if (error instanceof UserRejectedRequestErrorInjected) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

const initializeContracts = (contractAddresses: any[], library: Web3Provider): Contracts => {
  const _contracts = contractAddresses.reduce(
    (contracts, contract) => ({ ...contracts, [contract.__alias]: contractAddresses[contract] }),
    {},
  );

  const { pop, grantElections, beneficiaryRegistry, beneficiaryGovernance, govStaking } = _contracts;

  const contracts: Contracts = {
    staking: govStaking ? GovStaking__factory.connect(govStaking, library) : undefined,
    pop: pop ? ERC20__factory.connect(pop, library) : undefined,
    beneficiaryRegistry: beneficiaryRegistry
      ? BeneficiaryRegistry__factory.connect(beneficiaryRegistry, library)
      : undefined,
    grantElections: grantElections ? GrantElections__factory.connect(grantElections, library) : undefined,
    beneficiaryGovernance: beneficiaryGovernance
      ? BeneficiaryGovernance__factory.connect(beneficiaryGovernance, library)
      : undefined,
  };

  return contracts;
};

export default function ContractsWrapper({ children }: ContractsWrapperProps): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { connector, library, chainId, account, activate, deactivate, active, error } = context;
  const { dispatch } = useContext(store);
  const [contracts, setContracts] = useState<Contracts>();

  const ref = useRef(chainId);
  ref.current = chainId;

  useEffect(() => {
    if (!library) {
      activateRPCNetwork(activate, ref.current);
    }
  }, [library]);

  useEffect(() => {
    if (error) {
      dispatch(
        setSingleActionModal({
          content: getErrorMessage(error),
          title: "Wallet Error",
          visible: true,
          type: "error",
          onConfirm: {
            label: "Close",
            onClick: () => dispatch(setSingleActionModal(false)),
          },
        }),
      );
    }
  }, [error]);

  const contractAddresses = useNamedAccounts(chainId?.toString() || ("1337" as any), [
    "pop",
    "grantElections",
    "rewardsManager",
    "beneficiaryRegistry",
    "beneficiaryGovernance",
    "govStaking",
  ]);

  useEffect(() => {
    if (!library && !chainId) {
    } else if (contractAddresses.length && Object.entries(contracts).length) {
      setContracts(initializeContracts(contractAddresses, library));
    }
  }, [library, active, chainId, contractAddresses]);

  return (
    <ContractsContext.Provider
      value={{
        contracts,
        setContracts,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
}
