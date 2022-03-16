import { parseEther } from "@ethersproject/units";
import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import {
  BasicIssuanceModule,
  ButterBatchProcessing,
  ButterBatchProcessingZapper,
  Curve3Pool,
  ISetToken,
} from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { AccountBatch, Address, BatchProcessTokens, BatchType, ButterBatchData, Token } from "@popcorn/utils/src/types";
import { BigNumber, ethers } from "ethers";
import useButter from "hooks/butter/useButter";
import useButterBatch from "hooks/butter/useButterBatch";
import useButterBatchAdapter from "hooks/butter/useButterBatchAdapter";
import useButterBatchZapper from "hooks/butter/useButterBatchZapper";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import useBasicIssuanceModule from "./useBasicIssuanceModule";

async function getBatchProcessToken(
  butterBatchAdapter: ButterBatchAdapter,
  account: string,
  dai: Token,
  usdc: Token,
  usdt: Token,
  threeCrv: Token,
  threePool: Curve3Pool,
  butter: ISetToken,
  butterBatch: ButterBatchProcessing,
  butterBatchZapper: ButterBatchProcessingZapper,
  setBasicIssuanceModule: BasicIssuanceModule,
): Promise<BatchProcessTokens> {
  return {
    butter: {
      name: "BTR",
      key: "butter",
      balance: await butter.balanceOf(account),
      allowance: await butter.allowance(account, butterBatch.address),
      claimableBalance: BigNumber.from("0"),
      price: await butterBatch.valueOfComponents(
        ...(await setBasicIssuanceModule.getRequiredComponentUnitsForIssue(butter.address, parseEther("1"))),
      ),
      decimals: 18,
      img: "butter.png",
      contract: butter,
    },
    threeCrv: {
      name: "3CRV",
      key: "threeCrv",
      balance: await threeCrv.contract.balanceOf(account),
      allowance: await threeCrv.contract.allowance(account, butterBatch.address),
      claimableBalance: BigNumber.from("0"),
      price: await butterBatchAdapter.getThreeCrvPrice(threePool),
      decimals: threeCrv.decimals,
      img: "3crv.png",
      contract: threeCrv.contract,
    },
    dai: {
      name: "DAI",
      key: "dai",
      balance: await dai.contract.balanceOf(account),
      allowance: await dai.contract.allowance(account, butterBatchZapper.address),
      price: await butterBatchAdapter.getStableCoinPrice(threePool, [
        parseEther("1"),
        BigNumber.from("0"),
        BigNumber.from("0"),
      ]),
      decimals: dai.decimals,
      img: "dai.webp",
      contract: dai.contract,
    },
    usdc: {
      name: "USDC",
      key: "usdc",
      balance: (await usdc.contract.balanceOf(account)).mul(BigNumber.from(1e12)),
      allowance: await usdc.contract.allowance(account, butterBatchZapper.address),
      price: await butterBatchAdapter.getStableCoinPrice(threePool, [
        BigNumber.from("0"),
        BigNumber.from(1e6),
        BigNumber.from("0"),
      ]),
      decimals: usdc.decimals,
      img: "usdc.webp",
      contract: usdc.contract,
    },
    usdt: {
      name: "USDT",
      key: "usdt",
      balance: (await usdt.contract.balanceOf(account)).mul(BigNumber.from(1e12)),
      allowance: await usdt.contract.allowance(account, butterBatchZapper.address),
      price: await butterBatchAdapter.getStableCoinPrice(threePool, [
        BigNumber.from("0"),
        BigNumber.from("0"),
        BigNumber.from(1e6),
      ]),
      decimals: usdt.decimals,
      img: "usdt.webp",
      contract: usdt.contract,
    },
  };
}

function getClaimableBalance(claimableBatches: AccountBatch[]): BigNumber {
  return claimableBatches.reduce(
    (acc: BigNumber, batch: AccountBatch) => acc.add(batch.accountClaimableTokenBalance),
    ethers.constants.Zero,
    // BigNumber.from("0"),
  );
}

async function getData(
  butterBatchAdapter: ButterBatchAdapter,
  account: Address,
  dai: Token,
  usdc: Token,
  usdt: Token,
  threeCrv: Token,
  threePool: Curve3Pool,
  butter: ISetToken,
  butterBatch: ButterBatchProcessing,
  butterBatchZapper: ButterBatchProcessingZapper,
  setBasicIssuanceModule: BasicIssuanceModule,
): Promise<ButterBatchData> {
  const currentBatches = await butterBatchAdapter.getCurrentBatches();
  const totalButterSupply = await butterBatchAdapter.getTokenSupply(butter);
  const accountBatches = await butterBatchAdapter.getBatches(account);

  const claimableMintBatches = accountBatches.filter((batch) => batch.batchType == BatchType.Mint && batch.claimable);
  const claimableRedeemBatches = accountBatches.filter(
    (batch) => batch.batchType == BatchType.Redeem && batch.claimable,
  );

  const batchProcessTokenRes = await getBatchProcessToken(
    butterBatchAdapter,
    account,
    dai,
    usdc,
    usdt,
    threeCrv,
    threePool,
    butter,
    butterBatch,
    butterBatchZapper,
    setBasicIssuanceModule,
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

export default function useButterBatchData(): SWRResponse<ButterBatchData, Error> {
  const { library, contractAddresses, account, chainId } = useWeb3();
  const { data: dai } = useERC20(contractAddresses.dai);
  const { data: usdc } = useERC20(contractAddresses.usdc);
  const { data: usdt } = useERC20(contractAddresses.usdt);
  const { data: threeCrv } = useERC20(contractAddresses.threeCrv);
  const { data: butter } = useButter();
  const { data: butterBatch } = useButterBatch();
  const { data: butterBatchZapper } = useButterBatchZapper();
  const { data: setBasicIssuanceModule } = useBasicIssuanceModule();
  const { data: threePool } = useThreePool();

  const butterBatchAdapter = useButterBatchAdapter();
  const shouldFetch = !!(
    !!butterBatchAdapter &&
    contractAddresses.butter &&
    contractAddresses.usdt &&
    contractAddresses.usdc &&
    contractAddresses.dai &&
    isButterSupportedOnCurrentNetwork(chainId) &&
    dai &&
    usdc &&
    usdt &&
    threeCrv &&
    threePool &&
    butter &&
    butterBatch &&
    butterBatchZapper &&
    setBasicIssuanceModule
  );

  return useSWR(
    shouldFetch
      ? [
          `butter-batch-data`,
          library,
          contractAddresses,
          account,
          chainId,
          dai,
          usdc,
          usdt,
          threeCrv,
          threePool,
          butter,
          butterBatch,
          butterBatchZapper,
          butterBatchAdapter,
          setBasicIssuanceModule,
        ]
      : null,
    async (
      key,
      library,
      contractAddresses,
      account,
      chainId,
      dai,
      usdc,
      usdt,
      threeCrv,
      threePool,
      butter,
      butterBatch,
      butterBatchZapper,
      butterBatchAdapter,
      setBasicIssuanceModule,
    ) => {
      return await getData(
        butterBatchAdapter,
        account,
        dai,
        usdc,
        usdt,
        threeCrv,
        threePool,
        butter,
        butterBatch,
        butterBatchZapper,
        setBasicIssuanceModule,
      );
    },
  );
}
