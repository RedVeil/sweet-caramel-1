import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import CssBaseline from '@material-ui/core/CssBaseline';
import '../styles/globals.css';
import Router from 'next/router';
import { GlobalLinearProgress } from 'containers/GlobalLinearProgress';
import { StateProvider } from 'app/store';
import { SingleActionModalContainer } from 'components/Modal/SingleActionModalContainer';
import { DualActionModalContainer } from 'components/Modal/DualActionModalContainer';
import TagManager from 'react-gtm-module';
import Footer from 'components/Footer';
import { Toaster } from "react-hot-toast";

const { title, description, socialShareImage } = {
  title: 'Popcorn - Yield That Counts',
  description: 'Popcorn is a regenerative yield optimizing protocol.',
  socialShareImage: 'https://www.popcorn.network/images/social_cover_image.png',
};

export default function MyApp(props) {
  const { Component, pageProps } = props;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GTM_ID) {
      TagManager.initialize({
        gtmId: process.env.NEXT_PUBLIC_GTM_ID,
      });
    }
  }, []);

  useEffect(() => {
    Router.events.on('routeChangeStart', () => {
      setLoading(true);
    });
    Router.events.on('routeChangeComplete', () => {
      setLoading(false);
    });
    Router.events.on('routeChangeError', () => {
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>{title}</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />

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
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </Head>
      <CssBaseline />
      <GlobalLinearProgress visible={loading} />
      <Toaster position="top-right" />
      <StateProvider>
        <SingleActionModalContainer />
        <DualActionModalContainer />
        <Component {...pageProps} />
        <Footer />
      </StateProvider>
    </React.Fragment>
  );
}
