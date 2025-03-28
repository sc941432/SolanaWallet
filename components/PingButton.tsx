import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as Web3 from '@solana/web3.js';
import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/PingButton.module.css';
import { Send } from 'lucide-react';

const PROGRAM_ID = new Web3.PublicKey("ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa");
const PROGRAM_DATA_PUBLIC_KEY = new Web3.PublicKey("Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod");

const PingButton: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (!connection || !publicKey) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setLoading(true);

      const transaction = new Web3.Transaction();
      const instruction = new Web3.TransactionInstruction({
        keys: [{ pubkey: PROGRAM_DATA_PUBLIC_KEY, isSigner: false, isWritable: true }],
        programId: PROGRAM_ID,
      });

      transaction.add(instruction);
      const signature = await sendTransaction(transaction, connection);
      console.log(`Explorer URL: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    } catch (error) {
      console.error("Ping failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.buttonContainer}
    >
      <button className={styles.button} onClick={onClick} disabled={loading}>
        <Send size={18} style={{ marginRight: 8 }} />
        {loading ? "Sending..." : "Ping!"}
      </button>
    </motion.div>
  );
};

export default PingButton;
