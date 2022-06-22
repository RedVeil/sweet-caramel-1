import Link from "next/link";
import { useRouter } from "next/router";

interface HeroProps {
  header: string;
  content: string;
  image: string;
  link: string;
  imageSize?: string;
}

export default function Hero({ header, content, image, link, imageSize }: HeroProps): JSX.Element {
  const router = useRouter();
  return (
    <Link href={`/${router?.query?.network}${link}`} passHref>
      <div className="bg-light flex flex-col items-center justify-center py-12 px-8 smlaptop:py-12 filter shadow-custom transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl w-full h-full">
        <img
          src={image}
          className={`mx-auto flex-grow-0 w-72 md:w-80 lglaptop:w-108 ${imageSize || "h-52 md:h-60 lglaptop:h-72"}`}
        />
        <p className="mx-auto text-gray-900 mb-3 mt-8 lg:mt-12 lglaptop:mb-4 font-semibold text-2xl md:text-4xl lglaptop:text-5xl">
          {header}
        </p>
        <div className="mx-auto w-4/5">
          <p className="font-thin text-center text-gray-600 text-base md:text-xl lglaptop:text-2xl">{content}</p>
        </div>
      </div>
    </Link>
  );
}
