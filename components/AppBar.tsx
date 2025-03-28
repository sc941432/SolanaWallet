import { FC } from 'react'
import styles from '../styles/Home.module.css'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Image from 'next/image'

const AppBar: FC = () => {
    return (
        <div className={styles.AppHeader}>
            <WalletMultiButton />
        </div>
    )
}
export default AppBar;
