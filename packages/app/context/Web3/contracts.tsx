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
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getChainRelevantContracts } from '../../../hardhat/lib/utils/getContractAddresses';
import {
  BasicIssuanceModule,
  BasicIssuanceModule__factory,
  Curve3Pool,
  Curve3Pool__factory,
  CurveMetapool,
  CurveMetapool__factory,
  ERC20,
  ERC20__factory,
  HysiBatchInteraction,
  HysiBatchInteraction__factory,
  HysiBatchZapper,
  HysiBatchZapper__factory,
  StakingRewards,
  StakingRewards__factory,
  YearnVault,
  YearnVault__factory,
} from '../../../hardhat/typechain';
import { setSingleActionModal } from '../actions';
import { store } from '../store';
import { connectors, networkMap } from './connectors';

export interface Contracts {
  staking?: StakingRewards[];
  pop?: ERC20;
  dai?: ERC20;
  usdc?: ERC20;
  usdt?: ERC20;
  threeCrv?: ERC20;
  popEthLp?: ERC20;
  butter?: SetToken;
  butterBatch?: HysiBatchInteraction;
  butterBatchZapper?: HysiBatchZapper;
}

export interface ButterDependencyContracts {
  yDusd?: YearnVault;
  yFrax?: YearnVault;
  yUsdn?: YearnVault;
  yUst?: YearnVault;
  dusdMetapool?: CurveMetapool;
  fraxMetapool?: CurveMetapool;
  usdnMetapool?: CurveMetapool;
  ustMetapool?: CurveMetapool;
  threePool?: Curve3Pool;
  basicIssuanceModule?: BasicIssuanceModule;
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
    pop: pop ? ERC20__factory.connect(pop, library) : undefined,
    dai: dai ? ERC20__factory.connect(dai, library) : undefined,
    usdc: usdc ? ERC20__factory.connect(usdc, library) : undefined,
    usdt: usdt ? ERC20__factory.connect(usdt, library) : undefined,
    threeCrv: threeCrv ? ERC20__factory.connect(threeCrv, library) : undefined,
    popEthLp: popEthLp ? ERC20__factory.connect(popEthLp, library) : undefined,
    butter: butter ? SetToken__factory.connect(butter, library) : undefined,
    butterBatch: butterBatch
      ? HysiBatchInteraction__factory.connect(butterBatch, library)
      : undefined,
    butterBatchZapper: butterBatchZapper
      ? HysiBatchZapper__factory.connect(butterBatch, library)
      : undefined,
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

const initializeButterDependencyContracts = (
  contractAddresses: ButterDependencyAddresses | undefined,
  chainId: number,
  library,
): ButterDependencyContracts => {
  if ([1, 31337, 1337].includes(chainId)) {
    return {
      yDusd: YearnVault__factory.connect(contractAddresses.yDusd, library),
      yFrax: YearnVault__factory.connect(contractAddresses.yFrax, library),
      yUsdn: YearnVault__factory.connect(contractAddresses.yUsdn, library),
      yUst: YearnVault__factory.connect(contractAddresses.yUst, library),
      dusdMetapool: CurveMetapool__factory.connect(
        contractAddresses.dusdMetapool,
        library,
      ),
      fraxMetapool: CurveMetapool__factory.connect(
        contractAddresses.fraxMetapool,
        library,
      ),
      usdnMetapool: CurveMetapool__factory.connect(
        contractAddresses.usdnMetapool,
        library,
      ),
      ustMetapool: CurveMetapool__factory.connect(
        contractAddresses.ustMetapool,
        library,
      ),
      threePool: Curve3Pool__factory.connect(
        contractAddresses.threePool,
        library,
      ),
      basicIssuanceModule: BasicIssuanceModule__factory.connect(
        contractAddresses.basicIssuanceModule,
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
  const [butterDependencyContracts, setButterDependencyContracts] =
    useState<ButterDependencyContracts>();
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
    if (!library || !chainId) {
      return;
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
    return () => {
      setContracts({});
      setButterDependencyContracts({});
    };
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
