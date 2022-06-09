import { Web3Provider } from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import Page from "components/Common/Page";
import { Debug } from "components/Debug";
import FeatureTogglePanel from "components/DevOnly/FeatureTogglePanel";
import { DualActionModalContainer } from "components/Modal/DualActionModalContainer";
import DualActionWideModalContainer from "components/Modal/DualActionWideModalContainer";
import { MobileFullScreenModalContainer } from "components/Modal/MobileFullScreenModalContainer";
import { MultiChoiceActionModalContainer } from "components/Modal/MultiChoiceActionModalContainer";
import { NetworkChangePromptModalContainer } from "components/Modal/NetworkChangePromptModalContainer";
import { SingleActionModalContainer } from "components/Modal/SingleActionModalContainer";
import NotificationsContainer from "components/Notifications/NotificationsContainer";
import SoftLaunchCheck from "components/SoftLaunchCheck";
import { FeatureToggleProvider } from "context/FeatureToggleContext";
import web3Onboard from "helper/web3Onboard";
import Head from "next/head";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import { GlobalLinearProgressAndLoading } from "../components/GlobalLinearProgressAndLoading";
import { StateProvider } from "../context/store";
import "../styles/globals.css";

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider, "any");
  library.pollingInterval = 12000;
  return library;
}

web3Onboard();

export default function MyApp(props) {
  const { Component, pageProps } = props;
  const getLayout =
    Component.getLayout ||
    (() => (
      <Page>
        <Component {...pageProps} />
      </Page>
    ));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        <title>Popcorn - DeFi for the People</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <StateProvider>
        <GlobalLinearProgressAndLoading loading={loading} setLoading={setLoading} />
        <Web3ReactProvider getLibrary={getLibrary}>
          <FeatureToggleProvider>
            <SoftLaunchCheck loading={loading} />
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
          </FeatureToggleProvider>
        </Web3ReactProvider>
      </StateProvider>
    </React.Fragment>
  );
}
