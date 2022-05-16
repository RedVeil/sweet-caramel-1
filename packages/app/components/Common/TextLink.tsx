import { ArrowCircleRightIcon } from "@heroicons/react/outline";
import Link from "next/link";
import { useRouter } from "next/router";

interface TextLinkProps {
  text: string;
  url: string;
  textSize?: string;
  showArrow?: boolean;
  outsideLink?: boolean;
  openInNewTab?: boolean;
}

export default function TextLink({
  text,
  url,
  textSize = "text-md",
  showArrow = true,
  outsideLink,
  openInNewTab,
}: TextLinkProps) {
  const router = useRouter();
  return (
    <Link href={outsideLink ? url : `/${router?.query?.network}${url}`} passHref>
      <a
        className={`flex flex-shrink-0 ${textSize} font-medium text-blue-600 hover:text-blue-900 whitespace-nowrap`}
        target={openInNewTab ? "_blank" : "_self"}
      >
        {text}
        {showArrow && <ArrowCircleRightIcon height={18} className="inline self-center ml-2" />}
      </a>
    </Link>
  );
}
