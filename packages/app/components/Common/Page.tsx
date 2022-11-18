import useRestakeAlert from "@popcorn/app/hooks/useRestakeAlert";
import Footer from "@popcorn/app/components/Footer";
import Navbar from "@popcorn/app/components/NavBar/NavBar";
import useSubscribeToNewsletter from "@popcorn/app/hooks/useSubscribeToNewsletter";
import React from "react";
import { Toaster } from "react-hot-toast";
import GoogleAnalyticsPrompt from "@popcorn/app/components/GoogleAnalyticsPrompt";

interface PageProps {
  children: JSX.Element;
  // acceptGoogleAnalytics: any;
}
export default function Page({ children }: PageProps) {
  useRestakeAlert();
  useSubscribeToNewsletter();

  return (
    <div className="w-full min-h-screen h-full font-khTeka flex flex-col justify-between">
      <div>
        <Navbar />
        <Toaster position="top-right" />
        <div className="pt-5 md:pt-10 px-6 md:px-8">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
