import Document from 'next/document';
import { ServerStyleSheet as StyledServerStyleSheets } from 'styled-components';
import { ServerStyleSheets as MuiServerStyleSheets } from '@material-ui/core/styles';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const styledSheet = new StyledServerStyleSheets();
    const MuiSheets = new MuiServerStyleSheets();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => <App {...props} />
          // styledSheet.collectStyles(MuiSheets.collect(<App {...props} />))
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {MuiSheets.getStyleElement()}
            {styledSheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      styledSheet.seal();
    }
  }
}