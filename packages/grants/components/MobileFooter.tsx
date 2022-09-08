import Link from "next/link";

export const MobileFooter: React.FC = () => {
  return (
    <footer className="bg-mobile-footer bg-contain md:bg-cover bg-no-repeat pt-64 md:pt-80">
      <section>
        <div className="w-10/12 mx-auto text-center ">
          <h2 className="w-8/12 mx-auto font-semibold text-3xl leading-snug mb-4">Subscribe to our newsletter</h2>
          <p className=" text-base font-light">Get the latest update straight in the inbox.</p>
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
              className="shadow-xl bg-white rounded-4xl py-2 px-2 mt-8 w-full mx-auto flex flex-row items-center justify-between mb-12"
            >
              <input
                type="email"
                name="EMAIL"
                className="w-10/12 p-2 text-base mx-4 text-gray-900 font-light border-0"
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
                  className="font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white rounded-4xl px-4 py-2 cursor-pointer"
                  readOnly
                  onClick={() => {}}
                />
              </div>
            </div>
          </form>
        </div>
      </section>
      <section className="w-full bg-blue-100">
        <div className="w-10/12 mx-auto pt-24">
          <Link href="/" passHref>
            <a>
              <img src="/images/smallLogo.svg" alt="Logo" className="h-10 flex-shrink-0 flex-grow-0" />
            </a>
          </Link>
          <p className="font-light text-base" style={{ marginTop: 32, marginBottom: 34 }}>
            Popcorn is a carbon-neutral crypto savings account where fees fund educational, environmental and open
            source initiatives.
          </p>
          <div className="flex flex-row space-x-4 items-center" style={{ marginBottom: 52 }}>
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
          <div className="flex flex-row justify-evenly">
            <div className="flex flex-col space-y-3 w-1/2">
              <p className="font-bold text-base uppercase">Site</p>
              <Link href="/" passHref>
                <a className="hover:text-blue-600 font-light">Home</a>
              </Link>
              <Link href="/about" passHref>
                <a className="hover:text-blue-600 font-light" target="_window">
                  About Us
                </a>
              </Link>
              <Link href="https://medium.com/popcorndao" passHref>
                <a className="hover:text-blue-600 font-light" target="_window">
                  Blog
                </a>
              </Link>
            </div>
            <div className="flex flex-col space-y-3 w-1/2">
              <p className="font-bold text-base uppercase">Connect</p>
              <Link href="https://twitter.com/Popcorn_DAO" passHref>
                <a className="hover:text-blue-600 font-light" target="_blank">
                  Twitter
                </a>
              </Link>
              <Link href="https://discord.gg/w9zeRTSZsq" passHref>
                <a className="hover:text-blue-600 font-light" target="_blank">
                  Discord
                </a>
              </Link>
              <Link href="https://github.com/popcorndao" passHref>
                <a className="hover:text-blue-600 font-light" target="_blank">
                  Github
                </a>
              </Link>
            </div>
          </div>
          <div className="flex flex-col space-y-3 mt-10">
            <p className=" font-bold text-base uppercase">Documentation</p>
            <Link href="/" passHref>
              <a className="hover:text-blue-600 font-light" target="_blank">
                Gitbook
              </a>
            </Link>
          </div>
        </div>
        <div className="w-10/12 border-t border-gray-700 mt-12 mx-auto py-5">
          <p className="font-semibold text-center py-4">
            ©{new Date().getFullYear()}, Popcorn Network. All Rights Reserved
          </p>
        </div>
      </section>
    </footer>
  );
};
