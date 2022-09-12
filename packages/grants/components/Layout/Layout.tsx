import { PropsWithChildren, FC } from 'react'
import Footer from 'components/Layout/Footer/Footer';

export const Layout: FC<PropsWithChildren<any>> = ({ children }) => {
  return (
    <div className="font-khTeka mx-auto w-full">
      <main>
        {children}
      </main>
      <Footer />
    </div>
  )
}
