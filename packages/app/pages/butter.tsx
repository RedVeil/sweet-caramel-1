import { Web3Provider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import {
  AccountBatch,
  BatchType,
} from '@popcorn/contracts/adapters/HYSIBatchInteraction/HYSIBatchInteractionAdapter';
import { useWeb3React } from '@web3-react/core';
import BatchProcessingInfo from 'components/BatchHysi/BatchProcessingInfo';
import ClaimableBatches from 'components/BatchHysi/ClaimableBatches';
import MintRedeemInterface from 'components/BatchHysi/MintRedeemInterface';
import Navbar from 'components/NavBar/NavBar';
import { ContractsContext } from 'context/Web3/contracts';
import { BigNumber, Contract, utils } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  ComponentMap,
  HYSIBatchInteractionAdapter,
  TimeTillBatchProcessing,
} from '../../../contracts';

interface HotSwapParameter {
  batchIds: String[];
  amounts: BigNumber[];
}
interface ClaimableBatches {
  balance: BigNumber;
  batches: AccountBatch[];
}

function getClaimableBalance(claimableBatches: AccountBatch[]): BigNumber {
  return claimableBatches.reduce(
    (acc: BigNumber, batch: AccountBatch) =>
      acc.add(batch.accountClaimableTokenBalance),
    BigNumber.from('0'),
  );
}

function isDepositDisabled(
  depositAmount: BigNumber,
  hysiBalance: BigNumber,
  threeCrvBalance: BigNumber,
  wait: Boolean,
  withdrawal: Boolean,
): boolean {
  const balance = withdrawal ? hysiBalance : threeCrvBalance;
  return depositAmount > balance && !wait;
}

export default function Butter(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { library, account, activate } = context;
  const { contracts, hysiDependencyContracts } = useContext(ContractsContext);
  const [hysiBalance, setHysiBalance] = useState<BigNumber>();
  const [threeCrvBalance, setThreeCrvBalance] = useState<BigNumber>();
  const [hysiPrice, setHysiPrice] = useState<BigNumber>();
  const [threeCrvPrice, setThreeCrvPrice] = useState<BigNumber>();
  const [depositAmount, setDepositAmount] = useState<BigNumber>(
    BigNumber.from('0'),
  );
  const [withdrawal, setwithdrawal] = useState<Boolean>(false);
  const [useUnclaimedDeposits, setUseUnclaimedDeposits] =
    useState<Boolean>(false);
  const [wait, setWait] = useState<Boolean>(false);
  const [batchHysiAdapter, setBatchHysiAdapter] =
    useState<HYSIBatchInteractionAdapter>();
  const [batches, setBatches] = useState<AccountBatch[]>();
  const [timeTillBatchProcessing, setTimeTillBatchProcessing] =
    useState<TimeTillBatchProcessing[]>();
  const [claimableBatches, setClaimableBatches] =
    useState<ClaimableBatches[]>();

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

  useEffect(() => {
    if (!library || !contracts) {
      return;
    }
    setBatchHysiAdapter(new HYSIBatchInteractionAdapter(contracts.batchHysi));
    if (account) {
      contracts.hysi.balanceOf(account).then((res) => setHysiBalance(res));
      contracts.threeCrv
        .balanceOf(account)
        .then((res) => setThreeCrvBalance(res));
    }
  }, [library, account]);

  useEffect(() => {
    if (!batchHysiAdapter) {
      return;
    }
    batchHysiAdapter
      .getHysiPrice(hysiDependencyContracts.basicIssuanceModule, {
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
      } as ComponentMap)
      .then((res) => setHysiPrice(res));

    batchHysiAdapter
      .getThreeCrvPrice(hysiDependencyContracts.triPool)
      .then((res) => setThreeCrvPrice(res));
    batchHysiAdapter.getBatches(account).then((res) => setBatches(res));
    batchHysiAdapter
      .calcBatchTimes(library)
      .then((res) => setTimeTillBatchProcessing(res));
  }, [batchHysiAdapter]);

  useEffect(() => {
    if (!batches) {
      return;
    }
    const claimableMintBatches = batches.filter(
      (batch) => batch.batchType == BatchType.Mint && batch.claimable,
    );
    const claimableRedeemBatches = batches.filter(
      (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
    );

    setClaimableBatches([
      {
        balance: getClaimableBalance(claimableMintBatches),
        batches: claimableMintBatches,
      },
      {
        balance: getClaimableBalance(claimableRedeemBatches),
        batches: claimableRedeemBatches,
      },
    ]);
  }, [batches]);

  async function hotswap(
    depositAmount: BigNumber,
    batchType: BatchType,
  ): Promise<void> {
    const hotSwapParameter = prepareHotSwap(
      claimableBatches[batchType === BatchType.Mint ? 1 : 0].batches,
      depositAmount,
    );
    toast.loading('Depositing Funds...');
    const res = await contracts.batchHysi
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
          batchHysiAdapter.getBatches(account).then((res) => setBatches(res));
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
    if (batchType === BatchType.Mint) {
      const allowance = await contracts.threeCrv.allowance(
        account,
        contracts.batchHysi.address,
      );
      if (allowance >= depositAmount) {
        toast.loading('Depositing 3CRV...');
        const res = await contracts.batchHysi
          .connect(library.getSigner())
          .depositForMint(depositAmount, account)
          .then((res) => {
            res.wait().then((res) => {
              toast.dismiss();
              toast.success('3CRV deposited!');
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
        approve(contracts.threeCrv);
      }
    } else {
      const allowance = await contracts.hysi.allowance(
        account,
        contracts.batchHysi.address,
      );
      console.log('redeem allowance', allowance.toString());
      if (allowance >= depositAmount) {
        toast.loading('Depositing HYSI...');
        await contracts.batchHysi
          .connect(library.getSigner())
          .depositForRedeem(depositAmount)
          .then((res) => {
            res.wait().then((res) => {
              toast.dismiss();
              toast.success('HYSI deposited!');
              batchHysiAdapter
                .getBatches(account)
                .then((res) => setBatches(res));
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
        approve(contracts.hysi);
      }
    }
    setWait(false);
  }

  async function claim(batchId: string): Promise<void> {
    toast.loading('Claiming Batch...');
    await contracts.batchHysi
      .connect(library.getSigner())
      .claim(batchId, account)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Batch claimed!');
        });
        batchHysiAdapter.getBatches(account).then((res) => setBatches(res));
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

  async function withdraw(batchId: string, amount: BigNumber): Promise<void> {
    toast.loading('Withdrawing from Batch...');
    await contracts.batchHysi
      .connect(library.getSigner())
      .withdrawFromBatch(batchId, amount, account)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Funds withdrawn!');
        });
        batchHysiAdapter.getBatches(account).then((res) => setBatches(res));
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
      .approve(contracts.batchHysi.address, utils.parseEther('100000000'))
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
    <div>
      <Navbar />
      <Toaster position="top-right" />
      <div className="bg-gray-800 pb-32">
        <header className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white text-center">
              Popcorn Yield Optimizer
            </h1>
          </div>
        </header>
      </div>
      <main className="-mt-32">
        <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
          {batchHysiAdapter && (
            <MintRedeemInterface
              threeCrvBalance={
                useUnclaimedDeposits
                  ? claimableBatches[1].balance
                  : threeCrvBalance
              }
              threeCrvPrice={threeCrvPrice}
              hysiBalance={
                useUnclaimedDeposits ? claimableBatches[0].balance : hysiBalance
              }
              hysiPrice={hysiPrice}
              withdrawal={withdrawal}
              setwithdrawal={setwithdrawal}
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              deposit={useUnclaimedDeposits ? hotswap : deposit}
              depositDisabled={
                useUnclaimedDeposits
                  ? isDepositDisabled(
                      depositAmount,
                      claimableBatches[0].balance,
                      claimableBatches[1].balance,
                      wait,
                      withdrawal,
                    )
                  : isDepositDisabled(
                      depositAmount,
                      hysiBalance,
                      threeCrvBalance,
                      wait,
                      withdrawal,
                    )
              }
              useUnclaimedDeposits={useUnclaimedDeposits}
              setUseUnclaimedDeposits={setUseUnclaimedDeposits}
            />
          )}
          <BatchProcessingInfo
            timeTillBatchProcessing={timeTillBatchProcessing}
          />
          {batches?.length > 0 && (
            <div className="mt-16">
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
      </main>
    </div>
  );
}
