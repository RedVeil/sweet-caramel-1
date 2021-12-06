import NavBar from 'components/NavBar/NavBar';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const IndexPage = () => {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);

  return (
    <div>
      <NavBar />
      {/* MEDIUM LAPTOP*/}
      <div className="lglaptop:hidden flex flex-col lg:flex-row justify-center mx-auto py-28 w-11/12">
        <Link href={'/butter'} passHref>
          <div className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl mx-auto w-6/12 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl pt-20 my-4 mr-4 smlaptop:py-24 laptop:mr-8">
            <img
              src="images/rocket.svg"
              className="mx-auto flex-grow-0"
              style={{ width: 321, height: 223 }}
            />
            <p
              className=" mx-auto  text-gray-900"
              style={{
                marginBottom: 12,
                marginTop: 80,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 36,
              }}
            >
              Yield Optimizer
            </p>
            <div className="mx-auto w-4/5" style={{ height: 60 }}>
              <p className="h-full text-xl font-thin text-center  text-gray-600">
                Deposit stablecoins and earn by leveraging the power of compound
                interest.
              </p>
            </div>
          </div>
        </Link>
        <Link href={'/staking'} passHref>
          <div className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl mx-auto w-6/12 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl py-20 my-4 ml-4 smlaptop:py-24 laptop:ml-8">
            <img
              src="images/farmer.svg"
              className="mx-auto flex-grow-0"
              style={{ width: 321, height: 223 }}
            />
            <p
              className=" mx-auto  text-gray-900"
              style={{
                marginBottom: 12,
                marginTop: 80,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 36,
              }}
            >
              Farming
            </p>
            <div className="mx-auto w-4/5" style={{ height: 60 }}>
              <p className="h-full text-xl font-thin text-center  text-gray-600">
                Earn yield on your POP.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* LARGE LAPTOP*/}
      <div className="hidden lglaptop:flex flex-row items-center mx-auto justify-center py-28 lglaptop:w-9/12 2xl:max-w-7xl">
        <Link href={'/butter'} passHref>
          <div className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl smlaptop:mr-8 mx-auto smlaptop:mx-0 mt-10 smlaptop:mt-0 w-full md:w-9/12  smlaptop:w-130 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl py-24 2xl:pt-20 2xl:pb-16">
            <img src="images/rocket.svg" className="mx-auto" />
            <p
              className=" mx-auto  text-gray-900"
              style={{
                marginBottom: 16,
                marginTop: 106,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 48,
              }}
            >
              Yield Optimizer
            </p>
            <div className="mx-auto w-4/5" style={{ height: 80 }}>
              <p className="h-full text-2xl font-thin text-center text-gray-600">
                Deposit stablecoins and earn by leveraging the power of compound
                interest.
              </p>
            </div>
          </div>
        </Link>
        <Link href={'/staking'} passHref>
          <div className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl md:mx-auto smlaptop:mx-0 w-full md:w-9/12 smlaptop:w-130 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl py-24 2xl:pt-20 2xl:pb-16">
            <img src="images/farmer.svg" className="mx-auto flex-grow-0" />
            <p
              className=" mx-auto  text-gray-900"
              style={{
                marginBottom: 16,
                marginTop: 106,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 48,
              }}
            >
              Farming
            </p>
            <div className="mx-auto w-4/5" style={{ height: 80 }}>
              <p className="h-full text-2xl font-thin text-center  text-gray-600">
                Earn yield on your POP through staking.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default IndexPage;
