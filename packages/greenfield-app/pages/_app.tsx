import Page from "@popcorn/app/components/Common/Page";
import { Debug } from "@popcorn/app/components/Debug";
import { FeatureTogglePanel } from "@popcorn/components/components/FeatureTogglePanel";
import { DualActionModalContainer } from "@popcorn/components/components/Modal/DualActionModalContainer";
import DualActionWideModalContainer from "@popcorn/components/components/Modal/DualActionWideModalContainer";
import { MobileFullScreenModalContainer } from "@popcorn/components/components/Modal/MobileFullScreenModalContainer";
import { MultiChoiceActionModalContainer } from "@popcorn/components/components/Modal/MultiChoiceActionModalContainer";
import { NetworkChangePromptModalContainer } from "@popcorn/components/components/Modal/NetworkChangePromptModalContainer";
import { SingleActionModalContainer } from "@popcorn/components/components/Modal/SingleActionModalContainer";
import NotificationsContainer from "@popcorn/app/components/Notifications/NotificationsContainer";
import OfacCheck from "@popcorn/app/components/OfacCheck";
import { FeatureToggleProvider } from "@popcorn/components/context/FeatureToggleContext";
import Head from "next/head";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import { GlobalLinearProgressAndLoading } from "@popcorn/components/components/GlobalLinearProgressAndLoading";
import { StateProvider } from "@popcorn/components/context/store";
import { RainbowKitProvider, getDefaultWallets, Chain } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { infuraProvider } from "wagmi/providers/infura";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";
import { NetworthContextProvider } from "@popcorn/components/context/Networth";

const bnb: Chain = {
  id: 56,
  name: "BNB Chain",
  network: "bnb",
  iconUrl: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
  rpcUrls: { default: "https://bsc-dataseed1.binance.org" },
  blockExplorers: { default: { name: "BSCScan", url: "https://bscscan.com" } },
};

const { chains, provider, webSocketProvider } = configureChains(
  [
    chain.mainnet,
    chain.polygon,
    chain.optimism,
    chain.arbitrum,
    bnb,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [chain.goerli, chain.localhost] : []),
  ],
  [
    alchemyProvider({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    }),
    infuraProvider({
      apiKey: process.env.INFURA_PROJECT_ID,
    }),
    jsonRpcProvider({ rpc: (chain) => ({ http: chain.rpcUrls.default }) }),
  ],
);

const { connectors } = getDefaultWallets({
  appName: "Popcorn",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

const { title, description, socialShareImage } = {
  title: "Popcorn - Yield That Counts",
  description: "Popcorn is a regenerative yield optimizing protocol.",
  socialShareImage: "https://www.popcorn.network/images/social_cover_image.png",
};

type WindowWithDataLayer = Window & {
  dataLayer: Record<string, any>[];
};

declare const window: WindowWithDataLayer;

export default function MyApp(props) {
  const { Component, pageProps } = props;
  const getLayout =
    Component.getLayout ||
    (() => (
      <Page>
        <Component {...pageProps} />
      </Page>
    ));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1890);
    Router.events.on("routeChangeStart", () => {
      setLoading(true);
    });
    Router.events.on("routeChangeComplete", () => {
      setLoading(false);
    });
    Router.events.on("routeChangeError", () => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <meta name="description" content={description} />

        {/*  Facebook Meta Tags */}
        <meta property="og:url" content="https://popcorn.network/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={socialShareImage} />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="popcorn.network" />
        <meta property="twitter:url" content="https://popcorn.network/" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={socialShareImage} />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </Head>
      <StateProvider>
        <GlobalLinearProgressAndLoading loading={loading} setLoading={setLoading} />
        <FeatureToggleProvider>
          <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider chains={chains}>
              <NetworthContextProvider>
                <OfacCheck />
                <MobileFullScreenModalContainer />
                <SingleActionModalContainer />
                <MultiChoiceActionModalContainer />
                <DualActionModalContainer />
                <DualActionWideModalContainer />
                <NetworkChangePromptModalContainer />
                {getLayout(<Component {...pageProps} />)}
                <FeatureTogglePanel />
                <NotificationsContainer />
                <Debug />
              </NetworthContextProvider>
            </RainbowKitProvider>
          </WagmiConfig>
        </FeatureToggleProvider>
      </StateProvider>
    </React.Fragment>
  );
}
