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
      <div className="lglaptop:hidden flex flex-col lg:flex-row justify-center pl-12 pr-12 smlaptop:pl-18 smlaptop:pr-18 py-28">
        <Link href={'/staking'} passHref>
          <div
            className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl mx-auto w-11/12 smmd:w-105 lg:mr-4  mb-5 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer"
            style={{
              height: 582.6225,
              borderRadius: 40,
              borderStyle: 'solid',
              border: 1,
              borderColor: '#E5E7EB',
              paddingTop: 86,
              paddingBottom: 60,
            }}
          >
            <img
              src="images/farmer.svg"
              className="mx-auto flex-grow-0"
              style={{ width: 321, height: 223 }}
            />
            <p
              className=" mx-auto font-landing text-gray-900"
              style={{
                marginBottom: 12,
                marginTop: 36,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 36,
              }}
            >
              Farming
            </p>
            <div
              className="mx-auto w-4/5"
              style={{ height: 60, marginBottom: 24 }}
            >
              <p className="h-full text-xl font-thin text-center font-landing text-gray-600">
                Earn yield on your POP.
              </p>
            </div>
            <Link href={'/staking'} passHref>
              <div
                className="bg-blue-600 hover:bg-blue-700  active:bg-blue-900 mx-auto flex items-center justify-items-center cursor-pointer"
                style={{
                  height: 48,
                  width: 180,
                  borderRadius: 30,
                  paddingTop: 7,
                  paddingBottom: 7,
                  paddingLeft: 17,
                  paddingRight: 17,
                }}
              >
                <p
                  className="text-white mx-auto my-auto font-landing pt-1"
                  style={{ fontStyle: 'normal', fontWeight: 500, fontSize: 15 }}
                >
                  Stake
                </p>
              </div>
            </Link>
          </div>
        </Link>
        <Link href={'/deposit'} passHref>
          <div
            className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl mx-auto w-11/12 smmd:w-105 lg:ml-4 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer"
            style={{
              height: 582.6225,
              borderRadius: 40,
              borderStyle: 'solid',
              border: 1,
              borderColor: '#E5E7EB',
              paddingTop: 86,
              paddingBottom: 60,
            }}
          >
            <img
              src="images/rocket.svg"
              className="mx-auto flex-grow-0"
              style={{ width: 321, height: 223 }}
            />
            <p
              className=" mx-auto font-landing text-gray-900"
              style={{
                marginBottom: 12,
                marginTop: 36,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 36,
              }}
            >
              Yield Optimizer
            </p>
            <div
              className="mx-auto w-4/5"
              style={{ height: 60, marginBottom: 24 }}
            >
              <p className="h-full text-xl font-thin text-center font-landing text-gray-600">
                Deposit stablecoins and earn by leveraging the power of compound
                interest.
              </p>
            </div>
            <Link href={'/deposit'} passHref>
              <div
                className="bg-blue-600 hover:bg-blue-700  active:bg-blue-900 mx-auto flex items-center justify-items-center cursor-pointer"
                style={{
                  height: 48,
                  width: 180,
                  borderRadius: 30,
                  paddingTop: 7,
                  paddingBottom: 7,
                  paddingLeft: 17,
                  paddingRight: 17,
                }}
              >
                <p
                  className="text-white mx-auto my-auto font-landing pt-1"
                  style={{ fontStyle: 'normal', fontWeight: 500, fontSize: 15 }}
                >
                  Deposit
                </p>
              </div>
            </Link>
          </div>
        </Link>
      </div>

      {/* LARGE LAPTOP*/}
      <div className="hidden lglaptop:flex flex-col smlaptop:flex-row justify-center pl-12 pr-12 smlaptop:pl-18 smlaptop:pr-18 py-28">
        <Link href={'/staking'} passHref>
          <div
            className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl md:mx-auto smlaptop:mx-0 w-full md:w-9/12 smlaptop:w-130 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer"
            style={{
              height: 776.83,
              borderRadius: 40,
              borderStyle: 'solid',
              border: 1,
              borderColor: '#E5E7EB',
              paddingTop: 114,
              paddingBottom: 60,
            }}
          >
            <img src="images/farmer.svg" className="mx-auto flex-grow-0" />
            <p
              className=" mx-auto font-landing text-gray-900"
              style={{
                marginBottom: 16,
                marginTop: 48,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 48,
              }}
            >
              Farming
            </p>
            <div
              className="mx-auto w-4/5"
              style={{ height: 80, marginBottom: 32 }}
            >
              <p className="h-full text-2xl font-thin text-center font-landing text-gray-600">
                Earn yield on your POP.
              </p>
            </div>
            <Link href={'/staking'} passHref>
              <div
                className="bg-blue-600 hover:bg-blue-700  active:bg-blue-900 mx-auto flex items-center justify-items-center cursor-pointer"
                style={{
                  height: 64,
                  width: 240,
                  borderRadius: 30,
                  paddingTop: 9,
                  paddingBottom: 9,
                  paddingLeft: 17,
                  paddingRight: 17,
                }}
              >
                <p
                  className="text-white mx-auto my-auto font-landing"
                  style={{ fontStyle: 'normal', fontWeight: 500, fontSize: 20 }}
                >
                  Stake
                </p>
              </div>
            </Link>
          </div>
        </Link>
        <Link href={'/deposit'} passHref>
          <div
            className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl smlaptop:ml-8 mx-auto smlaptop:mx-0 mt-10 smlaptop:mt-0 w-full md:w-9/12  smlaptop:w-130 transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer"
            style={{
              height: 776.83,
              borderRadius: 40,
              borderStyle: 'solid',
              border: 1,
              borderColor: '#E5E7EB',
              paddingTop: 114,
              paddingBottom: 60,
            }}
          >
            <img src="images/rocket.svg" className="mx-auto" />
            <p
              className=" mx-auto font-landing text-gray-900"
              style={{
                marginBottom: 16,
                marginTop: 48,
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: 48,
              }}
            >
              Yield Optimizer
            </p>
            <div
              className="mx-auto w-4/5"
              style={{ height: 80, marginBottom: 32 }}
            >
              <p className="h-full text-2xl font-thin text-center font-landing text-gray-600">
                Deposit stablecoins and earn by leveraging the power of compound
                interest.
              </p>
            </div>
            <Link href={'/deposit'} passHref>
              <div
                className="bg-blue-600 hover:bg-blue-700  active:bg-blue-900 mx-auto flex items-center justify-items-center cursor-pointer"
                style={{
                  height: 64,
                  width: 240,
                  borderRadius: 30,
                  paddingTop: 9,
                  paddingBottom: 9,
                  paddingLeft: 17,
                  paddingRight: 17,
                }}
              >
                <p
                  className="text-white mx-auto my-auto font-landing "
                  style={{ fontStyle: 'normal', fontWeight: 500, fontSize: 20 }}
                >
                  Deposit
                </p>
              </div>
            </Link>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default IndexPage;
