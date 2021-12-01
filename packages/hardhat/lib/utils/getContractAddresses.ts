import { ContractAddresses } from "../../../utils/src/types";

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
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        aclRegistry: undefined,
        contractRegistry: undefined,
        hysiDependency: {
          basicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
          yDusd: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
          yFrax: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
          yUsdn: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
          yUst: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
          dusdMetapool: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          usdnMetapool: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
          ustMetapool: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
          triPool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        },
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
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: undefined,
        usdc: undefined,
        usdt: undefined,
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
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: undefined,
        usdc: undefined,
        usdt: undefined,
        aclRegistry: undefined,
        contractRegistry: undefined,
      };
      break;
    case 80001:
      contracts = {
        staking: [],
        pop: undefined,
        threeCrv: undefined,
        popEthLp: undefined,
        butter: undefined,
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: undefined,
        usdc: undefined,
        usdt: undefined,
        aclRegistry: undefined,
        contractRegistry: undefined,
      };
      break;
    case 42161:
      contracts = {
        staking: [],
        pop: undefined,
        threeCrv: undefined,
        popEthLp: undefined,
        butter: undefined,
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: undefined,
        usdc: undefined,
        usdt: undefined,
        aclRegistry: undefined,
        contractRegistry: undefined,
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
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: undefined,
        usdc: undefined,
        usdt: undefined,
        aclRegistry: undefined,
        contractRegistry: undefined,
        hysiDependency: {
          basicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
          yDusd: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
          yFrax: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
          yUsdn: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
          yUst: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
          dusdMetapool: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          usdnMetapool: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
          ustMetapool: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
          triPool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
        },
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
        butterBatch: undefined,
        butterBatchZapper: undefined,
        dai: undefined,
        usdc: undefined,
        usdt: undefined,
        aclRegistry: undefined,
        contractRegistry: undefined,
      };
  }
  return contracts;
}
