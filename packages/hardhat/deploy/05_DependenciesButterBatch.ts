import { parseEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const BUTTER_ADDRESS = "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408";
const SET_BASIC_ISSUANCE_MODULE_ADDRESS =
  "0xd8EF3cACe8b4907117a45B0b125c68560532F94D";

const THREE_CRV_ADDRESS = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490";
const THREE_POOL_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";

const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const CURVE_ADDRESS_PROVIDER_ADDRESS =
  "0x0000000022D53366457F9d5E68Ec105046FC4383";
const CURVE_FACTORY_METAPOOL_DEPOSIT_ZAP_ADDRESS =
  "0xA79828DF1850E8a3A3064576f380D90aECDD3359";

const YTOKEN_ADDRESSES = [
  "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
  "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
  "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
  "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
];
const CRV_DEPENDENCIES = [
  {
    curveMetaPool: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
    crvLPToken: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
  },
  {
    curveMetaPool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    crvLPToken: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
  },
  {
    curveMetaPool: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
    crvLPToken: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
  },
  {
    curveMetaPool: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
    crvLPToken: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
  },
];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );
  const signerAddress = await signer.getAddress();
  //Faucet
  await deploy("Faucet", {
    from: deployer,
    args: [
      UNISWAP_ROUTER_ADDRESS,
      CURVE_ADDRESS_PROVIDER_ADDRESS,
      CURVE_FACTORY_METAPOOL_DEPOSIT_ZAP_ADDRESS,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "Faucet",
  });
  const faucet = await hre.ethers.getContractAt(
    "Faucet",
    (
      await deployments.get("Faucet")
    ).address,
    signer
  );

  await hre.network.provider.send("hardhat_setBalance", [
    faucet.address,
    "0x152d02c7e14af6800000", // 100k ETH
  ]);
  console.log("sending 3crv...");
  await faucet.sendThreeCrv(10000, signerAddress);

  //ContractRegistry
  const contractRegistryAddress = (await deployments.get("ContractRegistry"))
    .address;
  const contractRegistry = await hre.ethers.getContractAt(
    "ContractRegistry",
    contractRegistryAddress,
    signer
  );

  //Butter Batch
  console.log("deploying butterBatch...");
  await deploy("ButterBatch", {
    from: deployer,
    args: [
      contractRegistryAddress,
      BUTTER_ADDRESS,
      THREE_CRV_ADDRESS,
      SET_BASIC_ISSUANCE_MODULE_ADDRESS,
      YTOKEN_ADDRESSES,
      CRV_DEPENDENCIES,
      60 * 60 * 24,
      parseEther("100"),
      parseEther("1"),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "HysiBatchInteraction",
  });
  console.log("adding butterBatch to contract registry...");
  await contractRegistry.addContract(
    ethers.utils.id("HysiBatchInteraction"),
    (
      await deployments.get("ButterBatch")
    ).address,
    ethers.utils.id("1")
  );

  console.log("deploying butterBatchZapper...");
  await deploy("ButterBatchZapper", {
    from: deployer,
    args: [contractRegistryAddress, THREE_POOL_ADDRESS, THREE_CRV_ADDRESS],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "HysiBatchZapper",
  });

  await contractRegistry.addContract(
    ethers.utils.id("HysiBatchZapper"),
    (
      await deployments.get("ButterBatchZapper")
    ).address,
    ethers.utils.id("1")
  );
};
export default func;
