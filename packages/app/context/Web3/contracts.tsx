import { Web3Provider } from '@ethersproject/providers';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getChainRelevantContracts } from '../../../hardhat/lib/utils/getContractAddresses';
import {
  ERC20,
  ERC20__factory,
  StakingRewards,
  StakingRewards__factory,
} from '../../../hardhat/typechain';
import { setSingleActionModal } from '../actions';
import { store } from '../store';
import { connectors, networkMap } from './connectors';

// TODO Move to Interface/Types
type Address = string;
interface ContractAddresses {
  staking: Array<Address>;
  pop?: Address;
  threeCrv?: Address;
  popEthLp?: Address;
  butter?: Address;
  aclRegistry?: Address;
  contractRegistry?: Address;
}

export interface Contracts {
  pop?: ERC20;
  threeCrv?: ERC20;
  popEthLp?: ERC20;
  butter?: ERC20;
  staking?: StakingRewards[];
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
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  } else if (error instanceof UnsupportedChainIdError) {
    return `You're connected to an unsupported network. Please connect to ${
      networkMap[Number(process.env.CHAIN_ID)]
    }.`;
  } else if (error instanceof UserRejectedRequestErrorInjected) {
    return 'Please authorize this website to access your Ethereum account.';
  } else {
    console.error(error);
    return 'An unknown error occurred. Check the console for more details.';
  }
}

const initializeContracts = (
  contractAddresses: ContractAddresses,
  library,
): Contracts => {
  const { pop, popEthLp, threeCrv, butter, staking } = { ...contractAddresses };
  const contracts: Contracts = {
    pop: pop ? ERC20__factory.connect(pop, library) : undefined,
    popEthLp: popEthLp ? ERC20__factory.connect(popEthLp, library) : undefined,
    threeCrv: threeCrv ? ERC20__factory.connect(threeCrv, library) : undefined,
    butter: butter ? ERC20__factory.connect(butter, library) : undefined,
  };
  contracts.staking = [];
  if (staking.length > 0) {
    for (var i = 0; i < contractAddresses.staking.length; i++) {
      contracts.staking.push(
        StakingRewards__factory.connect(contractAddresses.staking[i], library),
      );
    }
  }

  return contracts;
};

export default function ContractsWrapper({
  children,
}: ContractsWrapperProps): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error,
  } = context;
  const [contracts, setContracts] = useState<Contracts>();
  const { dispatch } = useContext(store);

  useEffect(() => {
    if (!active) {
      activate(connectors.Network);
    }
  }, [active]);

  useEffect(() => {
    if (error) {
      dispatch(
        setSingleActionModal({
          content: getErrorMessage(error),
          title: 'Wallet Error',
          visible: true,
          type: 'error',
          onConfirm: {
            label: 'Close',
            onClick: () => dispatch(setSingleActionModal(false)),
          },
        }),
      );
    }
  }, [error]);

  useEffect(() => {
    if (!library) {
      return;
    }
    const contractAddresses = getChainRelevantContracts(chainId);
    const contracts: Contracts = initializeContracts(
      contractAddresses,
      library,
    );
    setContracts(contracts);
    return () => {
      setContracts({});
    };
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
