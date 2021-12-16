import { ContractAddresses } from "../../../utils/src/types";

export function getChainRelevantContracts(chainId): ContractAddresses {
  let contracts: ContractAddresses;
  switch (chainId) {
    case 1:
      contracts = {
        staking: [],
        pop: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        threeCrv: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
        butter: "0x3b0967B0710a22c1a5CEB6Ae649B5819Cb8bb999",
        butterDependency: {
          yFrax: "0xB4AdA607B9d6b2c9Ee07A275e9616B84AC560139",
          yMim: "0x2DfB14E32e2F8156ec15a2c21c3A6c053af52Be8",
          crvFrax: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          crvMim: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          mimMetapool: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          curveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",
          curveFactoryMetapoolDepositZap:
            "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
          uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          setBasicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
          setTokenCreator: "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a",
          setStreamingFeeModule: "0x08f866c74205617B6F3903EF481798EcED10cDEC",
        },
        voting: "0xbb6ed6fdc4ddb0541b445e8560d9374e20d1fc1f",
        dao: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
        daoAgent: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        daoTreasury: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        tokenManager: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        merkleOrchard: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
        rewardsEscrow: "",
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
        staking: [
          "0x6D4870349dfd8109d3Ea67AC516204358cF30AC2",
          "0xAE5dA2a2d85Ce27e89AbC9f44d1d4986728BD182",
        ],
        popEthLp: "0xFfb0CBBBeC1682aCfeA50eED9C2E9ADC90390564",
        aclRegistry: "0x8E7836f37b35ad1BA7321c26cf8fd22A4e7DdDc3",
        contractRegistry: "0x0c5b24d1dcBff87491eA61995BF141727346127f",
        usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        pop: "0xc5b57e9a1e7914fda753a88f24e5703e617ee50c",
        daoAgent: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
        daoTreasury: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
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
          "0x720472c8ce72c2A2D711333e064ABD3E6BbEAdd3",
          "0xe8D2A1E88c91DCd5433208d4152Cc4F399a7e91d",
          "0x5067457698Fd6Fa1C6964e416b3f42713513B3dD",
        ],
        pop: "0xf953b3A269d80e3eB0F2947630Da976B896A8C5b",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        threeCrv: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
        popEthLp: "0xAA292E8611aDF267e563f334Ee42320aC96D0463",
        butter: "0x3b0967B0710a22c1a5CEB6Ae649B5819Cb8bb999",
        butterBatch: "0x5bf5b11053e734690269C6B9D438F8C9d48F528A",
        butterBatchZapper: "0x3aAde2dCD2Df6a8cAc689EE797591b2913658659",
        butterDependency: {
          yFrax: "0xB4AdA607B9d6b2c9Ee07A275e9616B84AC560139",
          yMim: "0x2DfB14E32e2F8156ec15a2c21c3A6c053af52Be8",
          crvFrax: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          crvMim: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          mimMetapool: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          curveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",
          curveFactoryMetapoolDepositZap:
            "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
          uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          setBasicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
          setTokenCreator: "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a",
          setStreamingFeeModule: "0x08f866c74205617B6F3903EF481798EcED10cDEC",
        },
        aclRegistry: "0xC9a43158891282A2B1475592D5719c001986Aaec",
        contractRegistry: "0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff",
        dao: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
        daoAgent: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        daoTreasury: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        tokenManager: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        merkleOrchard: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
        rewardsEscrow: "",
      };
    case 31337:
      contracts = {
        staking: [
          "0x720472c8ce72c2A2D711333e064ABD3E6BbEAdd3",
          "0xe8D2A1E88c91DCd5433208d4152Cc4F399a7e91d",
          "0x5067457698Fd6Fa1C6964e416b3f42713513B3dD",
        ],
        pop: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        threeCrv: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
        popEthLp: "0xAA292E8611aDF267e563f334Ee42320aC96D0463",
        butter: "0x3b0967B0710a22c1a5CEB6Ae649B5819Cb8bb999",
        butterBatch: "0x5bf5b11053e734690269C6B9D438F8C9d48F528A",
        butterBatchZapper: "0x3aAde2dCD2Df6a8cAc689EE797591b2913658659",
        butterDependency: {
          yFrax: "0xB4AdA607B9d6b2c9Ee07A275e9616B84AC560139",
          yMim: "0x2DfB14E32e2F8156ec15a2c21c3A6c053af52Be8",
          crvFrax: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          crvMim: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
          fraxMetapool: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
          mimMetapool: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          curveAddressProvider: "0x0000000022D53366457F9d5E68Ec105046FC4383",
          curveFactoryMetapoolDepositZap:
            "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
          uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          setBasicIssuanceModule: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
          setTokenCreator: "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a",
          setStreamingFeeModule: "0x08f866c74205617B6F3903EF481798EcED10cDEC",
        },
        aclRegistry: "0xC9a43158891282A2B1475592D5719c001986Aaec",
        contractRegistry: "0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff",
        dao: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
        daoAgent: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        daoTreasury: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
        tokenManager: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        balancerLBPFactory: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
        merkleOrchard: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
        rewardsEscrow: "",
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
