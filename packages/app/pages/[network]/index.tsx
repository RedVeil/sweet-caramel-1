import Hero from "components/landing/Hero";
import Products from "components/landing/Products";
import SecuritySection from "components/landing/SecuritySection";
import { store } from "context/store";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";

const IndexPage = () => {
  const router = useRouter();
  const { dispatch } = useContext(store);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);
  return (
    <main>
      <Hero />
      <Products />
      <SecuritySection />
    </main>
  );
};

export default IndexPage;
