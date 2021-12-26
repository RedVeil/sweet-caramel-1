import { Web3Provider } from '@ethersproject/providers';
import {
  ButterDependencyAddresses,
  ContractAddresses,
} from '@popcorn/utils/types';
import { SetToken__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/SetToken__factory';
import { SetToken } from '@setprotocol/set-protocol-v2/typechain/SetToken';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import React, { createContext, useEffect, useState } from 'react';
import { getChainRelevantContracts } from '../../../hardhat/lib/utils/getContractAddresses';
import {
  BasicIssuanceModule,
  BasicIssuanceModule__factory,
  ButterBatchProcessing,
  ButterBatchProcessingZapper,
  ButterBatchProcessingZapper__factory,
  ButterBatchProcessing__factory,
  Curve3Pool,
  Curve3Pool__factory,
  CurveMetapool,
  CurveMetapool__factory,
  ERC20,
  ERC20__factory,
  PopLocker,
  PopLocker__factory,
  Staking,
  Staking__factory,
  YearnVault,
  YearnVault__factory,
} from '../../../hardhat/typechain';
import { connectors, networkMap } from './connectors';

export interface Contracts {
  staking?: Staking[];
  popStaking?: PopLocker;
  pop?: ERC20;
  dai?: ERC20;
  usdc?: ERC20;
  usdt?: ERC20;
  threeCrv?: ERC20;
  popEthLp?: ERC20;
  butter?: SetToken;
  butterBatch?: ButterBatchProcessing;
  butterBatchZapper?: ButterBatchProcessingZapper;
}

export interface ButterDependencyContracts {
  yFrax?: YearnVault;
  yMim?: YearnVault;
  crvFraxMetapool?: CurveMetapool;
  crvMimMetapool?: CurveMetapool;
  threePool?: Curve3Pool;
  setBasicIssuanceModule?: BasicIssuanceModule;
}

interface ContractsContext {
  contracts: Contracts;
  butterDependencyContracts: ButterDependencyContracts;
  setContracts: React.Dispatch<Contracts>;
  setButterDependencyContracts: React.Dispatch<ButterDependencyContracts>;
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
  const {
    staking,
    popStaking,
    pop,
    dai,
    usdc,
    usdt,
    threeCrv,
    popEthLp,
    butter,
    butterBatch,
    butterBatchZapper,
  } = {
    ...contractAddresses,
  };
  const contracts: Contracts = {
    popStaking: popStaking
      ? PopLocker__factory.connect(popStaking, library)
      : undefined,
    pop: pop ? ERC20__factory.connect(pop, library) : undefined,
    dai: dai ? ERC20__factory.connect(dai, library) : undefined,
    usdc: usdc ? ERC20__factory.connect(usdc, library) : undefined,
    usdt: usdt ? ERC20__factory.connect(usdt, library) : undefined,
    threeCrv: threeCrv ? ERC20__factory.connect(threeCrv, library) : undefined,
    popEthLp: popEthLp ? ERC20__factory.connect(popEthLp, library) : undefined,
    butter: butter ? SetToken__factory.connect(butter, library) : undefined,
    butterBatch: butterBatch
      ? ButterBatchProcessing__factory.connect(butterBatch, library)
      : undefined,
    butterBatchZapper: butterBatchZapper
      ? ButterBatchProcessingZapper__factory.connect(butterBatch, library)
      : undefined,
  };
  contracts.staking = [];
  if (staking && staking.length > 0) {
    for (var i = 0; i < contractAddresses.staking.length; i++) {
      contracts.staking.push(
        Staking__factory.connect(contractAddresses.staking[i], library),
      );
    }
  }

  return contracts;
};

const initializeButterDependencyContracts = (
  contractAddresses: ButterDependencyAddresses | undefined,
  chainId: number,
  library,
): ButterDependencyContracts => {
  if ([1, 31337, 1337].includes(chainId)) {
    return {
      yFrax: YearnVault__factory.connect(contractAddresses.yFrax, library),
      yMim: YearnVault__factory.connect(contractAddresses.yMim, library),
      crvFraxMetapool: CurveMetapool__factory.connect(
        contractAddresses.crvFraxMetapool,
        library,
      ),
      crvMimMetapool: CurveMetapool__factory.connect(
        contractAddresses.crvMimMetapool,
        library,
      ),
      threePool: Curve3Pool__factory.connect(
        contractAddresses.threePool,
        library,
      ),
      setBasicIssuanceModule: BasicIssuanceModule__factory.connect(
        contractAddresses.setBasicIssuanceModule,
        library,
      ),
    };
  }
  return {};
};

export default function ContractsWrapper({
  children,
}: ContractsWrapperProps): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { library, chainId, activate, active } = context;
  const [contracts, setContracts] = useState<Contracts>();
  const [butterDependencyContracts, setButterDependencyContracts] =
    useState<ButterDependencyContracts>();

  useEffect(() => {
    if (!active) {
      activate(connectors.Network);
    }
  }, [active]);

  useEffect(() => {
    if (!library || !chainId || chainId === undefined) {
      return () => {
        setContracts({});
        setButterDependencyContracts({});
      };
    }
    const contractAddresses = getChainRelevantContracts(chainId);
    const contracts = initializeContracts(contractAddresses, library);
    setContracts(contracts);
    const butterDependencyContracts = initializeButterDependencyContracts(
      contractAddresses.butterDependency,
      chainId,
      library,
    );
    setButterDependencyContracts(butterDependencyContracts);
  }, [library, active, chainId]);

  return (
    <ContractsContext.Provider
      value={{
        contracts,
        setContracts,
        butterDependencyContracts,
        setButterDependencyContracts,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
}
