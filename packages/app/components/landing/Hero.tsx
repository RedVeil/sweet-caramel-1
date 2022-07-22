import SecondaryActionButton from "components/SecondaryActionButton";
import { useRouter } from "next/router";

export default function Hero(): JSX.Element {
  const router = useRouter();
  return (
    <section className="grid grid-cols-12 md:gap-8">
      <div className="col-span-12 md:col-span-3">
        <div className=" rounded-lg border border-gray-900 p-6">
          <div className="flex items-center gap-2 mb-2">
            {" "}
            <p className="text-gray-800 leading-5">Total Value Locked </p>
            <img
              src="/images/icons/tooltip.svg"
              className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
            />
          </div>
          <p className="text-gray-900 text-4xl leading-8">$5.55m</p>
        </div>

        <div className=" rounded-lg border border-gray-900 p-6 my-8">
          <div className="flex items-center gap-2 mb-2">
            {" "}
            <p className="text-gray-800 leading-5">My Net Worth</p>
            <img
              src="/images/icons/tooltip.svg"
              className={`inline-flex items-center border border-transparent rounded-full text-gray-500 `}
            />
          </div>
          <p className="text-gray-900 text-4xl leading-8">$45,032,100</p>
        </div>

        <div className=" rounded-lg border border-gray-300 p-6">
          <p className="text-gray-900 text-4xl leading-8">Connect your wallet</p>
          <div className="border-t border-b border-gray-300 py-2 mt-4">
            <SecondaryActionButton label="Connect" />
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-4 h-full">
        <div className="rounded-lg px-8 py-9 bg-customYellow h-full flex flex-col justify-between">
          <p className=" text-8xl leading-13">
            Connect <br />
            Deposit <br />
            Do well <br />
            Do good
          </p>
          <div className="flex justify-end">
            <img src="/images/smiley.svg" alt="" />
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-5 h-full">
        <img src="/images/bubbleGumWoman.svg" alt="" className="w-full h-full object-cover rounded-lg" />
      </div>
    </section>
  );
}
