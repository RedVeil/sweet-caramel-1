import { add, formatISO, parseISO } from "date-fns";
import { BigNumber } from "ethers/lib/ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const timestamp = (date) => {
  return Math.round(date.getTime() / 1000);
};

const getDate = (date, addTime?) => {
  return timestamp(add(parseISO(date), addTime ? addTime : {}));
};

const DAYS = 60 * 60 * 24;

export const getConstructorArgs = async (
  {
    BalancerLBPFactory,
    BalancerVault,
    POP,
    USDC,
    DAO_Agent,
    DAO_Treasury,
    deployer,
  },
  hre: HardhatRuntimeEnvironment
) => {
  switch (hre.network.name) {
    case "mainnet":
    case "arbitrum":
    case "polygon":
      let [tokens, startWeights, endWeights, amounts] = sortTokensAndWeights(
        [POP, USDC],
        [parseEther(".99"), parseEther(".01")], // start weights
        [parseEther(".50"), parseEther(".50")], // end weights
        [parseEther("1250000"), parseUnits("375000", 6)] // amounts
      );

      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "Popcorn.network (POP) Liquidity Bootstrapping Pool",
        symbol: "POP_LBP",
        tokens: tokens,
        tokenAmounts: amounts,
        startWeights: startWeights,
        endWeights: endWeights,
        swapFee: parseEther(".015"),
        durationInSeconds: 2.5 * DAYS,
        startTime: getDate("2021-11-29 08:00:00Z+00"),
        dao: {
          agent: DAO_Agent,
          treasury: DAO_Treasury,
        },
      };
    case "polygontest":
      POP = (await hre.deployments.get("POP")).address;
      USDC = (await hre.deployments.get("USDC")).address;
      [tokens, startWeights, endWeights, amounts] = sortTokensAndWeights(
        [POP, USDC],
        [parseEther(".99"), parseEther(".01")], // start weights
        [parseEther(".50"), parseEther(".50")], // end weights
        [parseEther("1250000"), parseUnits("375000", 6)] // amounts
      );

      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "Foobar Liquidity Bootstrapping Pool",
        symbol: "FOO_LBP",
        tokens: tokens,
        tokenAmounts: amounts,
        startWeights: startWeights,
        endWeights: endWeights,
        swapFee: parseEther(".015"),
        durationInSeconds: 2.5 * DAYS,
        startTime: getDate(formatISO(new Date()), { minutes: 5 }),
        dao: {
          agent: DAO_Agent,
          treasury: DAO_Treasury,
        },
      };
    case "localhost": // fork test
    case "hardhat": // fork test
      console.log("localhost! test ============== ");
      [tokens, startWeights, endWeights, amounts] = sortTokensAndWeights(
        [POP, USDC],
        [parseEther(".99"), parseEther(".01")], // start weights
        [parseEther(".50"), parseEther(".50")], // end weights
        [parseEther("100"), parseUnits("500000", 6)] // amounts
      );
      console.log({ tokens });

      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "Popcorn.network (POP) Liquidity Bootstrapping Pool",
        symbol: "POP_LBP",
        tokens: tokens,
        tokenAmounts: amounts,
        startWeights: startWeights,
        endWeights: endWeights,
        swapFee: parseEther(".015"),
        durationInSeconds: 3 * DAYS,
        startTime: getDate("2021-11-29 08:00:00Z+00"),
        dao: {
          agent: deployer,
          treasury: deployer,
        },
      };
    case "rinkeby":
      [tokens, startWeights, endWeights, amounts] = sortTokensAndWeights(
        [POP, USDC],
        [parseEther(".99"), parseEther(".01")], // start weights
        [parseEther(".50"), parseEther(".50")], // end weights
        [parseEther("100"), parseUnits("100", 6)] // amounts
      );

      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "TPOP Liquidity Bootstrapping Pool",
        symbol: "TPOP_LBP",
        tokens: tokens,
        tokenAmounts: amounts,
        startWeights: startWeights,
        endWeights: endWeights,
        swapFee: parseEther(".015"),
        durationInSeconds: 2.5 * DAYS,
        startTime: getDate(formatISO(new Date()), { minutes: 5 }),
        dao: {
          agent: DAO_Agent,
          treasury: DAO_Treasury,
        },
      };
    default:
      [tokens, startWeights, endWeights, amounts] = sortTokensAndWeights(
        [POP, USDC],
        [parseEther(".99"), parseEther(".01")], // start weights
        [parseEther(".50"), parseEther(".50")], // end weights
        [parseEther("1333333.33"), parseUnits("500000", 6)] // amounts
      );

      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "TPOP Liquidity Bootstrapping Pool",
        symbol: "TPOP_LBP",
        tokens: tokens,
        tokenAmounts: amounts,
        startWeights: startWeights,
        endWeights: endWeights,
        swapFee: parseEther(".015"),
        durationInSeconds: 2.5 * DAYS,
        startTime: getDate(formatISO(new Date()), { minutes: 5 }),
        dao: {
          agent: deployer,
          treasury: deployer,
        },
      };
  }
};

const sortTokensAndWeights = (
  [pop, usdc],
  [popStartWeight, usdcStartWeight],
  [popEndWeight, usdcEndWeight],
  [popAmount, usdcAmount]
) => {
  const sorted = [pop, usdc].sort((a, b) => {
    return BigNumber.from(a).sub(BigNumber.from(b)) as unknown as number;
  });
  if (sorted[0] !== pop) {
    return [
      [usdc, pop],
      [usdcStartWeight, popStartWeight],
      [usdcEndWeight, popEndWeight],
      [usdcAmount, popAmount],
    ];
  }
  return [
    [pop, usdc],
    [popStartWeight, usdcStartWeight],
    [popEndWeight, usdcEndWeight],
    [popAmount, usdcAmount],
  ];
};

module.exports.skip = () => true;
