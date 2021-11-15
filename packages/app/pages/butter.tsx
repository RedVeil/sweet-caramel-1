import { Web3Provider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import { bigNumberToNumber, formatAndRoundBigNumber } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import BatchProcessingInfo from 'components/BatchButter/BatchProcessingInfo';
import ClaimableBatches from 'components/BatchButter/ClaimableBatches';
import MintRedeemInterface from 'components/BatchButter/MintRedeemInterface';
import { BatchProcessToken } from 'components/BatchButter/TokenInput';
import Navbar from 'components/NavBar/NavBar';
import StatInfoCard from 'components/StatInfoCard';
import { store } from 'context/store';
import {
  Contracts,
  ContractsContext,
  HysiDependencyContracts,
} from 'context/Web3/contracts';
import { BigNumber, Contract, utils } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  AccountBatch,
  BatchType,
  ComponentMap,
  TimeTillBatchProcessing,
} from '../../hardhat/lib/adapters';
import ButterBatchAdapter from '../../hardhat/lib/adapters/ButterBatchAdapter';
interface HotSwapParameter {
  batchIds: String[];
  amounts: BigNumber[];
}
interface ClaimableBatches {
  mint: AccountBatch[];
  redeem: AccountBatch[];
}

export interface SelectedToken {
  input: BatchProcessToken;
  output: BatchProcessToken;
}

export interface BatchProcessTokens {
  butter: BatchProcessToken;
  threeCrv: BatchProcessToken;
  dai: BatchProcessToken;
  usdc: BatchProcessToken;
  usdt: BatchProcessToken;
}

const TOKEN_INDEX = { dai: 0, usdc: 1, usdt: 2 };

function getClaimableBalance(claimableBatches: AccountBatch[]): BigNumber {
  return claimableBatches.reduce(
    (acc: BigNumber, batch: AccountBatch) =>
      acc.add(batch.accountClaimableTokenBalance),
    BigNumber.from('0'),
  );
}

function isDepositDisabled(
  depositAmount: BigNumber,
  inputTokenBalance: BigNumber,
  wait: Boolean,
): boolean {
  return depositAmount > inputTokenBalance && !wait;
}

async function getBatchProcessToken(
  butterBatchAdapter: ButterBatchAdapter,
  contracts: Contracts,
  hysiDependencyContracts: HysiDependencyContracts,
  account: string,
): Promise<BatchProcessTokens> {
  const batchProcessTokens = {
    butter: {
      name: 'Butter',
      key: 'butter',
      balance: await contracts.butter.balanceOf(account),
      claimableBalance: BigNumber.from('0'),
      price: await butterBatchAdapter.getHysiPrice(
        hysiDependencyContracts.basicIssuanceModule,
        {
          [hysiDependencyContracts.yDUSD.address.toLowerCase()]: {
            metaPool: hysiDependencyContracts.dusdMetapool,
            yPool: hysiDependencyContracts.yDUSD,
          },
          [hysiDependencyContracts.yFRAX.address.toLowerCase()]: {
            metaPool: hysiDependencyContracts.fraxMetapool,
            yPool: hysiDependencyContracts.yFRAX,
          },
          [hysiDependencyContracts.yUSDN.address.toLowerCase()]: {
            metaPool: hysiDependencyContracts.usdnMetapool,
            yPool: hysiDependencyContracts.yUSDN,
          },
          [hysiDependencyContracts.yUST.address.toLowerCase()]: {
            metaPool: hysiDependencyContracts.ustMetapool,
            yPool: hysiDependencyContracts.yUST,
          },
        } as ComponentMap,
      ),
    },
    threeCrv: {
      name: '3CRV',
      key: 'threeCrv',
      balance: await contracts.threeCrv.balanceOf(account),
      claimableBalance: BigNumber.from('0'),
      price: await butterBatchAdapter.getThreeCrvPrice(
        hysiDependencyContracts.triPool,
      ),
    },
    dai: {
      name: 'DAI',
      key: 'dai',
      balance: await contracts.dai.balanceOf(account),
      price: await butterBatchAdapter.getStableCoinPrice(
        hysiDependencyContracts.triPool,
        [parseEther('1'), BigNumber.from('0'), BigNumber.from('0')],
      ),
    },
    usdc: {
      name: 'USDC',
      key: 'usdc',
      balance: (await contracts.usdc.balanceOf(account)).mul(
        BigNumber.from(1e12),
      ),
      price: await butterBatchAdapter.getStableCoinPrice(
        hysiDependencyContracts.triPool,
        [BigNumber.from('0'), BigNumber.from(1e6), BigNumber.from('0')],
      ),
    },
    usdt: {
      name: 'USDT',
      key: 'usdt',
      balance: (await contracts.usdt.balanceOf(account)).mul(
        BigNumber.from(1e12),
      ),
      price: await butterBatchAdapter.getStableCoinPrice(
        hysiDependencyContracts.triPool,
        [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from(1e6)],
      ),
    },
  };
  return batchProcessTokens;
}

function adjustDepositDecimals(
  depositAmount: BigNumber,
  tokenKey: string,
): BigNumber {
  if (tokenKey === 'usdc' || tokenKey === 'usdt') {
    return depositAmount.div(BigNumber.from(1e12));
  } else {
    return depositAmount;
  }
}

function getZapDepositAmount(
  depositAmount: BigNumber,
  tokenKey: string,
): [BigNumber, BigNumber, BigNumber] {
  switch (tokenKey) {
    case 'dai':
      return [depositAmount, BigNumber.from('0'), BigNumber.from('0')];
    case 'usdc':
      return [BigNumber.from('0'), depositAmount, BigNumber.from('0')];
    case 'usdt':
      return [BigNumber.from('0'), BigNumber.from('0'), depositAmount];
  }
}

export default function Butter(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { library, account, activate } = context;
  const { contracts, hysiDependencyContracts } = useContext(ContractsContext);
  const { dispatch } = useContext(store);
  const [batchProcessTokens, setBatchProcessTokens] =
    useState<BatchProcessTokens>();
  const [selectedToken, setSelectedToken] = useState<SelectedToken>();
  const [useZap, setUseZap] = useState<Boolean>(false);
  const [depositAmount, setDepositAmount] = useState<BigNumber>(
    BigNumber.from('0'),
  );
  const [redeeming, setRedeeming] = useState<Boolean>(false);
  const [useUnclaimedDeposits, setUseUnclaimedDeposits] =
    useState<Boolean>(false);
  const [wait, setWait] = useState<Boolean>(false);
  const [butterBatchAdapter, setButterBatchAdapter] =
    useState<ButterBatchAdapter>();
  const [batches, setBatches] = useState<AccountBatch[]>();
  const [timeTillBatchProcessing, setTimeTillBatchProcessing] =
    useState<TimeTillBatchProcessing[]>();
  const [claimableBatches, setClaimableBatches] = useState<ClaimableBatches>();

  useEffect(() => {
    if (!library || !contracts) {
      return;
    }
    setButterBatchAdapter(new ButterBatchAdapter(contracts.butterBatch));
  }, [library, account]);

  useEffect(() => {
    if (!butterBatchAdapter || !account) {
      return;
    }
    getBatchProcessToken(
      butterBatchAdapter,
      contracts,
      hysiDependencyContracts,
      account,
    ).then((res) => {
      setBatchProcessTokens(res);
      setSelectedToken({ input: res.threeCrv, output: res.butter });
    });

    butterBatchAdapter.getBatches(account).then((res) => setBatches(res));
    butterBatchAdapter
      .calcBatchTimes(library)
      .then((res) => setTimeTillBatchProcessing(res));
  }, [butterBatchAdapter, account]);

  useEffect(() => {
    if (!batches || !batchProcessTokens || claimableBatches) {
      return;
    }
    const claimableMintBatches = batches.filter(
      (batch) => batch.batchType == BatchType.Mint && batch.claimable,
    );
    const claimableRedeemBatches = batches.filter(
      (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
    );
    const newBatchProcessTokens = { ...batchProcessTokens };
    newBatchProcessTokens.butter.claimableBalance =
      getClaimableBalance(claimableMintBatches);
    newBatchProcessTokens.threeCrv.claimableBalance = getClaimableBalance(
      claimableRedeemBatches,
    );
    setBatchProcessTokens(newBatchProcessTokens);
    setClaimableBatches({
      mint: claimableMintBatches,
      redeem: claimableRedeemBatches,
    });
  }, [batches, batchProcessTokens]);

  useEffect(() => {
    if (!batchProcessTokens) {
      return;
    }
    if (redeeming) {
      setSelectedToken({
        input: batchProcessTokens.butter,
        output: batchProcessTokens.threeCrv,
      });
    } else {
      setSelectedToken({
        input: batchProcessTokens.threeCrv,
        output: batchProcessTokens.butter,
      });
    }
    setUseZap(false);
  }, [redeeming]);

  function selectToken(token: BatchProcessToken): void {
    const zapToken = ['dai', 'usdc', 'usdt'];
    const newSelectedToken = { ...selectedToken };
    if (redeeming) {
      newSelectedToken.output = token;
    } else {
      newSelectedToken.input = token;
    }
    if (
      zapToken.includes(newSelectedToken.output.key) ||
      zapToken.includes(newSelectedToken.input.key)
    ) {
      setUseZap(true);
    } else {
      setUseZap(false);
    }
    setSelectedToken(newSelectedToken);
  }

  function prepareHotSwap(
    batches: AccountBatch[],
    depositAmount: BigNumber,
  ): HotSwapParameter {
    let cumulatedBatchAmounts = BigNumber.from('0');
    const batchIds: String[] = [];
    const amounts: BigNumber[] = [];
    batches.forEach((batch) => {
      if (cumulatedBatchAmounts < depositAmount) {
        const missingAmount = depositAmount.sub(cumulatedBatchAmounts);
        const amountOfBatch = batch.accountClaimableTokenBalance.gt(
          missingAmount,
        )
          ? missingAmount
          : batch.accountClaimableTokenBalance;
        cumulatedBatchAmounts = cumulatedBatchAmounts.add(amountOfBatch);
        const shareValue = batch.accountClaimableTokenBalance
          .mul(parseEther('1'))
          .div(batch.accountSuppliedTokenBalance);

        batchIds.push(batch.batchId);
        amounts.push(amountOfBatch.mul(parseEther('1')).div(shareValue));
      }
    });
    return { batchIds: batchIds, amounts: amounts };
  }

  async function hotswap(
    depositAmount: BigNumber,
    batchType: BatchType,
  ): Promise<void> {
    const hotSwapParameter = prepareHotSwap(
      claimableBatches[BatchType[batchType].toLowerCase()],
      depositAmount,
    );
    toast.loading('Depositing Funds...');
    const res = await contracts.butterBatch
      .connect(library.getSigner())
      .moveUnclaimedDepositsIntoCurrentBatch(
        hotSwapParameter.batchIds as string[],
        hotSwapParameter.amounts,
        batchType === BatchType.Mint ? BatchType.Redeem : BatchType.Mint,
      )
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Funds deposited!');
          butterBatchAdapter.getBatches(account).then((res) => setBatches(res));
          getBatchProcessToken(
            butterBatchAdapter,
            contracts,
            hysiDependencyContracts,
            account,
          ).then((res) => setBatchProcessTokens(res));
        });
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error('An error occured');
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
  }

  async function deposit(
    depositAmount: BigNumber,
    batchType: BatchType,
  ): Promise<void> {
    setWait(true);
    console.log(selectedToken.input.key);
    depositAmount = adjustDepositDecimals(
      depositAmount,
      selectedToken.input.key,
    );
    if (batchType === BatchType.Mint) {
      console.log(useZap);
      const allowance = await contracts[selectedToken.input.key].allowance(
        account,
        useZap
          ? contracts.butterBatchZapper.address
          : contracts.butterBatch.address,
      );
      console.log(allowance.toString());
      console.log(depositAmount.toString());
      if (allowance.gt(depositAmount)) {
        toast.loading(`Depositing ${selectedToken.input.name}...`);
        const mintCall = useZap
          ? contracts.butterBatchZapper
              .connect(library.getSigner())
              .zapIntoBatch(
                getZapDepositAmount(depositAmount, selectedToken.input.key),
                depositAmount.mul(97).div(100),
              )
          : contracts.butterBatch
              .connect(library.getSigner())
              .depositForMint(depositAmount, account);
        const res = await mintCall
          .then((res) => {
            res.wait().then((res) => {
              toast.dismiss();
              toast.success(`${selectedToken.input.name} deposited!`);
            });
          })
          .catch((err) => {
            toast.dismiss();
            if (err.data === undefined) {
              toast.error('An error occured');
            } else {
              toast.error(err.data.message.split("'")[1]);
            }
          });
      } else {
        approve(contracts[selectedToken.input.key]);
      }
    } else {
      const allowance = await contracts.butter.allowance(
        account,
        contracts.butterBatch.address,
      );
      if (allowance.gt(depositAmount)) {
        toast.loading('Depositing Butter...');
        await contracts.butterBatch
          .connect(library.getSigner())
          .depositForRedeem(depositAmount)
          .then((res) => {
            res.wait().then((res) => {
              toast.dismiss();
              toast.success('Butter deposited!');
              butterBatchAdapter
                .getBatches(account)
                .then((res) => setBatches(res));
              getBatchProcessToken(
                butterBatchAdapter,
                contracts,
                hysiDependencyContracts,
                account,
              ).then((res) => setBatchProcessTokens(res));
            });
          })
          .catch((err) => {
            toast.dismiss();
            if (err.data === undefined) {
              toast.error('An error occured');
            } else {
              toast.error(err.data.message.split("'")[1]);
            }
          });
      } else {
        approve(contracts.butter);
      }
    }
    setWait(false);
  }

  async function claim(
    batchId: string,
    useZap?: boolean,
    outputToken?: string,
  ): Promise<void> {
    toast.loading('Claiming Batch...');
    if (true) {
      console.log(
        adjustDepositDecimals(
          batches
            .find((batch) => batch.batchId === batchId)
            .accountClaimableTokenBalance.mul(batchProcessTokens.threeCrv.price)
            .div(batchProcessTokens[outputToken].price),
          outputToken,
        ).toString(),
      );
    }
    let call;
    if (useZap) {
      call = contracts.butterBatchZapper
        .connect(library.getSigner())
        .claimAndSwapToStable(
          batchId,
          TOKEN_INDEX[outputToken],
          adjustDepositDecimals(
            batches
              .find((batch) => batch.batchId === batchId)
              .accountClaimableTokenBalance.mul(
                batchProcessTokens.threeCrv.price,
              )
              .div(batchProcessTokens[outputToken].price),
            outputToken,
          )
            .mul(97)
            .div(100),
        );
    } else {
      call = contracts.butterBatch
        .connect(library.getSigner())
        .claim(batchId, account);
    }
    await call
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Batch claimed!');
        });
        butterBatchAdapter.getBatches(account).then((res) => setBatches(res));
        getBatchProcessToken(
          butterBatchAdapter,
          contracts,
          hysiDependencyContracts,
          account,
        ).then((res) => setBatchProcessTokens(res));
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error('An error occured');
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
  }

  async function withdraw(
    batchId: string,
    amount: BigNumber,
    useZap?: boolean,
    stableIndex?: number,
    minMintAmount?: BigNumber,
  ): Promise<void> {
    toast.loading('Withdrawing from Batch...');
    let call;
    if (useZap) {
      call = contracts.butterBatchZapper
        .connect(library.getSigner())
        .zapOutOfBatch(batchId, amount, stableIndex, minMintAmount);
    } else {
      call = contracts.butterBatch
        .connect(library.getSigner())
        .withdrawFromBatch(batchId, amount, account);
    }
    await call
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Funds withdrawn!');
          butterBatchAdapter.getBatches(account).then((res) => setBatches(res));
          getBatchProcessToken(
            butterBatchAdapter,
            contracts,
            hysiDependencyContracts,
            account,
          ).then((res) => setBatchProcessTokens(res));
        });
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error('An error occured');
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
  }

  async function approve(contract: Contract): Promise<void> {
    setWait(true);
    toast.loading('Approving Token...');
    await contract
      .connect(library.getSigner())
      .approve(
        useZap
          ? contracts.butterBatchZapper.address
          : contracts.butterBatch.address,
        utils.parseEther('100000000'),
      )
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Token approved!');
        });
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error('An error occured');
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
    setWait(false);
  }

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="w-9/12 mx-auto flex flex-row mt-14">
          <div className="w-1/3">
            <div className="">
              <h1 className="text-3xl text-gray-800 font-medium">
                Popcorn Yield Optimizer
              </h1>
              <p className="text-lg text-gray-500">
                Deposit your stablecoins and watch your money grow
              </p>
            </div>
            <div className="mt-12">
              {claimableBatches && (
                <MintRedeemInterface
                  token={batchProcessTokens}
                  selectedToken={selectedToken}
                  selectToken={selectToken}
                  redeeming={redeeming}
                  setRedeeming={setRedeeming}
                  depositAmount={depositAmount}
                  setDepositAmount={setDepositAmount}
                  deposit={useUnclaimedDeposits ? hotswap : deposit}
                  depositDisabled={
                    useUnclaimedDeposits
                      ? isDepositDisabled(
                          depositAmount,
                          selectedToken.input.claimableBalance,
                          wait,
                        )
                      : isDepositDisabled(
                          depositAmount,
                          selectedToken.input.balance,
                          wait,
                        )
                  }
                  useUnclaimedDeposits={useUnclaimedDeposits}
                  setUseUnclaimedDeposits={setUseUnclaimedDeposits}
                />
              )}
              <BatchProcessingInfo
                timeTillBatchProcessing={timeTillBatchProcessing}
              />
            </div>
          </div>
          <div className="w-2/3 mt-28">
            <div className="flex flex-row items-center">
              <div className="w-1/3 mr-2">
                <StatInfoCard
                  title="Butter Value"
                  content={`${
                    batchProcessTokens?.butter
                      ? formatAndRoundBigNumber(
                          batchProcessTokens?.butter?.price,
                        )
                      : '-'
                  } $`}
                  icon={{ icon: 'Money', color: 'bg-blue-300' }}
                />
              </div>
              <div className="w-1/3 mx-2">
                <StatInfoCard
                  title="Claimable Butter"
                  content={
                    batches
                      ? String(
                          batches
                            .filter(
                              (batch) => batch.batchType === BatchType.Mint,
                            )
                            .reduce((total, batch) => {
                              return (
                                total +
                                bigNumberToNumber(
                                  batch.accountClaimableTokenBalance,
                                )
                              );
                            }, 0),
                        )
                      : '-'
                  }
                  icon={{ icon: 'Key', color: 'bg-green-400' }}
                />
              </div>
              <div className="w-1/3 ml-2">
                <StatInfoCard
                  title="Pending Withdraw"
                  content={`${
                    batches
                      ? batches
                          .filter(
                            (batch) => batch.batchType === BatchType.Redeem,
                          )
                          .reduce((total, batch) => {
                            return (
                              total +
                              bigNumberToNumber(
                                batch.accountSuppliedTokenBalance,
                              )
                            );
                          }, 0)
                      : '-'
                  } BTR`}
                  icon={{ icon: 'Wait', color: 'bg-yellow-500' }}
                />
              </div>
            </div>
            <div className="w-full h-min-content pl-10 pr-2 pt-12 pb-10 mt-8 rounded-4xl bg-primaryLight">
              <div className="z-10">
                <h2 className="text-2xl font-medium w-1/4">
                  We will bring the chart soon to you!
                </h2>
                <p className="text-base text-gray-700 w-1/3">
                  Currently we are developing awesome chart for you that help to
                  visualize how your HYSI growth
                </p>
              </div>
              <div className="w-full flex justify-end -mt-36">
                <img
                  src="/images/chartPlaceholder.svg"
                  alt="chartPlaceholder"
                  className="h-112"
                />
              </div>
            </div>
          </div>
        </div>

        {batches?.length > 0 && (
          <div className="mt-16 w-9/12 mx-auto pb-12">
            <h2></h2>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <ClaimableBatches
                      batches={batches}
                      claim={claim}
                      withdraw={withdraw}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
