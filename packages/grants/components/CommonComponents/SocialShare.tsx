import { FacebookIcon, TelegramIcon, TwitterIcon } from "components/Svgs";
import CopyIcon from "components/Svgs/CopyIcon";
import LinkedInIcon from "components/Svgs/LinkedInIcon";
import MailIcon from "components/Svgs/MailIcon";
import WhatsAppIcon from "components/Svgs/WhatsAppIcon";
import React from "react";

const ICON_PROPS = {
  color: "fill-primary",
  size: "35",
};

const externalOpen = (URL: string) => window.open(URL, "_blank", "noopener");
interface ShareProps {
  title: string;
  text: string;
  url: string;
}
const SocialShare: React.FC<ShareProps> = ({ title, text, url }) => {
  const socialList = [
    {
      handleShare: (url: string) => externalOpen(`https://www.facebook.com/sharer/sharer.php?href=${url}`),
      icon: <FacebookIcon {...ICON_PROPS} />,
    },
    {
      handleShare: (url: string, text: string) =>
        externalOpen(`https://twitter.com/intent/tweet?text=${text}&url=${url}`),
      icon: <TwitterIcon {...ICON_PROPS} />,
    },
    {
      handleShare: (url: string, text: string, title: string) =>
        externalOpen(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${text}`),
      icon: <LinkedInIcon {...ICON_PROPS} />,
    },
    {
      handleShare: (url: string, text: string) => externalOpen(`https://telegram.me/share/msg?url=${url}&text=${text}`),
      icon: <TelegramIcon {...ICON_PROPS} />,
    },
    {
      handleShare: (url: string, text: string) => externalOpen(`https://api.whatsapp.com/send?text=${text} ${url}`),
      icon: <WhatsAppIcon {...ICON_PROPS} />,
    },
    {
      handleShare: (url: string) => externalOpen(`mailto:?body=${url}&subject=${""}`),
      icon: <MailIcon {...ICON_PROPS} />,
    },
    {
      handleShare: (url: string) => navigator.clipboard.writeText(decodeURIComponent(url)),
      icon: <CopyIcon {...ICON_PROPS} />,
    },
  ];
  return (
    <div className="flex flex-wrap gap-8 w-full md:w-76 mt-10">
      {socialList.map(({ icon, handleShare }, index) => (
        <button key={index} onClick={() => handleShare(encodeURIComponent(url), text, title)}>
          {icon}
        </button>
      ))}
    </div>
  );
};

export default SocialShare;
