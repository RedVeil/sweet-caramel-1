// setup public/external addresses here like DAI/USDC/ etc.

// TODO Move to Interface/Types

type Address = string;

interface ContractAddresses {
  staking: Array<Address>;
  // butter?: StakingRewards,
  pop?: Address;
  threeCrv?: Address;
  popEthLp?: Address;
  butter?: Address;
  aclRegistry?: Address;
  contractRegistry?: Address;
}

export function getChainRelevantContracts(chainId): ContractAddresses {
  let contracts: ContractAddresses;
  switch (chainId) {
    case 1:
      contracts = {
        staking: [],
        pop: undefined,
        threeCrv: undefined,
        popEthLp: undefined,
        butter: undefined,
      };
      break;
    case 4:
      contracts = {
        staking: [
          "0x6D4870349dfd8109d3Ea67AC516204358cF30AC2",
          "0xAE5dA2a2d85Ce27e89AbC9f44d1d4986728BD182",
        ],
        pop: "0x7Aa2F180845B77A1744715315841F9C748BE581B",
        threeCrv: "0xcFE7993F611D4058F47b102384D6d4C140ABA5Dd",
        popEthLp: "0x0bE1B6f20045751375b058c299F7F4eb1656CBCC",
        butter: "0xe1455D92fE717C0A165dAA17a0428838cDBd95d8",
        aclRegistry: "0x16A65a5176755A9775e17401A1c2a5A2302A91cA",
        contractRegistry: "0xbd7e0663cF85a3BC0D9e7A908c9cf8A3b4900439",
      };
      break;
    case 137:
      contracts = {
        staking: [],
        pop: undefined,
        threeCrv: undefined,
        popEthLp: undefined,
        butter: undefined,
      };
      break;
    case 80001:
      contracts = {
        staking: [],
        pop: undefined,
        threeCrv: undefined,
        popEthLp: undefined,
        butter: undefined,
      };
      break;
    case 42161:
      contracts = {
        staking: [],
        pop: undefined,
        threeCrv: undefined,
        popEthLp: undefined,
        butter: undefined,
      };
      break;
    case 1337:
      contracts = {
        staking: [
          "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
          "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
        ],
        pop: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        threeCrv: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
        popEthLp: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
        butter: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      };
      break;
    case 31337:
      contracts = {
        staking: [
          "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
          "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
          "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
        ],
        pop: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        threeCrv: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
        popEthLp: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
        butter: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      };
  }
  return contracts;
}

// export default function getContractAddresses(chainId) {

//   return getChainRelevantContracts(chainId);

//   // return {
//   //   POP: {
//   //     mainnet: "",
//   //     rinkeby: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
//   //     hardhat: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
//   //   },
//   //   THREE_CRV: {
//   //     mainnet: "",
//   //     rinkeby: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
//   //     hardhat: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
//   //   },
//   //   BUTTER: {
//   //     mainnet: "",
//   //     rinkeby: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
//   //     hardhat: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
//   //   },
//   //   POP_ETH_LP: {
//   //     mainnet: "",
//   //     rinkeby: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
//   //     hardhat: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
//   //   },
//   //   STAKE_POP: {
//   //     mainnet: "",
//   //     rinkeby: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
//   //     hardhat: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
//   //   },
//   //   STAKE_POP_ETH_LP: {
//   //     mainnet: "",
//   //     rinkeby: "",
//   //     hardhat: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
//   //   },
//   //   STAKE_BUTTER: {
//   //     mainnet: "",
//   //     rinkeby: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
//   //     hardhat: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
//   //   },
//   //   ACL_REGISTRY: {
//   //     mainnet: "",
//   //     rinkeby: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
//   //     hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
//   //   },
//   //   CONTRACT_REGISTRY: {
//   //     mainnet: "",
//   //     rinkeby: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
//   //     hardhat: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
//   //   },
//   // };
// }
