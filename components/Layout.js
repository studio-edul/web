import Head from 'next/head';
import Navigation from './Navigation';

export default function Layout({ children, title = 'Portfolio' }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="preconnect" href="https://www.notion.so" />
        <link rel="dns-prefetch" href="https://www.notion.so" />
      </Head>
      <Navigation />
      {children}
    </>
  );
}

