import { InfoIconWithTooltip, InfoIconWithTooltipProps } from "components/InfoIconWithTooltip";
import MainActionButton from "components/MainActionButton";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export interface ProductProps {
  title: string;
  description: string;
  stats: [StatWithTitleProps] | [StatWithTitleProps, StatWithTitleProps];
  route: string;
  customContent?: React.ReactElement;
  badge?: string;
}

export interface StatWithTitleProps {
  title: string;
  content: string;
  infoIcon: InfoIconWithTooltipProps;
}

export function StatWithTitle({ title, content, infoIcon }: StatWithTitleProps): JSX.Element {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-primaryLight leading-5">{title}</p>
        <InfoIconWithTooltip
          title={infoIcon.title}
          content={infoIcon.content}
          id={infoIcon.id}
          classExtras={infoIcon.classExtras}
        />
      </div>
      <p className="text-primary text-2xl md:text-3xl leading-8">{content}</p>
    </>
  );
}

export default function Product({ title, description, stats, route, customContent, badge }: ProductProps): JSX.Element {
  const router = useRouter();

  return (
    <div className="border-b border-customLightGray grid grid-cols-12 items-center gap-6 md:gap-8 py-7">
      <div className="col-span-12 md:col-span-4 order-1">
        <div className="relative flex flex-row">
          <p className="text-black text-4xl leading-9 md:leading-10 mb-2">{title}</p>
          {badge && <img src={badge} alt={`badge-${title}`} className="hidden md:inline-block ml-8 -mt-28" />}
        </div>
        <p className=" text-primaryDark">{description}</p>
      </div>

      <div className="col-span-12 md:col-span-3 order-4 md:order-2">{customContent && customContent}</div>

      <div className="col-span-4 md:col-span-1 order-2 md:order-3">
        <StatWithTitle title={stats[0].title} content={stats[0].content} infoIcon={stats[0].infoIcon} />
      </div>

      <div className="col-span-4 md:col-span-2 order-3 md:order-4">
        {stats.length === 2 && (
          <StatWithTitle title={stats[1].title} content={stats[1].content} infoIcon={stats[1].infoIcon} />
        )}
      </div>

      <div className="col-span-12 md:col-span-2 order-5">
        <Link href={`/${router?.query?.network}/${route}`} passHref>
          <a>
            <MainActionButton label="View" />
          </a>
        </Link>
      </div>
    </div>
  );
}
