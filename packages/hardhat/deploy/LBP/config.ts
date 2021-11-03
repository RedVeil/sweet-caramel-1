import { add, formatISO, parseISO } from "date-fns";
import { parseEther, parseUnits } from "ethers/lib/utils";

const timestamp = (date) => {
  return Math.round(date.getTime() / 1000);
};

const getDate = (date, addTime?) => {
  return timestamp(add(parseISO(date), addTime ? addTime : {}));
};

const DAYS = 60 * 60 * 24;

export const getConstructorArgs = (
  {
    BalancerLBPFactory,
    BalancerVault,
    POP,
    USDC,
    DAO_Agent,
    DAO_Treasury,
    deployer,
  },
  networkName: string
) => {
  switch (networkName) {
    case "mainnet":
    case "arbitrum":
    case "polygon":
      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "Popcorn (POP) Liquidity Bootstrapping Pool",
        symbol: "POP_LBP",
        tokens: [POP, USDC],
        tokenAmounts: [parseEther("1333333.33"), parseUnits("500000", 6)],
        startWeights: [parseEther(".99"), parseEther(".01")],
        endWeights: [parseEther(".5"), parseEther(".5")],
        swapFee: parseEther(".015"),
        durationInSeconds: 2.5 * DAYS,
        startTime: getDate("2021-11-29 08:00:00Z+00"),
        dao: {
          agent: DAO_Agent,
          treasury: DAO_Treasury,
        },
      };
    default:
      return {
        balancer: { lbpFactory: BalancerLBPFactory, vault: BalancerVault },
        name: "TPOP Liquidity Bootstrapping Pool",
        symbol: "TPOP_LBP",
        tokens: [POP, USDC],
        tokenAmounts: [parseEther("13333.33"), parseUnits("5000", 6)],
        startWeights: [parseEther(".99"), parseEther(".01")],
        endWeights: [parseEther(".5"), parseEther(".5")],
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
module.exports.skip = () => true;
