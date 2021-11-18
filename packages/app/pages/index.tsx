import NavBar from 'components/NavBar/NavBar';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const ActionButton = ({ label }) => {
  return (
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
        {label}
      </p>
    </div>
  );
};

const Panel = ({
  topMargin,
  image,
  title,
  body,
  link,
  buttonLabel,
  marginLeft,
  marginRight,
}) => {
  return (
    <div
      className={`bg-light flex flex-col items-start flex-grow-0 flex-shrink filter drop-shadow-3xl md:mx-auto smlaptop:mx-0 w-full md:w-9/12 smlaptop:w-130 smlaptop:mt-0 mt-${topMargin} smlaptop:ml-${marginLeft} smlaptop:ml-${marginRight}`}
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
      <img src={`images/${image}`} className="mx-auto flex-grow-0" />
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
        {title}
      </p>
      <div
        className="mx-auto "
        style={{ width: 480, height: 64, marginBottom: 32 }}
      >
        <p className="text-2xl font-thin text-center font-landing text-gray-600">
          {body}
        </p>
      </div>
      <Link href={link} passHref>
        <ActionButton label={buttonLabel} />
      </Link>
    </div>
  );
};

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
      <div className="flex flex-col smlaptop:flex-row justify-center pl-12 pr-12 py-28 ">
        <Panel
          topMargin={0}
          image={'farmer.svg'}
          title={'Farming'}
          body={'Earn yield on your POP.'}
          link={'/staking'}
          buttonLabel={'Stake'}
          marginLeft={0}
          marginRight={8}
        />
        <Panel
          topMargin={10}
          image={'rocket.svg'}
          title={'Yield Optimizer'}
          body={
            'Deposit stablecoins and earn by leveraging the power of compound interest.'
          }
          link={'/deposit'}
          buttonLabel={'Deposit'}
          marginLeft={8}
          marginRight={0}
        />
      </div>
    </div>
  );
};

export default IndexPage;
