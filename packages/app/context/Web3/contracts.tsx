import { Web3Provider } from '@ethersproject/providers';
import { SetToken__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/SetToken__factory';
import { SetToken } from '@setprotocol/set-protocol-v2/typechain/SetToken';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import React, { createContext, useContext, useEffect, useState } from 'react';
import getNamedAccounts from '../../../hardhat/lib/utils/getNamedAccounts';
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
  pop: ERC20;
  popEthLp: ERC20;
  threeCrv: ERC20;
  butter: SetToken;
  butterBatch: HysiBatchInteraction;
  butterBatchZapper: HysiBatchZapper;
  dai: ERC20;
  usdc: ERC20;
  usdt: ERC20;
  staking: StakingContracts;
}

export interface HysiDependencyContracts {
  basicIssuanceModule: BasicIssuanceModule;
  yDUSD: YearnVault;
  yFRAX: YearnVault;
  yUSDN: YearnVault;
  yUST: YearnVault;
  dusdMetapool: CurveMetapool;
  fraxMetapool: CurveMetapool;
  usdnMetapool: CurveMetapool;
  ustMetapool: CurveMetapool;
  triPool: Curve3Pool;
}
export interface StakingContracts {
  pop: StakingRewards;
  popEthLp: StakingRewards;
  butter: StakingRewards;
}

interface ContractsContext {
  contracts: Contracts;
  hysiDependencyContracts: HysiDependencyContracts;
  setContracts: React.Dispatch<Contracts>;
  setHysiDependencyContracts: React.Dispatch<HysiDependencyContracts>;
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
  const [hysiDependencyContracts, setHysiDependencyContracts] =
    useState<HysiDependencyContracts>();
  const { dispatch } = useContext(store);
  const addresses = getNamedAccounts();

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
    setContracts({
      pop: ERC20__factory.connect(
        addresses.pop[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      popEthLp: ERC20__factory.connect(
        addresses.popEthLp[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      threeCrv: ERC20__factory.connect(
        addresses.threeCrv[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      butter: SetToken__factory.connect(
        addresses.butter[networkMap[process.env.CHAIN_ID]],
        library,
      ) as SetToken,
      butterBatch: HysiBatchInteraction__factory.connect(
        addresses.butterBatch[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      butterBatchZapper: HysiBatchZapper__factory.connect(
        addresses.butterBatchZapper[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      dai: ERC20__factory.connect(
        addresses.dai[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      usdc: ERC20__factory.connect(
        addresses.usdc[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      usdt: ERC20__factory.connect(
        addresses.usdt[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      staking: {
        pop: StakingRewards__factory.connect(
          addresses.popStaking[networkMap[process.env.CHAIN_ID]],
          library,
        ),
        popEthLp: StakingRewards__factory.connect(
          addresses.popEthLpStaking[networkMap[process.env.CHAIN_ID]],
          library,
        ),
        butter: StakingRewards__factory.connect(
          addresses.butterStaking[networkMap[process.env.CHAIN_ID]],
          library,
        ),
      },
    });

    setHysiDependencyContracts({
      basicIssuanceModule: BasicIssuanceModule__factory.connect(
        addresses.setBasicIssuanceModule[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      yDUSD: YearnVault__factory.connect(
        addresses.yDusd[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      yFRAX: YearnVault__factory.connect(
        addresses.yFrax[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      yUSDN: YearnVault__factory.connect(
        addresses.yUsdn[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      yUST: YearnVault__factory.connect(
        addresses.yUst[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      dusdMetapool: CurveMetapool__factory.connect(
        addresses.dusdMetapool[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      fraxMetapool: CurveMetapool__factory.connect(
        addresses.fraxMetapool[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      usdnMetapool: CurveMetapool__factory.connect(
        addresses.usdnMetapool[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      ustMetapool: CurveMetapool__factory.connect(
        addresses.ustMetapool[networkMap[process.env.CHAIN_ID]],
        library,
      ),
      triPool: Curve3Pool__factory.connect(
        addresses.threePool[networkMap[process.env.CHAIN_ID]],
        library,
      ),
    });
  }, [library, active]);

  return (
    <ContractsContext.Provider
      value={{
        contracts,
        setContracts,
        hysiDependencyContracts,
        setHysiDependencyContracts,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
}
