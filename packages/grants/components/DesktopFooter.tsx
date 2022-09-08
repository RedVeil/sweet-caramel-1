import Link from "next/link";

export const DesktopFooter: React.FC = () => {
  return (
    <footer className="w-full font-avenir">
      <div
        className="bg-footer flex-shrink-0 flex-grow-0 w-full h-full pt-40 bg-contain 2xl:bg-cover"
        style={{
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="w-10/12 mx-auto text-center ">
          <h2 className="font-semibold text-5xl leading-snug mb-3">Subscribe to our newsletter</h2>
          <p className="text-2xl">Get the latest update straight in the inbox.</p>
          <form
            action="https://network.us1.list-manage.com/subscribe/post?u=5ce5e82d673fd2cfaf12849a5&amp;id=e85a091ed3"
            method="post"
            id="mc-embedded-subscribe-form"
            name="mc-embedded-subscribe-form"
            className="validate"
            target="_blank"
            noValidate
          >
            <div
              id="mc_embed_signup_scroll"
              className="w-5/12 shadow-xl bg-white rounded-5xl p-3 mt-10  mx-auto flex flex-row items-center justify-between relative"
            >
              <input
                type="email"
                name="EMAIL"
                className="w-10/12 p-2 text-base mx-4 text-gray-500 font-semibold border-0"
                id="mce-EMAIL"
                placeholder="Email Address"
                required
              />
              <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
                <input type="text" name="b_5ce5e82d673fd2cfaf12849a5_e85a091ed3" tabIndex={-1} />
              </div>
              <div className="clear">
                <input
                  type="submit"
                  value="Subscribe"
                  name="subscribe"
                  id="mc-embedded-subscribe"
                  className="font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white rounded-4xl px-8 py-3 cursor-pointer"
                  readOnly
                  onClick={() => {}}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="bg-blue-100">
          <div className="w-10/12 mx-auto grid grid-cols-2" style={{ paddingTop: 147 }}>
            <div>
              <Link href="/" passHref>
                <a>
                  <img src="/images/popcornLogo.svg" alt="Logo" className="h-10 flex-shrink-0 flex-grow-0"></img>
                </a>
              </Link>
              <div className="mt-8 flex flex-row space-x-4 items-center">
                <a href="https://www.facebook.com/PopcornDAO" target="_blank">
                  <img src="/images/facebook.svg" alt="" className="h-6 w-6 cursor-pointer" />
                </a>
                <a href="https://twitter.com/Popcorn_DAO" target="_blank">
                  <img src="/images/twitter.svg" alt="" className="h-6 w-6 cursor-pointer" />
                </a>
                <a href="https://github.com/popcorndao" target="_blank">
                  <img src="/images/github.svg" alt="" className="h-6 w-6 cursor-pointer" />
                </a>
                <a href="https://discord.gg/w9zeRTSZsq" target="_blank">
                  <img src="/images/discord.svg" alt="" className="h-6 w-6 cursor-pointer" />
                </a>
              </div>
            </div>
            <div className="flex flex-row justify-evenly py-6 text-gray-900">
              <div className="flex flex-col space-y-3 w-1/2">
                <p className="font-bold text-base uppercase">Site</p>
                <Link href="/about" passHref>
                  <a className="hover:text-blue-600 font-landing font-light">About</a>
                </Link>
                <Link href="/partners" passHref>
                  <a className="hover:text-blue-600 font-light">Partners</a>
                </Link>
                <Link href="/ideas" passHref>
                  <a className="hover:text-blue-600 font-light">Ideas</a>
                </Link>
                <Link href="/grants" passHref>
                  <a className="hover:text-blue-600 cursor-pointer font-light">Grants</a>
                </Link>
                <Link href="/popcorndao" passHref>
                  <a className="hover:text-blue-600 cursor-pointer font-light">PopcornDAO</a>
                </Link>
              </div>
              <div className="flex flex-col space-y-3 w-1/2">
                <p className="font-bold text-base uppercase">Connect</p>

                <a
                  href="https://twitter.com/Popcorn_DAO"
                  className="hover:text-blue-600 cursor-pointer font-light"
                  target="_blank"
                >
                  Twitter
                </a>

                <a
                  href="https://discord.gg/w9zeRTSZsq"
                  className="hover:text-blue-600 cursor-pointer font-light"
                  target="_blank"
                >
                  Discord
                </a>

                <a
                  href="https://github.com/popcorndao"
                  className="hover:text-blue-600 cursor-pointer  font-light"
                  target="_blank"
                >
                  Github
                </a>
              </div>
              <div className="flex flex-col space-y-3 w-1/2">
                <p className="font-bold text-base uppercase ">Contact Us</p>
                <Link href="mailto:info@popcorn.foundation" passHref>
                  <a className="hover:text-blue-600 font-light">info@popcorn.foundation</a>
                </Link>

                <p className="font-bold text-base uppercase" style={{ marginTop: 32 }}>
                  Documentation
                </p>
                <Link href="" passHref>
                  <a className="hover:text-blue-600  font-light">Gitbook</a>
                </Link>
              </div>
            </div>
          </div>
          <div className="w-10/12 border-t border-gray-900 border-opacity-30 mt-12 mx-auto ">
            <p className="font-semibold font-base text-center pt-8 pb-12">
              ©{new Date().getFullYear()}, Popcorn Network. All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
