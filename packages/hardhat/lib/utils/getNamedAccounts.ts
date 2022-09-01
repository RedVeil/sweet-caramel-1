import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkMap } from "./constants";
// setup public/external addresses here like DAI/USDC/ etc.

export default function getNamedAccounts() {
  return {
    popStaking: {
      rinkeby: "0xbd085541Cf339a7B3a5112CeA9440542a02B29E5",
      polygon: "0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA",
      hardhat: "0x683d9CDD3239E0e01E8dC6315fA50AD92aB71D2d",
      mainnet: "0xeEE1d31297B042820349B03027aB3b13a9406184",
      bsc: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **  an address is needed here for the app to compile without going into a hissy loop
      arbitrum: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **
    },
    ETH: {
      hardhat: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      mainnet: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    popUsdcLpStaking: {
      rinkeby: "0x2B2C9812A5561DC3B0d99bbeEd8690002191Ea4D",
      hardhat: "0xAe120F0df055428E45b264E7794A18c54a2a3fAF",
      polygon: "0xe6f315f4e0dB78185239fFFb368D6d188f6b926C",
      bsc: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **
      arbitrum: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c", // **
    },
    popUsdcUniV3Pool: {
      mainnet: "0x9fEE77D8B5050A55c16D0446E6eAb06a6A24cd06",
      hardhat: "0x9fEE77D8B5050A55c16D0446E6eAb06a6A24cd06",
    },
    butterStaking: {
      mainnet: "0x27A9B8065Af3A678CD121A435BEA9253C53Ab428",
      hardhat: "0x3C1Cb427D20F15563aDa8C249E71db76d7183B6c",
    },
    threeXStaking: {
      mainnet: "0x584732f867a4533BC349d438Fba4fc2aEE5f5f83",
      hardhat: "0x7C8BaafA542c57fF9B2B90612bf8aB9E86e22C09",
    },
    butterWhaleProcessing: {
      mainnet: "0x8CAF59fd4eF677Bf5c28ae2a6E5eEfA85096Af39",
      hardhat: "0x6D712CB50297b97b79dE784d10F487C00d7f8c2C",
    },
    angleRouter: {
      mainnet: "0xBB755240596530be0c1DE5DFD77ec6398471561d",
      hardhat: "0xBB755240596530be0c1DE5DFD77ec6398471561d",
    },
    agEur: {
      mainnet: "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
      hardhat: "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8",
    },
    eurOracle: {
      mainnet: "0xc9Cb5703C109D4Fe46d2F29b0454c434e42A6947",
      hardhat: "0xc9Cb5703C109D4Fe46d2F29b0454c434e42A6947",
    },
    ySusd: {
      mainnet: "0x5a770DbD3Ee6bAF2802D29a901Ef11501C44797A",
      hardhat: "0x5a770DbD3Ee6bAF2802D29a901Ef11501C44797A",
    },
    crvSusd: {
      mainnet: "0xC25a3A3b969415c80451098fa907EC722572917F",
      hardhat: "0xC25a3A3b969415c80451098fa907EC722572917F",
    },
    crvSusdUtilityPool: {
      mainnet: "0xFCBa3E75865d2d561BE8D220616520c171F12851",
      hardhat: "0xFCBa3E75865d2d561BE8D220616520c171F12851",
    },
    crvSusdMetapool: {
      mainnet: "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD",
      hardhat: "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD",
    },
    y3Eur: {
      mainnet: "0x5AB64C599FcC59f0f2726A300b03166A395578Da",
      hardhat: "0x5AB64C599FcC59f0f2726A300b03166A395578Da",
    },
    crv3Eur: {
      mainnet: "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571",
      hardhat: "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571",
    },
    crv3EurMetapool: {
      mainnet: "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571",
      hardhat: "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571",
    },
    crvEursMetapool: {
      mainnet: "0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B",
      hardhat: "0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B",
    },
    frax: {
      mainnet: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      hardhat: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
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
    crv3Crypto: {
      mainnet: "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff",
    },
    crvAave: {
      mainnet: "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900",
      hardhat: "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900",
    },
    crvComp: {
      mainnet: "0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2",
    },
    crvSteth: {
      mainnet: "0x06325440D014e39736583c165C2963BA99fAf14E",
    },
    crvCvxCrv: {
      mainnet: "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8",
      hardhat: "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8",
    },
    crvIbBtc: {
      mainnet: "0xFbdCA68601f835b27790D98bbb8eC7f05FDEaA9B",
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
      hardhat: "0x742489F22807ebB4C36ca6cD95c3e1C044B7B6c8",
      arbitrum: "0x68ead55c258d6fa5e46d67fc90f53211eab885be",
      bsc: "0xE8647Ea19496E87c061bBAD79f457928b2F52b5a",
    },
    xPop: {
      polygon: "0x5A35d30c8b23e571e4F7eFc25F353c91fD12F8E8",
      arbitrum: "0x5A35d30c8b23e571e4F7eFc25F353c91fD12F8E8",
      bsc: "0x5A35d30c8b23e571e4F7eFc25F353c91fD12F8E8",
      hardhat: "0xCa1D199b6F53Af7387ac543Af8e8a34455BBe5E0",
    },
    xPopRedemption: {
      bsc: "0x94f58DC6bF565C6B27De5CAEf3a292dCc3522ebD",
      polygon: "0x48168536Fc8834A9543C5A4383721148113fF75A",
      arbitrum: "0x94f58DC6bF565C6B27De5CAEf3a292dCc3522ebD",
      hardhat: "0x1E3b98102e19D3a164d239BdD190913C2F02E756",
    },
    dai: {
      mainnet: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      rinkeby: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      hardhat: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
    crvSEth: {
      mainnet: "0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c",
      hardhat: "0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c",
    },
    sEthSweetVault: {
      mainnet: "0x8bEe2037448F096900Fd9affc427d38aE6CC0350",
      hardhat: "0xd3FFD73C53F139cEBB80b6A524bE280955b3f4db",
    },
    sEthSweetVaultStaking: {
      hardhat: "0x512F7469BcC83089497506b5df64c6E246B39925",
    },
    usdc: {
      mainnet: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      rinkeby: "0x649d645d1ee2ca89a798b52bbf7b5a3c27093b94",
      bsc: "0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115",
      polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      hardhat: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      localhost: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
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
    threeX: {
      mainnet: "0x8b97ADE5843c9BE7a1e8c95F32EC192E31A46cf3",
      hardhat: "0x8b97ADE5843c9BE7a1e8c95F32EC192E31A46cf3",
    },
    threeXBatch: {
      mainnet: "0x42189f909e1EFA409A4509070dDBc31A592422A8",
      hardhat: "0x42189f909e1EFA409A4509070dDBc31A592422A8",
      localhost: "0x42189f909e1EFA409A4509070dDBc31A592422A8",
    },
    threeXWhale: {
      mainnet: "0x0000000000000000000000000000000000000000",
      hardhat: "0xB9d9e972100a1dD01cd441774b45b5821e136043",
      localhost: "0xB9d9e972100a1dD01cd441774b45b5821e136043",
    },
    threeXBatchVault: {
      mainnet: "0x0B4E13D8019D0F762377570000D9C923f0dad82B",
      hardhat: "0x0B4E13D8019D0F762377570000D9C923f0dad82B",
    },
    threeXZapper: {
      mainnet: "0x6DB9Bb0c672E93515acd1514eafc61e3FC6eDd84",
      hardhat: "0x6DB9Bb0c672E93515acd1514eafc61e3FC6eDd84",
    },
    yEUR: {
      mainnet: "0x67e019bfbd5a67207755D04467D6A70c0B75bF60",
      hardhat: "0x67e019bfbd5a67207755D04467D6A70c0B75bF60",
    },
    yGBP: {
      mainnet: "0x595a68a8c9D5C230001848B69b1947ee2A607164",
      hardhat: "0x595a68a8c9D5C230001848B69b1947ee2A607164",
    },
    yCHF: {
      mainnet: "0x490bD0886F221A5F79713D3E84404355A9293C50",
      hardhat: "0x490bD0886F221A5F79713D3E84404355A9293C50",
    },
    yJPY: {
      mainnet: "0x59518884EeBFb03e90a18ADBAAAB770d4666471e",
      hardhat: "0x59518884EeBFb03e90a18ADBAAAB770d4666471e",
    },
    ibEUR: {
      mainnet: "0x96e61422b6a9ba0e068b6c5add4ffabc6a4aae27",
      hardhat: "0x96e61422b6a9ba0e068b6c5add4ffabc6a4aae27",
    },
    ibGBP: {
      mainnet: "0x69681f8fde45345c3870bcd5eaf4a05a60e7d227",
      hardhat: "0x69681f8fde45345c3870bcd5eaf4a05a60e7d227",
    },
    ibCHF: {
      mainnet: "0x1CC481cE2BD2EC7Bf67d1Be64d4878b16078F309",
      hardhat: "0x1CC481cE2BD2EC7Bf67d1Be64d4878b16078F309",
    },
    ibJPY: {
      mainnet: "0x5555f75e3d5278082200fb451d1b6ba946d8e13b",
      hardhat: "0x5555f75e3d5278082200fb451d1b6ba946d8e13b",
    },
    sEUR: {
      mainnet: "0xd71ecff9342a5ced620049e616c5035f1db98620",
      hardhat: "0xd71ecff9342a5ced620049e616c5035f1db98620",
    },
    sGBP: {
      mainnet: "0x97fe22e7341a0cd8db6f6c021a24dc8f4dad855f",
      hardhat: "0x97fe22e7341a0cd8db6f6c021a24dc8f4dad855f",
    },
    sCHF: {
      mainnet: "0x0F83287FF768D1c1e17a42F44d644D7F22e8ee1d",
      hardhat: "0x0F83287FF768D1c1e17a42F44d644D7F22e8ee1d",
    },
    sJPY: {
      mainnet: "0xf6b1c627e95bfc3c1b4c9b825a032ff0fbf3e07d",
      hardhat: "0xf6b1c627e95bfc3c1b4c9b825a032ff0fbf3e07d",
    },
    sUSD: {
      mainnet: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
      hardhat: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
    },
    sEth: {
      mainnet: "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb",
      hardhat: "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb",
    },
    crvEUR: {
      mainnet: "0x19b080FE1ffA0553469D20Ca36219F17Fcf03859",
      hardhat: "0x19b080FE1ffA0553469D20Ca36219F17Fcf03859",
    },
    crvGBP: {
      mainnet: "0xD6Ac1CB9019137a896343Da59dDE6d097F710538",
      hardhat: "0xD6Ac1CB9019137a896343Da59dDE6d097F710538",
    },
    crvCHF: {
      mainnet: "0x9c2C8910F113181783c249d8F6Aa41b51Cde0f0c",
      hardhat: "0x9c2C8910F113181783c249d8F6Aa41b51Cde0f0c",
    },
    crvJPY: {
      mainnet: "0x8818a9bb44fbf33502be7c15c500d0c783b73067",
      hardhat: "0x8818a9bb44fbf33502be7c15c500d0c783b73067",
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
    popUsdcArrakisVault: {
      polygon: "0x6dE0500211bc3140409B345Fa1a5289cb77Af1e4",
      mainnet: "0xbba11b41407df8793a89b44ee4b50afad4508555",
    },
    popUsdcArrakisVaultStaking: {
      polygon: "0xd3836EF639A74EA7398d34c66aa171b1564BE4bc",
      mainnet: "0x633b32573793A67cE41A7D0fFe66e78Cd3379C45",
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
      hardhat: "0xD5724171C2b7f0AA717a324626050BD05767e2C6",
      rinkeby: "0xb4302a1F94685af64b93bb621a8918Dd7ad74440",
    },
    aclRegistry: {
      mainnet: "0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4",
      polygon: "0x0C0991CB6e1c8456660A49aa200B71de6158b85C",
      hardhat: "0x87006e75a5B6bE9D1bbF61AC8Cd84f05D9140589",
      rinkeby: "0x6eB155e648dc865a2687E81CFb73fff5dEbb0b56",
    },
    keeperIncentive: {
      polygon: "0xd928a457247649835e652416847C54C038FAF920",
      mainnet: "0xaFacA2Ad8dAd766BCc274Bf16039088a7EA493bF",
      hardhat: "0x359570B3a0437805D0a71457D61AD26a28cAC9A2",
      localhost: "0x359570B3a0437805D0a71457D61AD26a28cAC9A2",
    },
    contractRegistry: {
      mainnet: "0x85831b53AFb86889c20aF38e654d871D8b0B7eC3",
      polygon: "0x078927eF642319963a976008A7B1161059b7E77a",
      hardhat: "0xC7143d5bA86553C06f5730c8dC9f8187a621A8D4",
      rinkeby: "0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA",
    },
    butterBatch: {
      mainnet: "0xCd979A9219DB9A353e29981042A509f2E7074D8B",
      hardhat: "0x0Dd99d9f56A14E9D53b2DdC62D9f0bAbe806647A",
      localhost: "0x0Dd99d9f56A14E9D53b2DdC62D9f0bAbe806647A",
      rinkeby: "0x06b90E97Cf4b64f338d1D2106329336897bb16F3",
    },
    butterBatchZapper: {
      mainnet: "0x709bC6256413D55a81d6f2063CF057519aE8a95b",
      hardhat: "0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046",
      rinkeby: "0x465aAB0388e89f52eD12Ec5C14571ae75684E626",
    },
    rewardsEscrow: {
      hardhat: "0x8e264821AFa98DD104eEcfcfa7FD9f8D8B320adA",
      rinkeby: "0xdC7EF4A3ce57484fFAA8A61797E04A385Fdb7ACa",
      polygon: "0xa82cAA79F35f7d6B6f1EC1971878F3474C894565",
      mainnet: "0xb5cb5710044D1074097c17B7535a1cF99cBfb17F",
      arbitrum: "0x0C0991CB6e1c8456660A49aa200B71de6158b85C",
      bsc: "0x0C0991CB6e1c8456660A49aa200B71de6158b85C",
    },
    rewardsDistribution: {
      hardhat: "0x114e375B6FCC6d6fCb68c7A1d407E652C54F25FB",
      rinkeby: "",
      polygon: "0xA50608894E7AdE9216C2fFe14E17c73835CEe0B3",
      mainnet: "0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA",
    },
    yearnRegistry: {
      mainnet: "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
      hardhat: "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
    },
    crvAaveSweetPool: {
      hardhat: "0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5",
    },
    crvCvxCrvSweetPool: {
      hardhat: "0xe70f935c32dA4dB13e7876795f1e175465e6458e",
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
    zeroXZapper: {
      hardhat: "0x75c68e69775fA3E9DD38eA32E554f6BF259C1135",
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
