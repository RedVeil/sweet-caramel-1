import { parseEther } from "@ethersproject/units";
import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import {
  BasicIssuanceModule,
  ButterBatchProcessing,
  ButterBatchProcessingZapper,
  ButterWhaleProcessing,
  Curve3Pool,
  ISetToken,
} from "@popcorn/hardhat/typechain";
import { AccountBatch, Address, BatchProcessTokens, BatchType, ButterBatchData, Token } from "@popcorn/utils/src/types";
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
  setBasicIssuanceModule: BasicIssuanceModule;
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

async function getToken(
  butterAdapter: ButterBatchAdapter,
  account: string,
  tokens: Stables,
  threePool: Curve3Pool,
  butter: ISetToken,
  setBasicIssuanceModule: BasicIssuanceModule,
  mainContract: ButterBatchProcessing | ButterWhaleProcessing,
  zapperContract?: ButterBatchProcessingZapper,
): Promise<BatchProcessTokens> {
  const defaultErc20Decimals = 18;
  return {
    butter: {
      name: "BTR",
      key: "butter",
      balance: await butter.balanceOf(account),
      allowance: await butter.allowance(account, mainContract.address),
      claimableBalance: constants.Zero,
      price: await mainContract.valueOfComponents(
        ...(await setBasicIssuanceModule.getRequiredComponentUnitsForIssue(butter.address, parseEther("1"))),
      ),
      decimals: defaultErc20Decimals,
      img: "butter.png",
      contract: butter,
    },
    threeCrv: {
      name: "3CRV",
      key: "threeCrv",
      balance: await tokens.threeCrv.contract.balanceOf(account),
      allowance: await tokens.threeCrv.contract.allowance(account, mainContract.address),
      claimableBalance: constants.Zero,
      price: await butterAdapter.getThreeCrvPrice(threePool),
      decimals: defaultErc20Decimals,
      img: "3crv.png",
      contract: tokens.threeCrv.contract,
    },
    dai: {
      name: "DAI",
      key: "dai",
      balance: await tokens.dai.contract.balanceOf(account),
      allowance: await tokens.dai.contract.allowance(
        account,
        zapperContract ? zapperContract.address : mainContract.address,
      ),
      price: await butterAdapter.getStableCoinPrice(threePool, [parseEther("1"), constants.Zero, constants.Zero]),
      decimals: defaultErc20Decimals,
      img: "dai.webp",
      contract: tokens.dai.contract,
    },
    usdc: {
      name: "USDC",
      key: "usdc",
      balance: (await tokens.usdc.contract.balanceOf(account)).mul(BigNumber.from(1e12)),
      allowance: await tokens.usdc.contract.allowance(
        account,
        zapperContract ? zapperContract.address : mainContract.address,
      ),
      price: await butterAdapter.getStableCoinPrice(threePool, [constants.Zero, BigNumber.from(1e6), constants.Zero]),
      decimals: defaultErc20Decimals,
      img: "usdc.webp",
      contract: tokens.usdc.contract,
    },
    usdt: {
      name: "USDT",
      key: "usdt",
      balance: (await tokens.usdt.contract.balanceOf(account)).mul(BigNumber.from(1e12)),
      allowance: await tokens.usdt.contract.allowance(
        account,
        zapperContract ? zapperContract.address : mainContract.address,
      ),
      price: await butterAdapter.getStableCoinPrice(threePool, [constants.Zero, constants.Zero, BigNumber.from(1e6)]),
      decimals: defaultErc20Decimals,
      img: "usdt.webp",
      contract: tokens.usdt.contract,
    },
  };
}
function getClaimableBalance(claimableBatches: AccountBatch[]): BigNumber {
  return claimableBatches.reduce(
    (acc: BigNumber, batch: AccountBatch) => acc.add(batch.accountClaimableTokenBalance),
    ethers.constants.Zero,
  );
}

export async function getData(dependencies: ButterBatchDependenciesInput);
export async function getData(dependencies: ButterWhaleDependenciesInput);
export async function getData(dependencies: ButterDependenciesInput): Promise<ButterBatchData> {
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
  const currentBatches = await butterBatchAdapter.getCurrentBatches();
  const totalButterSupply = await butterBatchAdapter.getTokenSupply(butter);
  const accountBatches = await butterBatchAdapter.getBatches(account);

  const claimableMintBatches = accountBatches.filter((batch) => batch.batchType == BatchType.Mint && batch.claimable);
  const claimableRedeemBatches = accountBatches.filter(
    (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
  );

  const batchProcessTokenRes = await getToken(
    butterBatchAdapter,
    account,
    { dai, usdc, usdt, threeCrv },
    threePool,
    butter,
    setBasicIssuanceModule,
    mainContract,
    zapperContract,
  );

  batchProcessTokenRes.butter.claimableBalance = getClaimableBalance(claimableMintBatches);
  batchProcessTokenRes.threeCrv.claimableBalance = getClaimableBalance(claimableRedeemBatches);

  const response: ButterBatchData = {
    accountBatches,
    currentBatches,
    butterSupply: totalButterSupply,
    claimableMintBatches,
    claimableRedeemBatches,
    batchProcessTokens: batchProcessTokenRes,
  };
  return response;
}
