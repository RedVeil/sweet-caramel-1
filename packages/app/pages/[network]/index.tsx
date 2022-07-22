import Hero from "components/landing/Hero";
import SecuritySection from "components/landing/SecuritySection";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

const IndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);

  return (
    <main>
      <Hero />
      <SecuritySection />
    </main>
  );
};

export default IndexPage;
