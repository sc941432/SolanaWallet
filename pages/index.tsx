import { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import client-only components
const CreateTokenButton = dynamic(() => import('../components/CreateTokenButton'), { ssr: false });
const PingButton = dynamic(() => import('../components/PingButton'), { ssr: false });
const AppBar = dynamic(() => import('../components/AppBar'), { ssr: false });
const WalletContextProvider = dynamic(() => import('../components/WalletContextProvider'), { ssr: false });


const Home: NextPage = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className={styles.App}>
      <Head>
        <title>Wallet-Adapter</title>
        <meta name="description" content="Wallet-Adapter" />
        <link rel="icon" href="/sol.ico" />
      </Head>

      <WalletContextProvider>
        <AppBar />
        <div className={styles.AppBody}>
        <div className={styles.card}>
          <PingButton />
        </div>
        <div className={styles.card}>
          <CreateTokenButton />
        </div>
      </div>

      </WalletContextProvider>
    </div>
  );
};

export default Home;
