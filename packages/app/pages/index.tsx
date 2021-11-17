import NavBar from 'components/NavBar/NavBar';
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
      <div className="flex justify-center" style={{ marginTop: 96 }}>
        <div
          className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl"
          style={{
            width: 752,
            height: 776.83,
            borderRadius: 40,
            borderStyle: 'solid',
            border: 1,
            borderColor: '#E5E7EB',
            paddingRight: 163,
            paddingLeft: 163,
            paddingTop: 114,
            paddingBottom: 96,
            marginRight: 16,
          }}
        >
          <img src="images/farmer.svg" style={{ width: 426, height: 294.83 }} />
          <p
            className="text-5xl font-semibold mx-auto font-landing text-gray-900"
            style={{ marginBottom: 16, marginTop: 48 }}
          >
            Farming
          </p>
          <div
            className="mx-auto "
            style={{ width: 236, height: 64, marginBottom: 32 }}
          >
            <p className="text-2xl font-thin text-center font-landing text-gray-600">
              Good yield by locking your asset.
            </p>
          </div>
          <div
            className="bg-blue-600 mx-auto flex items-center justify-items-center"
            style={{
              height: 64,
              width: 240,
              // paddingLeft: 0,
              // paddingTop: 160,
              borderRadius: 30,
              paddingTop: 9,
              paddingBottom: 9,
              paddingLeft: 17,
              paddingRight: 17,
            }}
          >
            <p className="text-xl text-white mx-auto my-auto font-semibold font-landing">
              Stake Now
            </p>
          </div>
        </div>
        <div
          className="bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl"
          style={{
            width: 752,
            height: 776.83,
            borderRadius: 40,
            borderStyle: 'solid',
            border: 1,
            borderColor: '#E5E7EB',
            paddingRight: 163,
            paddingLeft: 163,
            paddingTop: 114,
            paddingBottom: 96,
            marginLeft: 16,
          }}
        >
          <img src="images/rocket.svg" style={{ width: 426, height: 294.83 }} />
          <p
            className="text-5xl font-semibold mx-auto font-landing text-center text-gray-900"
            style={{ marginBottom: 16, marginTop: 48 }}
          >
            Popcorn Yield Optimizer
          </p>
          <div
            className="mx-auto"
            style={{ width: 300, height: 64, marginBottom: 32 }}
          >
            <p className="text-2xl font-thin text-center font-landing text-gray-600">
              You earn stablecoin as well as getting the best yield.
            </p>
          </div>
          <div
            className="bg-blue-600 mx-auto flex items-center justify-items-center"
            style={{
              height: 64,
              width: 240,
              // paddingLeft: 0,
              // paddingTop: 160,
              borderRadius: 30,
              paddingTop: 9,
              paddingBottom: 9,
              paddingLeft: 17,
              paddingRight: 17,
            }}
          >
            <p className="text-xl text-white mx-auto my-auto font-semibold font-landing">
              Earn Now
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
