import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

const getTerms = (timestamp) => {
  return `
  Terms and Conditions
  By signing this message, you represent and warrant to Popcorn Limited ("Popcorn Ltd") that you have read and agreed to the terms and conditions as follows:
  1. The software on this website is to be considered EXPERIMENTAL ALPHA SOFTWARE. Using smart contracts come with risk including loss of funds. Use of the smart contracts contained herein is at your own risk. 
  
  2. you are not a citizen or resident of a country the laws of which prohibit or conflict with the holding, sale, or trading of tokens or using decentralized finance finance products; such countries to include (without limitation) THE UNITED STATES OF AMERICA, ITS TERRITORIES AND POSSESSIONS, ANY STATE OF THE UNITED STATES, AND THE DISTRICT OF COLUMBIA ("U.S."), CANADA, PEOPLE'S REPUBLIC OF CHINA, DEMOCRATIC PEOPLE'S REPUBLIC OF KOREA, CUBA, SYRIA, IRAN, SUDAN, PEOPLE'S REPUBLIC OF CRIMEA
  3. you will not in the future access this site or use this dApp while located within the United States any Prohibited Localities stated above.
  
  4. you are not using, and will not in the future use, a VPN to mask my physical location from a restricted territory.
  5. you are lawfully permitted to access this site and use 1inch dApp under the laws of the jurisdiction on which I reside and am located.
  6. Popcorndao.finance has software and tools developed by Popcorn, Ltd. Popcorn, Ltd. is not a bank and does not offer any federal or state banking or depositary services to its customers. Popcorn, Ltd. offers a seamless connection between users and smart contracts on Ethereum, Polygon and Arbtitrum, which are decentralized blockchains. Popcorn, Ltd. does not generate yield (or any form of return) for its users. Yields are generated by the autonomous smart contracts powered by Set Protocol, Yearn and PopcornDAO. The currently displayed interest rates may be lower or higher than currently stated. Historical interest rates on supplying digital assets to the underlying protocols are not an indicator that these rates will be available in the future. Funds supplied through Popcorndao.finance software and tools are not insured by the Federal Deposit Insurance Corporation (FDIC) or any other federal, state, or local regulatory agency. Certain Popcorndao.finance product features listed are currently in development and are not available. Digital assets are NOT bank deposits, are NOT legal tender, are NOT backed by the government, and accounts and value balances are NOT subject to Federal Deposit Insurance Corporation or Securities Investor Protection Corporation or any other governmental or government-backed protections. Legislative and regulatory changes or actions at the State, Federal, or international level may adversely affect the use, transfer, exchange, and value of digital assets. Popcorn, Ltd. does not exchange any digital currencies on behalf of users. Exchange services are provided by a third party provider. There are risks involved with supplying funds or digital assets to smart contracts through Popcorndao.finance. Users may lose all funds.
 7. all of the above representations and warranties are and will continue to be, true, complete, accurate, and non-misleading from the time of your acceptance of this attestation and notwithstanding the receipt by you of any POP tokens.
  
  Accepted: ${timestamp}
  `;
};

const getShortTerms = (timestamp) => {
  return `
  By signing this message you agree to the following:
  - I understand this software is experimental and interacting with smart contracts includes risk including loss of funds. 
  - I am not the person or entities who reside in, are citizens of, are incorporated in, or have a registered office in the United States of America or any Prohibited Localities including Myanmar (Burma), Cote D'Ivoire (Ivory Coast), Cuba, Crimea and Sevastopol, Democratic Republic of
  Congo, Iran, Iraq, Libya, Mali, Nicaragua, Democratic People’s Republic of Korea (North Korea), Somalia,
  Sudan, Syria, Yemen, Zimbabwe or any other state, country or region that is subject to sanctions
  enforced by the United States, the United Kingdom or the European Union.
  - I will not in the future access this site or use popcorndao.finance dApp while located within the United States any Prohibited Localities.
  - I am not using, and will not in the future use, a VPN to mask my physical location from a restricted territory.
  - I am lawfully permitted to access this site and use popcorndao.finance under the laws of the jurisdiction on which I reside and am located.
: ${timestamp}
  `;
};

interface SoftLaunchCheckProps {
  loading: boolean;
}

export default function SoftLaunchCheck({ loading }: SoftLaunchCheckProps): JSX.Element {
  const { library, chainId, account, deactivate } = useWeb3();
  const { dispatch } = useContext(store);
  const router = useRouter();

  const showSignMessageModal = () => {
    dispatch(setSingleActionModal(false));
    dispatch(
      setSingleActionModal({
        title: "Just one more thing!",
        content: "To continue please sign terms and conditions.",
        onConfirm: {
          label: "Sign Message",
          onClick: () => {
            acceptConditions();
          },
        },
        keepOpen: true,
      }),
    );
  };

  const isDev = () => {
    const isDev = sessionStorage.getItem("isDev");
    if (router.query.isDev || isDev) {
      console.log("IS DEV");
      sessionStorage.setItem("isDev", "true");
      return true;
    }
    return false;
  };

  useEffect(() => {
    const acceptedTerms = localStorage.getItem("softLaunchTerms");
    if (loading || router.route === "/error") {
      return;
    }
    if (acceptedTerms) {
      return;
    }
    if (!account) {
      return;
    }
    if (isDev()) {
      return;
    }

    if ((account && !acceptedTerms) || acceptedTerms === undefined) {
      return showSignMessageModal();
    }
  }, [account, library, chainId, loading]);

  async function acceptConditions() {
    const timestamp = Date.now();
    try {
      const message = await library.getSigner().signMessage(getShortTerms(timestamp));
      if (message) {
        localStorage.setItem("softLaunchTerms", message);
        dispatch(setSingleActionModal(false));
        router.push("/");
      } else {
        deactivate();
        localStorage.setItem("eager_connect", "false");
      }
    } catch (error) {
      deactivate();
      localStorage.setItem("eager_connect", "false");
      router.push("/error");
      dispatch(setSingleActionModal(false));
    }
  }

  return <></>;
}
