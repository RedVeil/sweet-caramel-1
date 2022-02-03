import Hero from "components/landing/Hero";
import NavBar from "components/NavBar/NavBar";
import { setDualActionWideModal } from "context/actions";
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

  function showDelayInfo() {
    dispatch(
      setDualActionWideModal({
        title: "Coming Soon",
        content:
          "The release of our yield optimizer, Butter, has been delayed due to recent events involving Abracadabra and MIM. We've decided to change Butter's underlying assets to address these concerns and offer the best product possible in today's DeFi landscape.",
        image: <img src="images/ComingSoonCat.svg" className="mx-auto pl-5 w-5/12" />,
        onConfirm: {
          label: "Learn More",
          onClick: () => {
            window.open(
              "https://www.notion.so/popcorn-network/Where-s-Butter-edb3b58f6e6541ea9b10242d0fe2df9c",
              "_blank",
            );
            dispatch(setDualActionWideModal(false));
          },
        },
        onDismiss: {
          label: "Dismiss",
          onClick: () => {
            dispatch(setDualActionWideModal(false));
          },
        },
      }),
    );
  }

  return (
    <div>
      <NavBar />
      <div className="flex mx-auto justify-center md:py-20 flex-col md:flex-row w-11/12 lglaptop:w-9/12 2xl:max-w-7xl">
        <div
          className="md:w-1/2 smlaptop:w-130 bg-light flex flex-col items-start self-stretch py-12 px-8 mb-4 mt-10 mx-4 smlaptop:py-20 filter shadow-custom transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl relative overflow-hidden"
          onClick={showDelayInfo}
        >
          <img src="images/comingSoon.svg" className="absolute top-0 right-0 w-5/12" />
          <img
            src="images/rocket.svg"
            className="mx-auto flex-grow-0 w-72 md:w-80 h-52 md:h-56 lglaptop:h-72 lglaptop:w-108"
          />
          <p className="mx-auto text-gray-900 mb-3 mt-8 lg:mt-12 lglaptop:mb-4 lglaptop:mt-20 font-semibold text-2xl md:text-4xl lglaptop:text-5xl">
            Butter
          </p>
          <div className="mx-auto w-4/5">
            <p className="font-thin text-center text-gray-600 text-base md:text-xl lglaptop:text-2xl">
              Optimize your yield while creating positive global impact.
            </p>
          </div>
        </div>
        <Hero
          header="Farming"
          content="Stake your tokens to earn more POP."
          image="images/farmer.svg"
          link="/staking"
        />
      </div>
    </div>
  );
};

export default IndexPage;
