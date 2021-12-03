import { ContractAddresses } from "../../../utils/src/types";

export function getChainRelevantContracts(chainId): ContractAddresses {
  let contracts: ContractAddresses;
  switch (chainId) {
    case 1:
      contracts = {
        pop: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        threeCrv: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
        butter: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
        butterDependency: {
          yDusd: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
          yFrax: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
          yUsdn: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
          yUst: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
          crvDusd: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
          crvFrax: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
          crvUsdn: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
          crvUst: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
          dusdMetapool: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          usdnMetapool: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
          ustMetapool: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          curveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",
          curveFactoryMetapoolDepositZap:
            "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
          uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          basicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
        },
        voting: "0xbb6ed6fdc4ddb0541b445e8560d9374e20d1fc1f",
        dao: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
        daoAgent: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        daoTreasury: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        tokenManager: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        merkleOrchard: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      };
      break;
    case 4:
      contracts = {
        voting: "",
        butterDependency: {},
        pop: "0xcc763df24b9b1d68194ba52e787b6760f04ffd72",
        dao: "0x7D9B21704B5311bB480f0109dFD5D84ed1207e11",
        daoAgent: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
        daoTreasury: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
        tokenManager: "0xd6c570fa672eb252fc78920a54fc6a2dc9a54708",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0xdcdbf71A870cc60C6F9B621E28a7D3Ffd6Dd4965",
        usdc: "0x649d645d1ee2ca89a798b52bbf7b5a3c27093b94",
        merkleOrchard: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
        staking: [
          "0x6D4870349dfd8109d3Ea67AC516204358cF30AC2",
          "0xAE5dA2a2d85Ce27e89AbC9f44d1d4986728BD182",
        ],
      };
      break;
    case 42:
      contracts = {
        voting: "",
        butterDependency: {},
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
        usdc: "0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115",
        merkleOrchard: "0xc33e0fE411322009947931c32d2273ee645cDb5B",
      };
      break;
    case 137:
      contracts = {
        voting: "",
        pop: "0xC5B57e9a1E7914FDA753A88f24E5703e617Ee50c",
        daoAgent: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
        daoTreasury: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        merkleOrchard: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      };
      break;
    case 80001:
      contracts = {
        voting: "",
        butterDependency: {},
        daoAgent: "0x196CF485b98fB95e27b13f40A43b59FA2570a16E",
        daoTreasury: "0x196CF485b98fB95e27b13f40A43b59FA2570a16E",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      };
      break;
    case 42161:
      contracts = {
        voting: "",
        daoAgent: "0x6E5fB0B93ac840bE24e768F3D87cCE7503A29488",
        daoTreasury: "0x6E5fB0B93ac840bE24e768F3D87cCE7503A29488",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x142B9666a0a3A30477b052962ddA81547E7029ab",
        usdc: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
        merkleOrchard: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      };
      break;
    case 1337:
      contracts = {
        staking: [
          "0x4C4a2f8c81640e47606d3fd77B353E87Ba015584",
          "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823",
          "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2",
        ],
        pop: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        threeCrv: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
        popEthLp: "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6",
        butter: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
        butterBatch: "0x8198f5d8F8CfFE8f9C413d98a0A55aEB8ab9FbB7",
        butterBatchZapper: "0x202CCe504e04bEd6fC0521238dDf04Bc9E8E15aB",
        butterDependency: {
          yDusd: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
          yFrax: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
          yUsdn: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
          yUst: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
          crvDusd: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
          crvFrax: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
          crvUsdn: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
          crvUst: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
          dusdMetapool: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          usdnMetapool: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
          ustMetapool: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          curveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",
          curveFactoryMetapoolDepositZap:
            "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
          uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          basicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
        },
        aclRegistry: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
        contractRegistry: "0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc",
        dao: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
        daoAgent: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        daoTreasury: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        tokenManager: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        merkleOrchard: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      };
      break;
    case 31337:
      contracts = {
        staking: [
          "0x4C4a2f8c81640e47606d3fd77B353E87Ba015584",
          "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823",
          "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2",
        ],
        pop: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        threeCrv: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
        popEthLp: "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6",
        butter: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
        butterBatch: "0x8198f5d8F8CfFE8f9C413d98a0A55aEB8ab9FbB7",
        butterBatchZapper: "0x202CCe504e04bEd6fC0521238dDf04Bc9E8E15aB",
        butterDependency: {
          yDusd: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
          yFrax: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
          yUsdn: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
          yUst: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
          crvDusd: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
          crvFrax: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
          crvUsdn: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
          crvUst: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
          dusdMetapool: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          usdnMetapool: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
          ustMetapool: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          curveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",
          curveFactoryMetapoolDepositZap:
            "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
          uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          basicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
        },
        aclRegistry: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
        contractRegistry: "0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc",
        dao: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
        daoAgent: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        daoTreasury: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        tokenManager: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        merkleOrchard: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      };
  }
  return contracts;
}

export const getNamedAccountsFromNetwork = (chainId) => {
  const contracts = getChainRelevantContracts(chainId);
  const result = Object.keys(contracts).reduce((map, contractName) => {
    if (typeof contracts[contractName] === "object") {
      return Object.keys(contracts[contractName]).reduce((result, key) => {
        return { ...result, [key]: contracts[contractName][key] };
      }, map);
    } else if (Array.isArray(contracts[contractName])) {
      return contracts[contractName].reduce(
        (result, stakingContract, index) => ({
          ...result,
          ["staking" + index]: stakingContract,
        }),
        map
      );
    } else return { ...map, [contractName]: contracts[contractName] };
  }, {});
  return result;
};
