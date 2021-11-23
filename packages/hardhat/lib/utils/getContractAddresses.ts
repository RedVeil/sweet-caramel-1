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
          "0xF57c2b473D3347A9B7B79B3EC4A6250721bFbDA7",
          "0xd3bf1996e982509326e77b66f9eb66f9d05f3cda",
        ],
        pop: "0xE02e7744f83Fe0397096e2e46b968d9E2e7dA37F",
        threeCrv: "0xe65e69d194fd0c0aadb33b48bfa75d8110065c7f",
        popEthLp: "0x68397D77c9d7180D8EE3bAA1F1741CfC3647B988",
        butter: "0x8F8BA4A0E8b201f3966558BD53B44E229275a4b4",
        aclRegistry: "0x8E7836f37b35ad1BA7321c26cf8fd22A4e7DdDc3",
        contractRegistry: "0xaA7B112A522Fbb3A85E0705eBeE59586fbB262C4",
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
        threeCrv: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        popEthLp: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
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
        threeCrv: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        popEthLp: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
        butter: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      };
      break;
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
