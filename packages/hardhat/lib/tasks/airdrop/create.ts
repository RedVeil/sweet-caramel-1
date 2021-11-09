import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";
import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import getNamedAccounts from "../../utils/getNamedAccounts";
import { loadTree } from "../../utils/merkleTree";

interface Args {
  token: string;
  id: string;
  balancesFile: string;
}

interface Balances {
  [address: string]: string;
}

const SUPPORTED_NETWORKS = [
  "localhost",
  "mainnet",
  "kovan",
  "rinkeby",
  "polygon",
  "arbitrum",
];

async function main(args: Args, hre: HardhatRuntimeEnvironment) {
  if (!SUPPORTED_NETWORKS.includes(hre.network.name)) {
    throw new Error(
      `Unsupported network. The selected network is: ${hre.network.name}`
    );
  }
  const signer = hre.askForSigner();
  const addresses = getNamedAccounts();
  const token = await hre.ethers.getContractAt(
    "contracts/core/interfaces/IERC20Metadata.sol:IERC20Metadata",
    args.token,
    signer
  );
  const merkleOrchard = await hre.ethers.getContractAt(
    "IMerkleOrchard",
    addresses.MerkleOrchard[hre.network.name],
    signer
  );
  const balancesJSON = await fs.promises.readFile(args.balancesFile, "utf-8");
  const balances: Balances = JSON.parse(balancesJSON);

  const distributionTotal: BigNumber = Object.values(balances).reduce(
    (a: BigNumber, b: string) => {
      return a.add(parseEther(b));
    },
    parseEther("0")
  );

  console.log("Generating Merkle root");
  const tree = loadTree(balances);
  console.log("Merkle root:", tree.getHexRoot());
  console.log(
    "Approving transfer:",
    formatEther(distributionTotal),
    "tokens to",
    merkleOrchard.address
  );
  await token.approve(merkleOrchard.address, distributionTotal);
  console.log("Transfer approved");
  console.log("Creating Balancer MerkleOrchard distribution with ID", args.id);
  await merkleOrchard.createDistribution(
    token.address,
    tree.getHexRoot(),
    distributionTotal,
    parseUnits(args.id, "wei")
  );
  console.log("Distribution created");
}

export default task(
  "airdrop:create",
  "creates a Balancer MerkleOrchard airdrop distribution"
)
  .addParam("token", "address of token to distribute")
  .addParam("amount", "amount to distribute")
  .addParam("id", "distribution ID")
  .addParam("balancesFile", "JSON file containing address:amount balances")
  .setAction(main);
