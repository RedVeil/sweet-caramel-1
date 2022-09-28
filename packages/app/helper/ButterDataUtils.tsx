import { parseEther } from "@ethersproject/units";
import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import {
  ButterBatchProcessing,
  ButterBatchProcessingZapper,
  ButterWhaleProcessing,
  Curve3Pool,
  ERC20,
  IBasicIssuanceModule,
  ISetToken,
} from "@popcorn/hardhat/typechain";
import { AccountBatch, Address, BatchMetadata, BatchType, Token } from "@popcorn/utils/src/types";
import { BigNumber, constants, ethers } from "ethers";

interface Stables {
  dai: Token;
  usdc: Token;
  usdt: Token;
  threeCrv: Token;
}

interface BaseButterDependenciesInput {
  butterBatchAdapter: ButterBatchAdapter;
  account: Address;
  dai: Token;
  usdc: Token;
  usdt: Token;
  threeCrv: Token;
  threePool: Curve3Pool;
  butter: ISetToken;
  setBasicIssuanceModule: IBasicIssuanceModule;
}

interface ButterBatchDependenciesInput extends BaseButterDependenciesInput {
  mainContract: ButterBatchProcessing;
  zapperContract: ButterBatchProcessingZapper;
}

interface ButterWhaleDependenciesInput extends BaseButterDependenciesInput {
  mainContract: ButterWhaleProcessing;
}

interface ButterDependenciesInput extends BaseButterDependenciesInput {
  mainContract: ButterBatchProcessing | ButterWhaleProcessing;
  zapperContract?: ButterBatchProcessingZapper;
}

function getClaimableBalance(claimableBatches: AccountBatch[]): BigNumber {
  return claimableBatches.reduce(
    (acc: BigNumber, batch: AccountBatch) => acc.add(batch.accountClaimableTokenBalance),
    ethers.constants.Zero,
  );
}

export async function getData(dependencies: ButterBatchDependenciesInput);
export async function getData(dependencies: ButterWhaleDependenciesInput);
export async function getData(dependencies: ButterDependenciesInput): Promise<BatchMetadata> {
  const {
    butterBatchAdapter,
    account,
    dai,
    usdc,
    usdt,
    threeCrv,
    threePool,
    butter,
    setBasicIssuanceModule,
    mainContract,
    zapperContract,
  } = dependencies;

  const defaultErc20Decimals = 18;

  const currentBatches = await butterBatchAdapter.getCurrentBatches();
  const totalButterSupply = await butter.totalSupply();
  const accountBatches = await butterBatchAdapter.getBatches(account);

  const claimableMintBatches = accountBatches.filter((batch) => batch.batchType == BatchType.Mint && batch.claimable);
  const claimableRedeemBatches = accountBatches.filter(
    (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
  );

  const tokenResponse: Token[] = [
    {
      name: "BTR",
      address: butter.address,
      symbol: "BTR",
      balance: await butter.balanceOf(account),
      allowance: await butter.allowance(account, mainContract.address),
      price: await mainContract.valueOfComponents(
        ...(await setBasicIssuanceModule.getRequiredComponentUnitsForIssue(butter.address, parseEther("1"))),
      ),
      decimals: defaultErc20Decimals,
      icon: "/images/tokens/BTR.svg",
      contract: butter as unknown as ERC20,
      claimableBalance: getClaimableBalance(claimableMintBatches),
    },
    {
      ...threeCrv,
      price: await butterBatchAdapter.getThreeCrvPrice(threePool),
      balance: await threeCrv.contract.balanceOf(account),
      allowance: await threeCrv.contract.allowance(account, mainContract.address),
      decimals: defaultErc20Decimals,
      claimableBalance: getClaimableBalance(claimableRedeemBatches),
    },
    {
      ...dai,
      price: await butterBatchAdapter.getStableCoinPrice(threePool, [parseEther("1"), constants.Zero, constants.Zero]),
      balance: await dai.contract.balanceOf(account),
      allowance: await dai.contract.allowance(account, zapperContract ? zapperContract.address : mainContract.address),
      decimals: defaultErc20Decimals,
    },
    {
      ...usdc,
      price: await butterBatchAdapter.getStableCoinPrice(threePool, [
        constants.Zero,
        BigNumber.from(1e6),
        constants.Zero,
      ]),
      balance: (await usdc.contract.balanceOf(account)).mul(BigNumber.from(1e12)),
      allowance: await usdc.contract.allowance(account, zapperContract ? zapperContract.address : mainContract.address),
      decimals: defaultErc20Decimals,
    },
    {
      ...usdt,
      price: await butterBatchAdapter.getStableCoinPrice(threePool, [
        constants.Zero,
        constants.Zero,
        BigNumber.from(1e6),
      ]),
      balance: (await usdt.contract.balanceOf(account)).mul(BigNumber.from(1e12)),
      allowance: await usdt.contract.allowance(account, zapperContract ? zapperContract.address : mainContract.address),
      decimals: defaultErc20Decimals,
    },
  ];

  const response: BatchMetadata = {
    accountBatches,
    currentBatches,
    totalSupply: totalButterSupply,
    claimableMintBatches,
    claimableRedeemBatches,
    tokens: tokenResponse,
  };
  return response;
}
