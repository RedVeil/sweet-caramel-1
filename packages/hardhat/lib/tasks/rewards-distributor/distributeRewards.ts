import { BigNumber } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { getNamedAccountsFromNetwork } from "../../utils/getNamedAccounts";
interface Args {
  dryRun?: string;
  editOnly?: string;
  force?: boolean;
  distributeOnly?: string;
}
export default task(
  "rewards-distributor:distribute",
  "edits reward distributions for current period and calls invokes reward distribution"
)
  .addOptionalParam(
    "editOnly",
    "will edit rewards for current period but not distribute rewards",
    "0"
  )
  .addOptionalParam("dryRun", "will not submit any transactions", "0")
  .addOptionalParam(
    "distributeOnly",
    "will only call distributeRewards function",
    "0"
  )
  .addFlag(
    "force",
    "will force editing distribute rewards and calling distribution function regardless of rewards period"
  )
  .setAction(async (args: Args, hre) => {
    const editOnly = Boolean(parseInt(args.editOnly));
    const dryRun = Boolean(parseInt(args.dryRun));
    const distributeOnly = Boolean(parseInt(args.distributeOnly));
    const force = args.force;
    const popLockerAddress = (await hre.deployments.get("PopLocker")).address;
    const { pop, rewardsDistribution } = getNamedAccountsFromNetwork(hre);

    const popLocker = await hre.ethers.getContractAt(
      "PopLocker",
      popLockerAddress
    );

    const rewardsDistributionContract = await hre.ethers.getContractAt(
      "RewardsDistribution",
      rewardsDistribution
    );

    const [butterRewards, lpRewards, popRewards] = [
      generateRewardPeriods(hre.network.name, butterTable),
      generateRewardPeriods(hre.network.name, lpTable),
      generateRewardPeriods(hre.network.name, popLockerTable),
    ];

    const rewardData = await popLocker.rewardData(pop);
    const distributions = await getDistributions(
      rewardsDistributionContract,
      hre
    );
    const latestBlock = await hre.ethers.provider.getBlock("latest");
    console.log({ latestTimestamp: latestBlock.timestamp });

    if (
      !force &&
      rewardData.periodFinish > latestBlock.timestamp &&
      !editOnly &&
      !distributeOnly
    ) {
      console.log("Nothing to do, exiting ...");
      process.exit();
    }

    const signer = hre.ethers.provider.getSigner();

    if (
      force ||
      rewardData.periodFinish <= latestBlock.timestamp ||
      editOnly ||
      distributeOnly
    ) {
      console.log(
        "Last period finish is in the past, editing new distributions for next reward period ..."
      );

      const editRewardsTxs = [];
      const newRewardsData = [];
      distributions.forEach((distribution, i) => {
        const rewardType = getRewardTypeFromDestination(
          distribution.destination
        );

        console.log("getting reward table for ", rewardType);
        let period;
        switch (rewardType) {
          case "Butter":
            period = getNextRewardPeriod(
              latestBlock.timestamp,
              butterRewards,
              "Butter"
            );
            break;
          case "LP":
            period = getNextRewardPeriod(
              latestBlock.timestamp,
              lpRewards,
              "LP"
            );
            break;
          case "POP":
            period = getNextRewardPeriod(
              latestBlock.timestamp,
              popRewards,
              "POP"
            );
            break;
        }
        console.log({ period });
        const rewardData = {
          index: i,
          destination: distribution.destination,
          amount: formatEther(parseEther(period.amount.toString())),
          isLocker: distribution.isLocker,
        };
        newRewardsData.push(rewardData);

        console.log("editing rewards", { rewardData });

        if (!dryRun && !distributeOnly) {
          editRewardsTxs.push(
            rewardsDistributionContract
              .connect(signer)
              .editRewardDistribution(
                rewardData.index,
                rewardData.destination,
                parseEther(rewardData.amount),
                rewardData.isLocker
              )
          );
        }
      });

      const periodTotalRewards = newRewardsData.reduce((sum, reward) => {
        return parseEther(reward.amount).add(sum);
      }, BigNumber.from(0));

      console.log({ periodTotalRewards: formatEther(periodTotalRewards) });

      console.log("waiting for editRewardDistribution transactions ...");
      const txs = await Promise.all(editRewardsTxs);

      console.log("awaiting confirmations for edit rewards ...");
      await Promise.all(txs.map((tx) => tx.wait()));

      if (distributeOnly || (!dryRun && !editOnly)) {
        console.log("distributing rewards ... ");
        const tx = await rewardsDistributionContract
          .connect(signer)
          .distributeRewards(periodTotalRewards);
        const receipt = await tx.wait();
        console.log(receipt);
      } else {
        console.log("not distributing rewards");
      }
    }
  });

const getDistributions = async (rewardsDistributionContract, hre) => {
  const distributions = [0, 1];
  if (hre.network.name === "mainnet") {
    distributions.push(2);
  }
  return Promise.all(
    distributions.map((i) => {
      return rewardsDistributionContract.distributions(i);
    })
  );
};

const getRewardTypeFromDestination = (address) => {
  return getLowerCaseMap()[address.toLowerCase()];
};
const getLowerCaseMap = () => {
  const map = {
    "0x64337565e0Ce3E35fb7808C16807803a7540521C": "Butter", //eth
    "0x8A3bC3867dB078Ee2742F063745A374eCC231131": "LP", // eth
    "0xdF8bfB606ec657F0A1F7C3b56a1c867c197B21C0": "POP", // eth
    "0x9D6210b1989ccd22c60556fCc175bc9d607F1F15": "POP", // poly
    "0x6da8005c4204553E596241F3cD561C7856857db1": "LP", //poly
  };
  let lowerCaseMap = {};
  Object.keys(map).map((key) => {
    lowerCaseMap[key.toLowerCase()] = map[key];
  });
  return lowerCaseMap;
};

const getNextRewardPeriod = (timeNow: number, periodTable, type: string) => {
  timeNow = 1643751003;
  let nextRewardPeriod = 0;
  let i = 0;
  let amount = 0;
  const periods = Object.keys(periodTable);
  while (nextRewardPeriod == 0 && i < periods.length) {
    if (Number(periods[i]) > timeNow) {
      nextRewardPeriod = Number(periods[i - 1]);
      amount = periodTable[nextRewardPeriod];
      break;
    }
    i++;
  }
  if (!amount) {
    throw new Error("Can't find reward period");
  }
  return { nextRewardPeriod, amount, type };
};

const generateRewardPeriods = (network, table) => {
  const duration = 604800;
  let lastRewardFinish;
  if (network == "mainnet") {
    lastRewardFinish = 1643751003;
  } else {
    lastRewardFinish = 1643748460;
  }

  let periods = {};
  for (let i = 0; i < 25; i++) {
    let nextPeriod;
    if (i === 0) {
      nextPeriod = lastRewardFinish;
    } else {
      nextPeriod = lastRewardFinish + duration;
    }

    periods[nextPeriod] = table[i];
    lastRewardFinish = nextPeriod;
  }
  return periods;
};

export const butterTable = [
  49846.15385, 47852.30769, 45858.46154, 43864.61538, 41870.76923, 39876.92308,
  37883.07692, 35889.23077, 33895.38462, 31901.53846, 29907.69231, 27913.84615,
  25920, 23926.15385, 21932.30769, 19938.46154, 17944.61538, 15950.76923,
  13956.92308, 11963.07692, 9969.230769, 7975.384615, 5981.538462, 3987.692308,
  1993.846154,
];

export const popLockerTable = [
  27692.30769, 26584.61538, 25476.92308, 24369.23077, 23261.53846, 22153.84615,
  21046.15385, 19938.46154, 18830.76923, 17723.07692, 16615.38462, 15507.69231,
  14400, 13292.30769, 12184.61538, 11076.92308, 9969.230769, 8861.538462,
  7753.846154, 6646.153846, 5538.461538, 4430.769231, 3323.076923, 2215.384615,
  1107.692308,
];

export const lpTable = [
  16615.38, 15950.77, 15286.15, 14621.54, 13956.92, 13292.31, 12627.69,
  11963.08, 11298.46, 10633.85, 9969.23, 9304.62, 8640.0, 7975.38, 7310.77,
  6646.15, 5981.54, 5316.92, 4652.31, 3987.69, 3323.08, 2658.46, 1993.85,
  1329.23, 664.62,
];
