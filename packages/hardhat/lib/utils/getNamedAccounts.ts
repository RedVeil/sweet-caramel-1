// setup public/external addresses here like DAI/USDC/ etc.

export default function getNamedAccounts() {
  return {
    POP: {
      mainnet: "0xd0cd466b34a24fcb2f87676278af2005ca8a78c4",
      rinkeby: "0x39a1610cccca2c7b59ffbebfdf970a65c84b26ae",
    },
    DAO: {
      mainnet: "0xbD94fc22E6910d118187c8300667c66eD560A29B",
      rinkeby: "0x7D9B21704B5311bB480f0109dFD5D84ed1207e11",
    },
    DAO_Agent: {
      mainnet: "0x0ec6290abb4714ba5f1371647894ce53c6dd673a",
      rinkeby: "0xc0e334b5bc637eac105da3d84c7c1bd342ae8ae9",
    },
    TokenManager: {
      mainnet: "0x50a7c5a2aa566eb8aafc80ffc62e984bfece334f",
      rinkeby: "0xd6c570fa672eb252fc78920a54fc6a2dc9a54708",
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
