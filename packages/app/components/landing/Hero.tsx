import Link from 'next/link';

interface HeroProps {
  header: string;
  content: string;
  image: string;
  link: string;
}

export default function Hero({ header, content, image, link }: HeroProps): JSX.Element {
  return (
    <Link href={link} passHref>
      <div className="md:w-1/2 smlaptop:w-130 bg-light flex flex-col items-start self-stretch py-12 px-8 mb-4 mt-10 mx-4 smlaptop:py-24 filter drop-shadow-3xl transition duration-500 ease-in-out transform hover:scale-102 cursor-pointer rounded-4xl">
        <img src={image} className="mx-auto flex-grow-0 w-72 md:w-80 h-52 md:h-56 lglaptop:h-72 lglaptop:w-108" />
        <p className="mx-auto text-gray-900 mb-3 mt-4 lglaptop:mb-4 lglaptop:mt-12 font-semibold text-2xl md:text-4xl lglaptop:text-5xl">
          {header}
        </p>
        <div className="mx-auto w-4/5">
          <p className="font-thin text-center text-gray-600 text-base md:text-xl lglaptop:text-2xl">{content}</p>
        </div>
      </div>
    </Link>
  );
}
