import { Web3Provider } from "@ethersproject/providers";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
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
  IUniswapV2Router02,
  IUniswapV2Router02__factory,
  RewardsManager,
  RewardsManager__factory,
} from "@popcorn/hardhat/typechain";
import { ChainId, networkMap } from "@popcorn/utils";
import { ContractAddresses } from "@popcorn/utils/types";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import {
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from "@web3-react/injected-connector";
import activateRPCNetwork from "helper/activateRPCNetwork";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { setSingleActionModal } from "../actions";
import { store } from "../store";

export interface Contracts {
  staking?: GovStaking;
  beneficiaryRegistry?: BeneficiaryRegistry;
  grantElections?: GrantElections;
  pop?: ERC20;
  rewardsManager?: RewardsManager;
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
    return `You're connected to an unsupported network. Please connect to ${networkMap[Number(process.env.CHAIN_ID) as ChainId]
      }.`;
  } else if (error instanceof UserRejectedRequestErrorInjected) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

const initializeContracts = (contractAddresses: ContractAddresses, library: Web3Provider): Contracts => {
  const {
    pop,
    grantElections,
    rewardsManager,
    beneficiaryRegistry,
    beneficiaryGovernance,
    govStaking,
  } = contractAddresses;
  const contracts: Contracts = {
    staking: govStaking ? GovStaking__factory.connect(govStaking, library) : undefined,
    pop: pop ? ERC20__factory.connect(pop, library) : undefined,
    beneficiaryRegistry: beneficiaryRegistry
      ? BeneficiaryRegistry__factory.connect(beneficiaryRegistry, library)
      : undefined,
    grantElections: grantElections ? GrantElections__factory.connect(grantElections, library) : undefined,
    rewardsManager: rewardsManager ? RewardsManager__factory.connect(rewardsManager, library) : undefined,
    beneficiaryGovernance: beneficiaryGovernance
      ? BeneficiaryGovernance__factory.connect(beneficiaryGovernance, library)
      : undefined,
  };

  return contracts;
};

export default function ContractsWrapper({ children }: ContractsWrapperProps): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { connector, library, chainId, account, activate, deactivate, active, error } = context;
  const [contracts, setContracts] = useState<Contracts>();
  const { dispatch } = useContext(store);

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

  useEffect(() => {
    if (!library || !chainId) {
      setContracts({});
    } else {
      const contractAddresses = getChainRelevantContracts(chainId);
      setContracts(initializeContracts(contractAddresses, library));
    }
  }, [library, active, chainId]);

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
