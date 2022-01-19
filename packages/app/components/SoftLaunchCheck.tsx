import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { setSingleActionModal } from 'context/actions';
import { store } from 'context/store';
import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';
import allowedAccounts from '../public/gql/allowedAccounts.json';

const getTerms = (timestamp) => {
  return `
  Popcorn Token Launch Auction Terms and Conditions
  By signing this message related to the Popcorn Token Launch Auction ("Popcorn Token Launch Auction"), you represent and warrant to Popcorn Limited ("Popcorn Ltd") that you have read and agreed to the terms and conditions as follows:
  
  1. you are not a citizen or resident of a country the laws of which prohibit or conflict with the holding, sale, or trading of tokens; such countries to include (without limitation) THE UNITED STATES OF AMERICA, ITS TERRITORIES AND POSSESSIONS, ANY STATE OF THE UNITED STATES, AND THE DISTRICT OF COLUMBIA ("U.S."), CANADA, PEOPLE'S REPUBLIC OF CHINA, DEMOCRATIC PEOPLE'S REPUBLIC OF KOREA, CUBA, SYRIA, IRAN, SUDAN, PEOPLE'S REPUBLIC OF CRIMEA;
  2. you agree and acknowledge that nothing in the Popcorn Token Launch Auction constitutes a prospectus or offer document of any sort nor is intended to constitute an offer of securities of any form, units in a business trust, units in a collective investment scheme, or any other form of capital markets product or investment in any jurisdiction, nor a solicitation for any form of investment;
  3. you agree and acknowledge that no regulatory authority has examined or approved the information set out in the Popcorn Token Launch Auction and the publication, distribution, or dissemination of information under the Popcorn Token Launch Auction does not imply to you that the applicable laws, regulatory requirements, or rules have been complied with;
  4. your access to, or use of, the Popcorn Token Launch Auction and the holding of POP tokens by you is not prohibited or restricted by any applicable laws, regulations, or rules in any jurisdiction to which you are subject, and where any restrictions are applicable, you have observed and complied with all such restrictions at your own expense and without liability to Popcorn Ltd;
  5. you agree and acknowledge that Popcorn Ltd shall not be liable for any direct, indirect, special, incidental, consequential, or other losses of any kind (including but not limited to loss of revenue, income or profits, and loss of use or data), in tort (including negligence), contract or otherwise, arising out of or in connection with you accessing or using the Popcorn Token Launch Auction;
  6. you waive the right to participate in a class-action lawsuit or a class-wide arbitration against Popcorn Ltd, any person involved in the Popcorn Token Launch Auction and/or with the creation and distribution of the POP tokens;
  7. you are not a U.S. Person as defined in Regulation S under the Securities Act of 1933, as amended, which means that you are not a natural person resident in the United States of America, its territories and possessions, any State of the United States, and the District Of Columbia ("U.S."), an entity incorporated under the laws of the U.S., an estate/trust where the executor/administrator/trustee is a U.S. Person or a non-discretionary account held for a U.S. Person, an agency or branch of a foreign entity located in the U.S., or an entity incorporated outside the U.S. but formed by a U.S. Person principally for the purposes of investing in unregistered securities under the Securities Act (unless incorporated and owned by accredited investors who are not natural persons, estates or trusts), and you acknowledge, agree and represent as follows:
      - any offer, sale, and trade of the POP tokens is being made in an offshore transaction, which means that the transaction was not effected in the U.S.;
      - no directed selling efforts were made in the United States, which means that no marketing efforts were made to you in the U.S.;
      - you are not acquiring POP tokens for the account or benefit of any U.S. Person; and
      - you agree not to offer or sell the POP tokens (or create or maintain any derivative position equivalent thereto) in the U.S., to or for the account or benefit of a U.S. Person;
  8. you have sufficient funds to fulfill the obligations of Popcorn Ltd within the Popcorn Token Launch Auction and are not bankrupt or insolvent;
  9. you are acquiring POP tokens as principal and for your own benefit and you are not acting on the instructions of, or as nominee or agent for or on behalf of, any other person;
  10. the POP tokens to be delivered to and received by you will not be used for any purpose in connection with money laundering, terrorism financing, or any other acts in breach or contravention of any applicable law, regulation, or rule;
  11. you bear the sole responsibility to determine what tax implications your use of the Popcorn Token Launch Auction may have for you; and
  12. you understand the POP governance token is currently used to create and vote on proposals which affect the parameters of smart contracts on multiple public blockchains. The user interfaces to participate in the governance processes can be found at https://client.aragon.org/#/popcorn and https://snapshot.org/#/popcorn-snapshot.eth. Additionally, more user interfaces and smart contracts which depend on the POP token can be found at https://github.com/popcorndao/workspace along with instructions on how to deploy such user interfaces and application programming interfaces; and
  13. all of the above representations and warranties are and will continue to be, true, complete, accurate, and non-misleading from the time of your acceptance of this attestation and notwithstanding the receipt by you of any POP tokens.
  
  Accepted: ${timestamp}
  `;
};

interface SoftLaunchCheckProps {
  loading: boolean;
}

export default function SoftLaunchCheck({
  loading,
}: SoftLaunchCheckProps): JSX.Element {
  const { library, chainId, account, activate, deactivate } =
    useWeb3React<Web3Provider>();
  const { dispatch } = useContext(store);
  const router = useRouter();

  const showAddressNotAllowedModal = (deactivate) => {
    dispatch(setSingleActionModal(false));
    dispatch(
      setSingleActionModal({
        title: 'Private Beta',
        children: (
          <p className="text-sm text-gray-500">
            The connected account is not authorized. To continue, switch to an
            account from your wallet which was used in the Token Launch Auction.
          </p>
        ),
        onDismiss: {
          label: 'Let me browse anyway',
          onClick: () => {
            dispatch(setSingleActionModal(false));
            localStorage.setItem('eager_connect', 'false');
            deactivate();
          },
        },
        type: 'info',
      }),
    );
  };

  const showSignMessageModal = () => {
    dispatch(setSingleActionModal(false));
    dispatch(
      setSingleActionModal({
        title: 'Private Beta - Almost there!',
        content:
          'It looks like you are eligible to use Sweet Caramel! Please sign a (gas-free) message to access this app.',
        onConfirm: {
          label: 'Sign Message',
          onClick: () => {
            acceptConditions(account);
          },
        },
        keepOpen: true,
      }),
    );
  };

  const addressIsAllowed = (address) => {
    return allowedAccounts.includes(address?.toLocaleLowerCase());
  };
  const checkDev = () => {
    const isDev = sessionStorage.getItem('isDev');
    if (router.query.isDev || isDev) {
      console.log('IS DEV');
      sessionStorage.setItem('isDev', 'true');
      return;
    }
  };

  useEffect(() => {
    const acceptedTerms = localStorage.getItem('softLaunchTerms');
    if (loading || router.route === '/error') {
      return;
    }
    if (acceptedTerms) {
      return;
    }
    if (!account) {
      return;
    }
    checkDev();

    if (account && !addressIsAllowed(account)) {
      return showAddressNotAllowedModal(deactivate);
    } else if ((account && !acceptedTerms) || acceptedTerms === undefined) {
      return showSignMessageModal();
    }
  }, [account, library, chainId, loading]);

  async function acceptConditions(account: string) {
    const timestamp = Date.now();
    try {
      const message = await library
        .getSigner()
        .signMessage(getTerms(timestamp));
      if (message && allowedAccounts.includes(account.toLowerCase())) {
        localStorage.setItem('softLaunchTerms', message);
        dispatch(setSingleActionModal(false));
        router.push('/');
      } else {
        deactivate();
        localStorage.setItem('eager_connect', 'false');
      }
    } catch (error) {
      deactivate();
      localStorage.setItem('eager_connect', 'false');
      router.push('/error');
      dispatch(setSingleActionModal(false));
    }
  }

  return <></>;
}
