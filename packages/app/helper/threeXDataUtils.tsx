import { parseEther } from "@ethersproject/units";
import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import ThreeXBatchAdapter from "@popcorn/hardhat/lib/adapters/ThreeXBatchAdapter";
import {
  BasicIssuanceModule,
  Curve3Pool,
  ISetToken,
  ThreeXBatchProcessing,
  ThreeXWhaleProcessing,
  ThreeXZapper,
} from "@popcorn/hardhat/typechain";
import { AccountBatch, Address, BatchMetadata, BatchType, Token, Tokens } from "@popcorn/utils/src/types";
import { BigNumber, ethers } from "ethers";

interface Stables {
  dai: Token;
  usdc: Token;
  usdt: Token;
}

async function getToken(
  butterAdapter: ButterBatchAdapter,
  account: string,
  tokens: Stables,
  threePool: Curve3Pool,
  threeX: ISetToken,
  setBasicIssuanceModule: BasicIssuanceModule,
  mainContract: ThreeXBatchProcessing,
  instantContract?: ThreeXWhaleProcessing,
  zapperContract?: ThreeXZapper,
): Promise<Tokens> {
  const defaultErc20Decimals = 18;
  return {
    threeX: {
      name: "3X",
      key: "threeX",
      balance: await threeX.balanceOf(account),
      allowance: await threeX.allowance(account, instantContract ? instantContract.address : mainContract.address),
      claimableBalance: BigNumber.from("0"),
      price: await mainContract.valueOfComponents(
        ...(await setBasicIssuanceModule.getRequiredComponentUnitsForIssue(threeX.address, parseEther("1"))),
      ),
      decimals: defaultErc20Decimals,
      img: "threeXborderless.png",
      contract: threeX,
    },
    dai: {
      name: "DAI",
      key: "dai",
      balance: await tokens.dai.contract.balanceOf(account),
      allowance: await tokens.dai.contract.allowance(
        account,
        instantContract ? instantContract.address : zapperContract?.address,
      ),
      price: await butterAdapter.getStableCoinPrice(threePool, [
        parseEther("1"),
        BigNumber.from("0"),
        BigNumber.from("0"),
      ]),
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
        instantContract ? instantContract.address : mainContract.address,
      ),
      price: await butterAdapter.getStableCoinPrice(threePool, [
        BigNumber.from("0"),
        BigNumber.from(1e6),
        BigNumber.from("0"),
      ]),
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
        instantContract ? instantContract.address : zapperContract?.address,
      ),
      price: await butterAdapter.getStableCoinPrice(threePool, [
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from(1e6),
      ]),
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
export async function getData(
  account: Address,
  dai: Token,
  usdc: Token,
  usdt: Token,
  threePool: Curve3Pool,
  butter: ISetToken,
  setBasicIssuanceModule: BasicIssuanceModule,
  mainContract: ThreeXBatchProcessing,
  zapperContract?: ThreeXZapper,
): Promise<BatchMetadata> {
  const threeXBatchAdapter = new ThreeXBatchAdapter(mainContract);
  const currentBatches = await threeXBatchAdapter.getCurrentBatches();
  const totalSupply = await butter.totalSupply();
  const accountBatches = await threeXBatchAdapter.getBatches(account);

  const claimableMintBatches = accountBatches.filter((batch) => batch.batchType == BatchType.Mint && batch.claimable);
  const claimableRedeemBatches = accountBatches.filter(
    (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
  );

  const tokenResponse = await getToken(
    threeXBatchAdapter,
    account,
    { dai, usdc, usdt },
    threePool,
    butter,
    setBasicIssuanceModule,
    mainContract,
    null,
    zapperContract,
  );

  tokenResponse.threeX.claimableBalance = getClaimableBalance(claimableMintBatches);
  tokenResponse.usdc.claimableBalance = getClaimableBalance(claimableRedeemBatches).mul(BigNumber.from(1e12));

  const response: BatchMetadata = {
    accountBatches,
    currentBatches,
    totalSupply,
    claimableMintBatches,
    claimableRedeemBatches,
    tokens: tokenResponse,
  };
  return response;
}

export async function getDataWhale(
  account: Address,
  dai: Token,
  usdc: Token,
  usdt: Token,
  threePool: Curve3Pool,
  butter: ISetToken,
  setBasicIssuanceModule: BasicIssuanceModule,
  instantContract: ThreeXWhaleProcessing,
  batchContract: ThreeXBatchProcessing,
): Promise<BatchMetadata> {
  const threeXBatchAdapter = new ThreeXBatchAdapter(batchContract);
  const currentBatches = await threeXBatchAdapter.getCurrentBatches();
  const totalSupply = await butter.totalSupply();
  const accountBatches = await threeXBatchAdapter.getBatches(account);

  const claimableMintBatches = accountBatches.filter((batch) => batch.batchType == BatchType.Mint && batch.claimable);
  const claimableRedeemBatches = accountBatches.filter(
    (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
  );

  const tokenResponse = await getToken(
    threeXBatchAdapter,
    account,
    { dai, usdc, usdt },
    threePool,
    butter,
    setBasicIssuanceModule,
    batchContract,
    instantContract,
  );

  tokenResponse.threeX.claimableBalance = getClaimableBalance(claimableMintBatches);
  tokenResponse.usdc.claimableBalance = getClaimableBalance(claimableRedeemBatches).mul(BigNumber.from(1e12));

  const response: BatchMetadata = {
    accountBatches,
    currentBatches,
    totalSupply,
    claimableMintBatches,
    claimableRedeemBatches,
    tokens: tokenResponse,
  };
  return response;
}
