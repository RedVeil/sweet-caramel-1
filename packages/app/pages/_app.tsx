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
import OfacCheck from "components/OfacCheck";
import SoftLaunchCheck from "components/SoftLaunchCheck";
import { FeatureToggleProvider } from "context/FeatureToggleContext";
import { PortfolioContextProvider } from "context/PortfolioContext";
import web3Onboard from "helper/web3Onboard";
import Head from "next/head";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import { GlobalLinearProgressAndLoading } from "../components/GlobalLinearProgressAndLoading";
import { StateProvider } from "../context/store";
import "../styles/globals.css";

web3Onboard();

const { title, description, socialShareImage } = {
  title: "Popcorn - Yield That Counts",
  description: "Popcorn is a regenerative yield optimizing protocol.",
  socialShareImage: "https://www.popcorn.network/images/social_cover_image.png",
};

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
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <StateProvider>
        <GlobalLinearProgressAndLoading loading={loading} setLoading={setLoading} />
        <PortfolioContextProvider>
          <FeatureToggleProvider>
            <SoftLaunchCheck loading={loading} />
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
          </FeatureToggleProvider>
        </PortfolioContextProvider>
      </StateProvider>
    </React.Fragment>
  );
}
