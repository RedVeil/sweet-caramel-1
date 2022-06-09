import { parseEther } from "@ethersproject/units";
import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import FourXBatchAdapter from "@popcorn/hardhat/lib/adapters/FourXBatchAdapter";
import {
  BasicIssuanceModule,
  Curve3Pool,
  FourXBatchProcessing,
  FourXZapper,
  ISetToken,
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
  fourX: ISetToken,
  setBasicIssuanceModule: BasicIssuanceModule,
  mainContract: FourXBatchProcessing,
  zapperContract?: FourXZapper,
): Promise<Tokens> {
  const defaultErc20Decimals = 18;
  return {
    fourX: {
      name: "4X",
      key: "fourX",
      balance: await fourX.balanceOf(account),
      allowance: await fourX.allowance(account, mainContract.address),
      claimableBalance: BigNumber.from("0"),
      price: await mainContract.valueOfComponents(
        ...(await setBasicIssuanceModule.getRequiredComponentUnitsForIssue(fourX.address, parseEther("1"))),
      ),
      decimals: defaultErc20Decimals,
      img: "fourX.svg",
      contract: fourX,
    },
    dai: {
      name: "DAI",
      key: "dai",
      balance: await tokens.dai.contract.balanceOf(account),
      allowance: await tokens.dai.contract.allowance(account, zapperContract?.address),
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
      allowance: await tokens.usdc.contract.allowance(account, mainContract.address),
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
      allowance: await tokens.usdt.contract.allowance(account, zapperContract?.address),
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
  mainContract: FourXBatchProcessing,
  zapperContract?: FourXZapper,
): Promise<BatchMetadata> {
  const fourXBatchAdapter = new FourXBatchAdapter(mainContract);
  const currentBatches = await fourXBatchAdapter.getCurrentBatches();
  const totalSupply = await butter.totalSupply();
  const accountBatches = await fourXBatchAdapter.getBatches(account);

  const claimableMintBatches = accountBatches.filter((batch) => batch.batchType == BatchType.Mint && batch.claimable);
  const claimableRedeemBatches = accountBatches.filter(
    (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
  );

  const tokenResponse = await getToken(
    fourXBatchAdapter,
    account,
    { dai, usdc, usdt },
    threePool,
    butter,
    setBasicIssuanceModule,
    mainContract,
    zapperContract,
  );

  tokenResponse.fourX.claimableBalance = getClaimableBalance(claimableMintBatches);
  tokenResponse.usdc.claimableBalance = getClaimableBalance(claimableRedeemBatches);

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
