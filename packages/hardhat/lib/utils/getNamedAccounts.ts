import { HardhatRuntimeEnvironment } from "hardhat/types";
// setup public/external addresses here like DAI/USDC/ etc.

export default function getNamedAccounts() {
  return {
    voting: {
      mainnet: "0xbb6ed6fdc4ddb0541b445e8560d9374e20d1fc1f",
    },
    pop: {
      mainnet: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      mainnettest: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      hardhat: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      localhost: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      rinkeby: "0xcc763df24b9b1d68194ba52e787b6760f04ffd72",
      polygon: "0xC5B57e9a1E7914FDA753A88f24E5703e617Ee50c",
    },
    dao: {
      mainnet: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      mainnettest: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      hardhat: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      localhost: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      rinkeby: "0x7D9B21704B5311bB480f0109dFD5D84ed1207e11",
    },
    daoAgent: {
      hardhat: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      localhost: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      mainnet: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      mainnettest: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      rinkeby: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
      arbitrum: "0x6E5fB0B93ac840bE24e768F3D87cCE7503A29488",
      polygon: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
      polygontest: "0x196CF485b98fB95e27b13f40A43b59FA2570a16E",
    },
    daoTreasury: {
      rinkeby: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
      arbitrum: "0x6E5fB0B93ac840bE24e768F3D87cCE7503A29488",
      polygon: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
      polygontest: "0x196CF485b98fB95e27b13f40A43b59FA2570a16E",
      mainnet: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      mainnettest: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
    },
    tokenManager: {
      mainnet: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      mainnettest: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      hardhat: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      localhost: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      rinkeby: "0xd6c570fa672eb252fc78920a54fc6a2dc9a54708",
    },
    balancerVault: {
      mainnet: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      mainnettest: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      hardhat: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      localhost: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      polygon: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      arbitrum: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      kovan: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      rinkeby: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      polygontest: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    },
    balancerLBPFactory: {
      mainnet: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      mainnettest: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      hardhat: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      localhost: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      polygon: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      arbitrum: "0x142B9666a0a3A30477b052962ddA81547E7029ab",
      kovan: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      rinkeby: "0xdcdbf71A870cc60C6F9B621E28a7D3Ffd6Dd4965",
      polygontest: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
    },
    merkleOrchard: {
      localhost: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      mainnet: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      polygon: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      arbitrum: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      kovan: "0xc33e0fE411322009947931c32d2273ee645cDb5B",
      rinkeby: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
    },
    popEthLp: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe",
    },
    threeCrv: {
      mainnet: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
      rinkeby: "",
      hardhat: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    },
    threePool: {
      mainnet: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      rinkeby: "",
      hardhat: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    },
    butter: {
      mainnet: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
      rinkeby: "",
      hardhat: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
    },
    aclRegistry: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
    },
    contractRegistry: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc",
    },
    butterBatch: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823",
    },
    butterBatchZapper: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B",
    },
    setBasicIssuanceModule: {
      mainnet: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
      rinkeby: "",
      hardhat: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
    },
    uniswapRouter: {
      mainnet: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      rinkeby: "",
      hardhat: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    curveAddressProvider: {
      mainnet: "0x0000000022D53366457F9d5E68Ec105046FC4383",
      rinkeby: "",
      hardhat: "0x0000000022D53366457F9d5E68Ec105046FC4383",
    },
    curveFactoryMetapoolDepositZap: {
      mainnet: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      rinkeby: "",
      hardhat: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
    },
    yDusd: {
      mainnet: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
      rinkeby: "",
      hardhat: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
    },
    yFrax: {
      mainnet: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
      rinkeby: "",
      hardhat: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
    },
    yUsdn: {
      mainnet: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
      rinkeby: "",
      hardhat: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
    },
    yUst: {
      mainnet: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
      rinkeby: "",
      hardhat: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
    },
    crvDusd: {
      mainnet: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
      rinkeby: "",
      hardhat: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
    },
    crvFrax: {
      mainnet: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
      rinkeby: "",
      hardhat: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
    },
    crvUsdn: {
      mainnet: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
      rinkeby: "",
      hardhat: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
    },
    crvUst: {
      mainnet: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
      rinkeby: "",
      hardhat: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
    },
    dusdMetapool: {
      mainnet: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
      rinkeby: "",
      hardhat: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
    },
    fraxMetapool: {
      mainnet: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
      rinkeby: "",
      hardhat: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    },
    usdnMetapool: {
      mainnet: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
      rinkeby: "",
      hardhat: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
    },
    ustMetapool: {
      mainnet: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
      rinkeby: "",
      hardhat: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
    },
    dai: {
      mainnet: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      rinkeby: "",
      hardhat: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
    usdc: {
      mainnet: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      mainnettest: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      hardhat: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      localhost: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      polygon: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      arbitrum: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      kovan: "0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115",
      rinkeby: "0x649d645d1ee2ca89a798b52bbf7b5a3c27093b94",
    },
    usdt: {
      mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      rinkeby: "",
      hardhat: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    },
    popStaking: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x1fA02b2d6A771842690194Cf62D91bdd92BfE28d",
    },
    popEthLpStaking: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6",
    },
    butterStaking: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x04C89607413713Ec9775E14b954286519d836FEf",
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
