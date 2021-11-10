import { HardhatRuntimeEnvironment } from "hardhat/types";
// setup public/external addresses here like DAI/USDC/ etc.

export default function getNamedAccounts() {
  return {
    POP: {
      mainnet: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      hardhat: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      localhost: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      rinkeby: "0xcc763df24b9b1d68194ba52e787b6760f04ffd72",
      polygon: "0xC5B57e9a1E7914FDA753A88f24E5703e617Ee50c",
    },
    DAO: {
      mainnet: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      hardhat: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      localhost: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      rinkeby: "0x7D9B21704B5311bB480f0109dFD5D84ed1207e11",
    },
    DAO_Agent: {
      mainnet: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      hardhat: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      localhost: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      rinkeby: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
    },
    DAO_Treasury: {
      rinkeby: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
    },
    TokenManager: {
      mainnet: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      hardhat: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      localhost: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      rinkeby: "0xd6c570fa672eb252fc78920a54fc6a2dc9a54708",
    },
    BalancerVault: {
      mainnet: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      hardhat: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      localhost: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      polygon: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      arbitrum: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      kovan: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      rinkeby: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    },
    BalancerLBPFactory: {
      mainnet: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      hardhat: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      localhost: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      polygon: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      arbitrum: "0x142B9666a0a3A30477b052962ddA81547E7029ab",
      kovan: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      rinkeby: "0xdcdbf71A870cc60C6F9B621E28a7D3Ffd6Dd4965",
    },
    USDC: {
      mainnet: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      hardhat: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      localhost: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      polygon: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      arbitrum: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      kovan: "0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115",
      rinkeby: "0x649d645d1ee2ca89a798b52bbf7b5a3c27093b94",
    },
    MerkleOrchard: {
      localhost: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      mainnet: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      polygon: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      arbitrum: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      kovan: "0xc33e0fE411322009947931c32d2273ee645cDb5B",
      rinkeby: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
    },
  };
}

export const getNamedAccountsFromNetwork = (hre: HardhatRuntimeEnvironment) => {
  const accounts = getNamedAccounts();
  return Object.keys(accounts).reduce((map, contract) => {
    if (!accounts[contract][hre.network.name]) return map;
    return {
      ...map,
      [contract]: accounts[contract][hre.network.name],
    };
  }, {} as any);
};
