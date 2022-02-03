import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import Link from 'next/link';

interface TextLinkProps {
  text: string;
}

export default function TextLink({ text }: TextLinkProps) {
  return (
    <Link href="/rewards" passHref>
      <a className="flex flex-shrink-0 text-lg text-blue-600 font-medium py-3 hover:text-white whitespace-nowrap">
        {text}
        <ArrowCircleRightIcon height={18} className="inline self-center ml-2" />
      </a>
    </Link>
  );
}
