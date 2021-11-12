// setup public/external addresses here like DAI/USDC/ etc.

export default function getContractAddresses() {
  return {
    POP: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc",
    },
    THREE_CRV: {
      mainnet: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
      rinkeby: "",
      hardhat: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    },
    THREE_POOL: {
      mainnet: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      rinkeby: "",
      hardhat: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    },
    BUTTER: {
      mainnet: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
      rinkeby: "",
      hardhat: "0x8d1621a27bb8c84e59ca339cf9b21e15b907e408",
    },
    ACL_REGISTRY: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
    },
    CONTRACT_REGISTRY: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07",
    },
    BUTTER_BATCH: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0x21dF544947ba3E8b3c32561399E88B52Dc8b2823",
    },
    BUTTER_BATCH_ZAPPER: {
      mainnet: "",
      rinkeby: "",
      hardhat: "0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43",
    },
    SET_BASIC_ISSUANCE_MODULE_ADDRESS: {
      mainnet: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
      rinkeby: "",
      hardhat: "0xd8EF3cACe8b4907117a45B0b125c68560532F94D",
    },
    UNISWAP_ROUTER: {
      mainnet: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      rinkeby: "",
      hardhat: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
    CURVE_ADDRESS_PROVIDER: {
      mainnet: "0x0000000022D53366457F9d5E68Ec105046FC4383",
      rinkeby: "",
      hardhat: "0x0000000022D53366457F9d5E68Ec105046FC4383",
    },
    CURVE_FACTORY_METAPOOL_DEPOSIT_ZAP: {
      mainnet: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
      rinkeby: "",
      hardhat: "0xA79828DF1850E8a3A3064576f380D90aECDD3359",
    },
    YDUSD: {
      mainnet: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
      rinkeby: "",
      hardhat: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c",
    },
    YFRAX: {
      mainnet: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
      rinkeby: "",
      hardhat: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139",
    },
    YUSDN: {
      mainnet: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
      rinkeby: "",
      hardhat: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa",
    },
    YUST: {
      mainnet: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
      rinkeby: "",
      hardhat: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44",
    },
    CRV_DUSD: {
      mainnet: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
      rinkeby: "",
      hardhat: "0x3a664ab939fd8482048609f652f9a0b0677337b9",
    },
    CRV_FRAX: {
      mainnet: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
      rinkeby: "",
      hardhat: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
    },
    CRV_USDN: {
      mainnet: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
      rinkeby: "",
      hardhat: "0x4f3e8f405cf5afc05d68142f3783bdfe13811522",
    },
    CRV_UST: {
      mainnet: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
      rinkeby: "",
      hardhat: "0x94e131324b6054c0D789b190b2dAC504e4361b53",
    },
    DUSD_METAPOOL: {
      mainnet: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
      rinkeby: "",
      hardhat: "0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c",
    },
    FRAX_METAPOOL: {
      mainnet: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
      rinkeby: "",
      hardhat: "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B",
    },
    USDN_METAPOOL: {
      mainnet: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
      rinkeby: "",
      hardhat: "0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1",
    },
    UST_METAPOOL: {
      mainnet: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
      rinkeby: "",
      hardhat: "0x890f4e345B1dAED0367A877a1612f86A1f86985f",
    },
    DAI: {
      mainnet: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      rinkeby: "",
      hardhat: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
    USDC: {
      mainnet: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      rinkeby: "",
      hardhat: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    USDT: {
      mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      rinkeby: "",
      hardhat: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    },
  };
}
