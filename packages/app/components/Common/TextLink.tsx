import { ArrowCircleRightIcon } from "@heroicons/react/outline";
import Link from "next/link";
import { useRouter } from "next/router";

interface TextLinkProps {
  text: string;
  url: string;
}

export default function TextLink({ text, url }: TextLinkProps) {
  const router = useRouter();
  return (
    <Link href={`/${router?.query?.network}${url}`} passHref>
      <a className="flex flex-shrink-0 text-lg text-blue-600 font-medium hover:text-blue-900 whitespace-nowrap">
        {text}
        <ArrowCircleRightIcon height={18} className="inline self-center ml-2" />
      </a>
    </Link>
  );
}
