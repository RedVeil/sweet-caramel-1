import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

const getShortTerms = (timestamp) => {
  return `
  By signing this message you agree to the following:
  - I understand this software is experimental and interacting with smart contracts includes risk including loss of funds. 
  - I am not the person or entities who reside in, are citizens of, are incorporated in, or have a registered office in the United States of America or any Prohibited Localities including Myanmar (Burma), Cote D'Ivoire (Ivory Coast), Cuba, Crimea and Sevastopol, Democratic Republic of
  Congo, Iran, Iraq, Libya, Mali, Nicaragua, Democratic People’s Republic of Korea (North Korea), Somalia,
  Sudan, Syria, Yemen, Zimbabwe or any other state, country or region that is subject to sanctions
  enforced by the United States, the United Kingdom or the European Union.
  - I will not in the future access this site or use popcorndao.finance dApp while located within the United States or any Prohibited Localities.
  - I am not using, and will not in the future use, a VPN to mask my physical location from a restricted territory.
  - I am lawfully permitted to access this site and use popcorndao.finance under the laws of the jurisdiction on which I reside and am located.
: ${timestamp}
  `;
};
interface SoftLaunchCheckProps {
  loading: boolean;
}

export default function SoftLaunchCheck({ loading }: SoftLaunchCheckProps): JSX.Element {
  const { account, signer, disconnect, pushWithinChain } = useWeb3();
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
    if (account && !acceptedTerms) {
      setTimeout(showSignMessageModal, 2500);
      return;
    }
  }, [account, loading]);

  async function acceptConditions() {
    const timestamp = Date.now();
    try {
      const message = await signer.signMessage(getShortTerms(timestamp));
      if (message) {
        localStorage.setItem("softLaunchTerms", message);
        dispatch(setSingleActionModal(false));
      } else {
        disconnect();
      }
    } catch (error) {
      disconnect();
      pushWithinChain("/error");
      dispatch(setSingleActionModal(false));
    }
  }

  return <></>;
}
