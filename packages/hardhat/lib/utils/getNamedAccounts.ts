import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkMap } from "./constants";
// setup public/external addresses here like DAI/USDC/ etc.

export default function getNamedAccounts() {
  return {
    popStaking: {
      rinkeby: "0xbd085541Cf339a7B3a5112CeA9440542a02B29E5",
      polygon: "0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA",
      hardhat: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c",
      mainnet: "0xeEE1d31297B042820349B03027aB3b13a9406184",
      bsc: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **  an address is needed here for the app to compile without going into a hissy loop
      arbitrum: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **
    },
    popUsdcLpStaking: {
      rinkeby: "0x2B2C9812A5561DC3B0d99bbeEd8690002191Ea4D",
      hardhat: "0xffa7CA1AEEEbBc30C874d32C7e22F052BbEa0429",
      polygon: "0xe6f315f4e0dB78185239fFFb368D6d188f6b926C",
      mainnet: "0x633b32573793A67cE41A7D0fFe66e78Cd3379C45",
      bsc: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **
      arbitrum: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **
    },
    popUsdcUniV3Pool: {
      mainnet: "0x9fEE77D8B5050A55c16D0446E6eAb06a6A24cd06",
      hardhat: "0x9fEE77D8B5050A55c16D0446E6eAb06a6A24cd06",
    },
    butterStaking: {
      hardhat: "0x27A9B8065Af3A678CD121A435BEA9253C53Ab428",
      mainnet: "0x27A9B8065Af3A678CD121A435BEA9253C53Ab428",
      //mainnet: "0x64337565e0Ce3E35fb7808C16807803a7540521C",
    },
    yFrax: {
      mainnet: "0xB4AdA607B9d6b2c9Ee07A275e9616B84AC560139",
      rinkeby: "0xB4AdA607B9d6b2c9Ee07A275e9616B84AC560139",
      hardhat: "0xB4AdA607B9d6b2c9Ee07A275e9616B84AC560139",
    },
    yRai: {
      mainnet: "0x2D5D4869381C4Fce34789BC1D38aCCe747E295AE",
      rinkeby: "0x2D5D4869381C4Fce34789BC1D38aCCe747E295AE",
      hardhat: "0x2D5D4869381C4Fce34789BC1D38aCCe747E295AE",
    },
    yMusd: {
      mainnet: "0x8cc94ccd0f3841a468184aCA3Cc478D2148E1757",
      rinkeby: "0x8cc94ccd0f3841a468184aCA3Cc478D2148E1757",
      hardhat: "0x8cc94ccd0f3841a468184aCA3Cc478D2148E1757",
    },
    yAlusd: {
      mainnet: "0xA74d4B67b3368E83797a35382AFB776bAAE4F5C8",
      rinkeby: "0xA74d4B67b3368E83797a35382AFB776bAAE4F5C8",
      hardhat: "0xA74d4B67b3368E83797a35382AFB776bAAE4F5C8",
    },
    crvFrax: {
      mainnet: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
      rinkeby: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
      hardhat: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    },
    crvRai: {
      mainnet: "0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90",
      rinkeby: "0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90",
      hardhat: "0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90",
    },
    crvMusd: {
      mainnet: "0x1AEf73d49Dedc4b1778d0706583995958Dc862e6",
      rinkeby: "0x1AEf73d49Dedc4b1778d0706583995958Dc862e6",
      hardhat: "0x1AEf73d49Dedc4b1778d0706583995958Dc862e6",
    },
    crvAlusd: {
      mainnet: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
      rinkeby: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
      hardhat: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    },
    crvFraxMetapool: {
      mainnet: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
      rinkeby: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
      hardhat: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    },
    crvRaiMetapool: {
      mainnet: "0x618788357D0EBd8A37e763ADab3bc575D54c2C7d",
      rinkeby: "0x618788357D0EBd8A37e763ADab3bc575D54c2C7d",
      hardhat: "0x618788357D0EBd8A37e763ADab3bc575D54c2C7d",
    },
    crvMusdMetapool: {
      mainnet: "0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6",
      rinkeby: "0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6",
      hardhat: "0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6",
    },
    crvAlusdMetapool: {
      mainnet: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
      rinkeby: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
      hardhat: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    },
    threePool: {
      mainnet: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      rinkeby: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      hardhat: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    },
    curveAddressProvider: {
      mainnet: "0x0000000022D53366457F9d5E68Ec105046FC4383",
      rinkeby: "0x0000000022D53366457F9d5E68Ec105046FC4383",
      hardhat: "0x0000000022D53366457F9d5E68Ec105046FC4383",
    },
    curveFactoryMetapoolDepositZap: {
      mainnet: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      rinkeby: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      hardhat: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
    },
    uniswapRouter: {
      mainnet: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      rinkeby: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      hardhat: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    setBasicIssuanceModule: {
      mainnet: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
      rinkeby: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
      hardhat: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
    },
    setTokenCreator: {
      mainnet: "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a",
      rinkeby: "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a",
      hardhat: "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a",
    },
    pop: {
      mainnet: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      rinkeby: "0x2F5Ff054FEa12dB200E374EF43bDD92734453E06",
      polygon: "0xc5b57e9a1e7914fda753a88f24e5703e617ee50c",
      hardhat: "0xD5ac451B0c50B9476107823Af206eD814a2e2580",
      arbitrum: "0x68ead55c258d6fa5e46d67fc90f53211eab885be",
      bsc: "0xE8647Ea19496E87c061bBAD79f457928b2F52b5a",
    },
    xPop: {
      polygon: "0x5A35d30c8b23e571e4F7eFc25F353c91fD12F8E8",
      arbitrum: "0x5A35d30c8b23e571e4F7eFc25F353c91fD12F8E8",
      bsc: "0x5A35d30c8b23e571e4F7eFc25F353c91fD12F8E8",
      hardhat: "0xc0F115A19107322cFBf1cDBC7ea011C19EbDB4F8",
    },
    xPopRedemption: {
      bsc: "0x94f58DC6bF565C6B27De5CAEf3a292dCc3522ebD",
      polygon: "0x48168536Fc8834A9543C5A4383721148113fF75A",
      arbitrum: "0x94f58DC6bF565C6B27De5CAEf3a292dCc3522ebD",
      hardhat: "0x821f3361D454cc98b7555221A06Be563a7E2E0A6",
    },
    dai: {
      mainnet: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      rinkeby: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      hardhat: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
    usdc: {
      mainnet: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      rinkeby: "0x649d645d1ee2ca89a798b52bbf7b5a3c27093b94",
      binance: "0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115",
      polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      hardhat: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      arbitrum: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    },
    usdt: {
      mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      hardhat: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    },
    threeCrv: {
      mainnet: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
      rinkeby: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
      hardhat: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    },
    butter: {
      mainnet: "0x109d2034e97eC88f50BEeBC778b5A5650F98c124",
      rinkeby: "0x109d2034e97eC88f50BEeBC778b5A5650F98c124",
      hardhat: "0x109d2034e97eC88f50BEeBC778b5A5650F98c124",
    },
    setStreamingFeeModule: {
      mainnet: "0x08f866c74205617B6F3903EF481798EcED10cDEC",
      hardhat: "0x08f866c74205617B6F3903EF481798EcED10cDEC",
    },
    voting: {
      mainnet: "0xbb6ed6fdc4ddb0541b445e8560d9374e20d1fc1f",
      rinkeby: "",
      binance: "",
      arbitrum: "",
      mumbai: "",
    },
    dao: {
      // aragon organization address on mainnet
      mainnet: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      rinkeby: "0x7D9B21704B5311bB480f0109dFD5D84ed1207e11",
      hardhat: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
    },
    daoAgent: {
      // aragon agent on mainnet / multisigs on other networks
      mainnet: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      rinkeby: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
      polygon: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
      hardhat: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      arbitrum: "0x6E5fB0B93ac840bE24e768F3D87cCE7503A29488",
      mumbai: "0x196CF485b98fB95e27b13f40A43b59FA2570a16E",
    },
    daoAgentV2: {
      // multisig on mainnet
      mainnet: "0x6B1741143D3F2C4f1EdA12e19e9518489DF03e04",
      hardhat: "0x6B1741143D3F2C4f1EdA12e19e9518489DF03e04",
    },
    daoTreasury: {
      mainnet: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      rinkeby: "0x6d8bd5d37461788182131bae19d03ff2b3c0687c",
      polygon: "0xa49731448a1b25d92F3d80f3d3025e4F0fC8d776",
      hardhat: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      arbitrum: "0x6E5fB0B93ac840bE24e768F3D87cCE7503A29488",
      mumbai: "0x196CF485b98fB95e27b13f40A43b59FA2570a16E",
    },
    tokenManager: {
      mainnet: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      rinkeby: "0xd6c570fa672eb252fc78920a54fc6a2dc9a54708",
      hardhat: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
    },
    balancerVault: {
      mainnet: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      rinkeby: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      binance: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      polygon: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      hardhat: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      arbitrum: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      mumbai: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    },
    balancerLBPFactory: {
      mainnet: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      rinkeby: "0xdcdbf71A870cc60C6F9B621E28a7D3Ffd6Dd4965",
      binance: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      hardhat: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
      arbitrum: "0x142B9666a0a3A30477b052962ddA81547E7029ab",
      mumbai: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
    },
    merkleOrchard: {
      mainnet: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      rinkeby: "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      binance: "0xc33e0fE411322009947931c32d2273ee645cDb5B",
      hardhat: "0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca",
      arbitrum: "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
    },
    popUsdcLp: {
      polygon: "0xe8654f2b0a038a01bc273a2a7b7c48a76c0e58c5",
      mainnet: "0xbba11b41407df8793a89b44ee4b50afad4508555",
      hardhat: "0xF8e31cb472bc70500f08Cd84917E5A1912Ec8397",
      rinkeby: "0xb4302a1F94685af64b93bb621a8918Dd7ad74440",
    },
    aclRegistry: {
      mainnet: "0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4",
      polygon: "0x0C0991CB6e1c8456660A49aa200B71de6158b85C",
      hardhat: "0x720472c8ce72c2A2D711333e064ABD3E6BbEAdd3",
      rinkeby: "0x6eB155e648dc865a2687E81CFb73fff5dEbb0b56",
    },
    keeperIncentive: {
      polygon: "0xd928a457247649835e652416847C54C038FAF920",
      mainnet: "0xaFacA2Ad8dAd766BCc274Bf16039088a7EA493bF",
    },
    contractRegistry: {
      mainnet: "0x85831b53AFb86889c20aF38e654d871D8b0B7eC3",
      polygon: "0x078927eF642319963a976008A7B1161059b7E77a",
      hardhat: "0x18E317A7D70d8fBf8e6E893616b52390EbBdb629",
      rinkeby: "0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA",
    },
    butterBatch: {
      mainnet: "0xCd979A9219DB9A353e29981042A509f2E7074D8B",
      hardhat: "0xCd979A9219DB9A353e29981042A509f2E7074D8B",
      rinkeby: "0x06b90E97Cf4b64f338d1D2106329336897bb16F3",
    },
    butterBatchZapper: {
      mainnet: "0x709bC6256413D55a81d6f2063CF057519aE8a95b",
      hardhat: "0x709bC6256413D55a81d6f2063CF057519aE8a95b",
      rinkeby: "0x465aAB0388e89f52eD12Ec5C14571ae75684E626",
    },
    rewardsEscrow: {
      hardhat: "0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A",
      rinkeby: "0xdC7EF4A3ce57484fFAA8A61797E04A385Fdb7ACa",
      polygon: "0xa82cAA79F35f7d6B6f1EC1971878F3474C894565",
      mainnet: "0xb5cb5710044D1074097c17B7535a1cF99cBfb17F",
      arbitrum: "0x0C0991CB6e1c8456660A49aa200B71de6158b85C",
      bsc: "0x0C0991CB6e1c8456660A49aa200B71de6158b85C",
    },
    rewardsDistribution: {
      hardhat: "0x07882Ae1ecB7429a84f1D53048d35c4bB2056877",
      rinkeby: "",
      polygon: "0xA50608894E7AdE9216C2fFe14E17c73835CEe0B3",
      mainnet: "0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA",
    },
    beneficiaryRegistry: {
      hardhat: "0x51C65cd0Cdb1A8A8b79dfc2eE965B1bA0bb8fc89",
    },
    beneficiaryGovernance: {
      hardhat: "0x7B4f352Cd40114f12e82fC675b5BA8C7582FC513",
    },
    grantElections: {
      hardhat: "0xC7143d5bA86553C06f5730c8dC9f8187a621A8D4",
    },
    rewardsManager: {
      hardhat: "0x56fC17a65ccFEC6B7ad0aDe9BD9416CB365B9BE8",
    },
    govStaking: {
      hardhat: "0x56fC17a65ccFEC6B7ad0aDe9BD9416CB365B9BE8",
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

export const getNamedAccountsByChainId = (chainId: number) => {
  const network: string = networkMap[chainId] ? networkMap[chainId] : "hardhat";
  const accounts = getNamedAccounts();
  return Object.keys(accounts).reduce((map, contract) => {
    if (!accounts[contract][network]) return map;
    return {
      ...map,
      [contract]: accounts[contract][network],
    };
  }, {} as any);
};
