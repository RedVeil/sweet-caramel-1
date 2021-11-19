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
      <div className="flex flex-col smlaptop:flex-row justify-center pl-12 pr-12 smlaptop:pl-12 smlaptop:pr-12 py-28 ">
        <div
          className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl md:mx-auto smlaptop:mx-0 w-full md:w-9/12 smlaptop:w-130"
          style={{
            height: 776.83,
            borderRadius: 40,
            borderStyle: 'solid',
            border: 1,
            borderColor: '#E5E7EB',
            paddingTop: 114,
            paddingBottom: 96,
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

        <div
          className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl smlaptop:ml-8 mx-auto smlaptop:mx-0 mt-10 smlaptop:mt-0 w-full md:w-9/12  smlaptop:w-130"
          style={{
            height: 776.83,
            borderRadius: 40,
            borderStyle: 'solid',
            border: 1,
            borderColor: '#E5E7EB',
            paddingTop: 114,
            paddingBottom: 96,
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
      </div>
    </div>
  );
};

export default IndexPage;
