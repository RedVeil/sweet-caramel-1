import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { BeneficiaryImage } from "@popcorn/hardhat/lib/adapters";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import Hero from "components/Beneficiaries/Hero";
import HowItWorksDropdown from "components/Beneficiaries/HowItWorksDropdown";
import CardBody from "components/CommonComponents/CardBody";
import FacebookPixel from "components/FacebookPixel";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const IndexPage = () => {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);
  const [filterValue, setFilterValue] = useState("All");

  const beneficiaryCards: Array<{
    name: String;
    missionStatement: String;
    image: BeneficiaryImage;
  }> = [
    {
      name: "Help Our Forest!",
      missionStatement:
        "Lorem ipsum dolor sit amet, consectetur adi pisicing elit. Voluptatibus quia, nulla! Maio res et perferendis eaque, ",
      image: {
        image:
          "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2560&q=80",
        description: "Sea and trees",
      },
    },
    {
      name: "Save the Children",
      missionStatement:
        "Lorem ipsum dolor sit amet, consectetur adi pisicing elit. Voluptatibus quia, nulla! Maio res et perferendis eaque,",
      image: {
        image:
          "https://images.unsplash.com/photo-1497449493050-aad1e7cad165?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=930&q=80",
        description: "Sea and trees",
      },
    },
    {
      name: "Help Our Forest!",
      missionStatement:
        "Lorem ipsum dolor sit amet, consectetur adi pisicing elit. Voluptatibus quia, nulla! Maio res et perferendis eaque, ",
      image: {
        image:
          "https://images.unsplash.com/photo-1500534623283-312aade485b7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
        description: "Sea and trees",
      },
    },
  ];

  const filterList = [
    {
      name: "All",
    },
    {
      name: "Environment",
    },
    {
      name: "Education ",
    },
    {
      name: "Inequality",
    },
    {
      name: "Open Source",
    },
  ];

  const switchFilter = (value) => {
    setFilterValue(value);
  };
  return (
    <>
      <main className="w-full">
        <FacebookPixel />
        <Hero />
        <HowItWorksDropdown />
        <section className="container mx-auto font-normal">
          <div className="px-5 lg:px-10 py-20">
            <div className="grid grid-cols-12 gap-y-10 md:gap-5 lg:gap-10">
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-3xl flex flex-col items-center py-10 px-16 md:px-10 lg:px-14 text-center shadow-custom-md md:h-110 lg:h-96">
                  <img src="/images/illustration _ do well.png" alt="" className="mb-10" />
                  <p className="text-gray-900 font-semibold text-3xl mb-4">Beneficiary Applications</p>
                  <p className=" text-gray-500 text-xl mb-4">
                    {" "}
                    Vote for any proposal to become an eligible beneficiary
                  </p>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className="rounded-3xl flex flex-col items-center py-10 px-16 md:px-10 lg:px-14 text-center shadow-custom-md md:h-110 lg:h-96">
                  <img src="/images/illustration _ do good.png" alt="" className="mb-10" />
                  <p className="text-gray-900 font-semibold text-3xl mb-4">Grant Elections</p>
                  <p className=" text-gray-500 text-xl mb-4">
                    Vote for eligible beneficiaries so they can win a chance to be funded
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 lg:px-10 py-20">
            <div className="flex justify-between relative">
              <h1 className="text-gray-900 font-semibold text-xl md:text-4xl mb-10">
                Eligible Beneficiaries At A Glance
              </h1>
              <div>
                <Menu>
                  <Menu.Button className="bg-white rounded-3xl shadow-custom-lg">
                    <div className="w-32 md:w-44 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between rounded-4xl">
                      <div className="flex items-center">
                        <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                        <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">{filterValue}</p>
                      </div>
                      <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <BeneficiaryFilter
                      filterList={filterList}
                      switchFilter={switchFilter}
                      position="absolute top-14 right-0"
                      width="w-44"
                    />
                  </Menu.Button>
                </Menu>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-y-10 md:gap-10">
              {beneficiaryCards.map((beneficiary, index) => (
                <div className="col-span-12 md:col-span-6 lg:col-span-4" key={index}>
                  <CardBody {...beneficiary} />
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button className="bg-blue-50 rounded-4xl py-3 px-5 text-blue-600 text-sm font-semibold my-20">
                See More
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default IndexPage;
