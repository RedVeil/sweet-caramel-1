import { Web3Provider } from '@ethersproject/providers';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import React, { createContext, useContext, useEffect, useState } from 'react';
import getContractAddresses from '../../../hardhat/lib/utils/getContractAddresses';
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
  ISetToken,
  ISetToken__factory,
  YearnVault,
  YearnVault__factory,
} from '../../../hardhat/typechain';
import { setSingleActionModal } from '../actions';
import { store } from '../store';
import { connectors, networkMap } from './connectors';
export interface Contracts {
  threeCrv: ERC20;
  butter: ISetToken;
  butterBatch: HysiBatchInteraction;
  butterBatchZapper: HysiBatchZapper;
}

export interface hysiDependencyContracts {
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

interface ContractsContext {
  contracts: Contracts;
  hysiDependencyContracts: hysiDependencyContracts;
  setContracts: React.Dispatch<Contracts>;
  setHysiDependencyContracts: React.Dispatch<hysiDependencyContracts>;
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
    useState<hysiDependencyContracts>();
  const { dispatch } = useContext(store);
  const addresses = getContractAddresses();

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
      threeCrv: ERC20__factory.connect(addresses.THREE_CRV.hardhat, library),
      butter: ISetToken__factory.connect(addresses.BUTTER.hardhat, library),
      butterBatch: HysiBatchInteraction__factory.connect(
        addresses.BUTTER_BATCH.hardhat,
        library,
      ),
      butterBatchZapper: HysiBatchZapper__factory.connect(
        addresses.BUTTER_BATCH_ZAPPER.hardhat,
        library,
      ),
    });

    setHysiDependencyContracts({
      basicIssuanceModule: BasicIssuanceModule__factory.connect(
        addresses.SET_BASIC_ISSUANCE_MODULE_ADDRESS.hardhat,
        library,
      ),
      yDUSD: YearnVault__factory.connect(addresses.YDUSD.hardhat, library),
      yFRAX: YearnVault__factory.connect(addresses.YFRAX.hardhat, library),
      yUSDN: YearnVault__factory.connect(addresses.YUSDN.hardhat, library),
      yUST: YearnVault__factory.connect(addresses.YUST.hardhat, library),
      dusdMetapool: CurveMetapool__factory.connect(
        addresses.DUSD_METAPOOL.hardhat,
        library,
      ),
      fraxMetapool: CurveMetapool__factory.connect(
        addresses.FRAX_METAPOOL.hardhat,
        library,
      ),
      usdnMetapool: CurveMetapool__factory.connect(
        addresses.USDN_METAPOOL.hardhat,
        library,
      ),
      ustMetapool: CurveMetapool__factory.connect(
        addresses.UST_METAPOOL.hardhat,
        library,
      ),
      triPool: Curve3Pool__factory.connect(
        addresses.THREE_POOL.hardhat,
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
