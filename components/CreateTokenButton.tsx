import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import styles from '../styles/Home.module.css'; // already imported probably
import { useState } from 'react';
import { PlusCircle, Send, Wallet, RefreshCcw, History } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import {
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
} from '@solana/web3.js';

const CreateTokenButton = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [mintAddress, setMintAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [balance, setBalance] = useState<number | null>(null); //  Balance state
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);


  // Step 1: Create Token Mint
  const handleCreateToken = async () => {
    try {
      setLoading(true);

      if (!wallet.publicKey || !wallet.sendTransaction) {
        alert("Wallet not connected");
        return;
      }

      const mint = Keypair.generate();
      const lamports = await getMinimumBalanceForRentExemptMint(connection);

      const transaction = new Transaction();

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      transaction.add(
        createInitializeMintInstruction(
          mint.publicKey,
          6, // decimals
          wallet.publicKey,
          wallet.publicKey
        )
      );

      const signature = await wallet.sendTransaction(transaction, connection, {
        signers: [mint],
      });

      await connection.confirmTransaction(signature, "confirmed");

      setMintAddress(mint.publicKey.toBase58());
      alert(` Token Created!\nMint Address: ${mint.publicKey.toBase58()}`);
    } catch (error) {
      console.error("Error creating token:", error);
      alert(" Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  //  Step 2: Mint Tokens
  const handleMintToWallet = async () => {
    try {
      if (!wallet.publicKey || !wallet.sendTransaction) {
        alert("Wallet not connected");
        return;
      }

      if (!mintAddress) {
        alert("Mint address not available. Create token first.");
        return;
      }

      const mintPublicKey = new PublicKey(mintAddress);
      const userPublicKey = wallet.publicKey;

      const ata = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);

      const tx = new Transaction();

      const ataInfo = await connection.getAccountInfo(ata);
      if (!ataInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            userPublicKey,
            ata,
            userPublicKey,
            mintPublicKey
          )
        );
      }

      tx.add(
        createMintToInstruction(
          mintPublicKey,
          ata,
          userPublicKey,
          1_000_000_000 // 1000 tokens
        )
      );

      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      alert(` Minted 1000 tokens!\nTransaction: ${sig}`);
    } catch (error) {
      console.error("Mint error:", error);
      alert(" Failed to mint tokens");
    }
  };

  //  Step 2: Transfer Tokens
  const handleTransferTokens = async (recipientAddress: string) => {
    try {
      if (!wallet.publicKey || !wallet.sendTransaction) {
        alert("Wallet not connected");
        return;
      }

      if (!mintAddress) {
        alert("Mint address not available. Create token first.");
        return;
      }

      const mint = new PublicKey(mintAddress);
      const sender = wallet.publicKey;
      const recipient = new PublicKey(recipientAddress);

      const senderATA = await getAssociatedTokenAddress(mint, sender);
      const recipientATA = await getAssociatedTokenAddress(mint, recipient);

      const transaction = new Transaction();

      const ataInfo = await connection.getAccountInfo(recipientATA);
      if (!ataInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            sender,
            recipientATA,
            recipient,
            mint
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          senderATA,
          recipientATA,
          sender,
          100_000_000 // 100 tokens
        )
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      alert(` Sent 100 tokens to ${recipientAddress}\nTx: ${signature}`);
    } catch (error) {
      console.error("Transfer error:", error);
      alert(" Token transfer failed");
    }
  };

  //  Step 3: Check Token Balance
  const handleCheckBalance = async () => {
    try {
      if (!wallet.publicKey || !mintAddress) return;

      const accounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { mint: new PublicKey(mintAddress) }
      );

      const tokenAccount = accounts.value[0]?.account.data.parsed.info;
      const amount = tokenAccount?.tokenAmount.uiAmount;

      setBalance(amount || 0);
    } catch (error) {
      console.error("Balance check error:", error);
      alert(" Failed to fetch token balance");
    }
  };

  const handleFetchTransactions = async () => {
    try {
      if (!wallet.publicKey) return;
  
      setTxLoading(true);
      setTransactions([]);
  
      const signatures = await connection.getSignaturesForAddress(wallet.publicKey, {
        limit: 10,
      });
  
      const fetched = await Promise.all(
        signatures.map(async (sigInfo) => {
          const tx = await connection.getParsedTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });
  
          return {
            signature: sigInfo.signature,
            status: sigInfo.confirmationStatus,
            instructions: tx?.transaction.message.instructions || [],
          };
        })
      );
  
      // Filter for mintTo and transfer instructions
      const tokenTxs = fetched.filter((tx) =>
        tx.instructions.some(
          (ix: any) =>
            ix.program === "spl-token" &&
            ["mintTo", "transfer"].includes(ix.parsed?.type)
        )
      );
  
      setTransactions(tokenTxs);
    } catch (error) {
      console.error("Transaction fetch error:", error);
      alert(" Failed to fetch transaction history");
    } finally {
      setTxLoading(false);
    }
  };
  

  return (
    <div className={styles.tokenContainer}>
      <h2 className={styles.tokenTitle}>SPL Token Creator & Manager</h2>
  
      {/* Create Token Button */}
      <button
        className={`${styles.actionButton} ${styles.createButton}`}
        onClick={handleCreateToken}
        disabled={loading || !wallet.connected}
      >
        <PlusCircle size={18} />
        {loading ? 'Creating Token...' : 'Create SPL Token'}
      </button>
  
      {mintAddress && (
        <>
          {/* Mint Address */}
          <p style={{ marginTop: "16px", color: "#8fff8f", textAlign: "center", wordBreak: "break-word" }}>
             Mint Address: {mintAddress}
          </p>
  
          {/* Actions */}
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Mint */}
            <button
              className={`${styles.actionButton} ${styles.mintButton}`}
              onClick={handleMintToWallet}
            >
              <Wallet size={18} />
              Mint 1000 Tokens to Wallet
            </button>
  
            {/* Input */}
            <input
              type="text"
              placeholder="Recipient wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={styles.recipientInput}
            />
  
            {/* Send */}
            <button
              className={`${styles.actionButton} ${styles.sendButton}`}
              onClick={() => handleTransferTokens(recipient)}
              disabled={loading || !recipient}
            >
              <Send size={18} />
              Send 100 Tokens
            </button>
  
            {/* Check Balance */}
            <button
              className={`${styles.actionButton} ${styles.balanceButton}`}
              onClick={handleCheckBalance}
            >
              <RefreshCcw size={18} />
              Check Token Balance
            </button>
  
            {/* Balance Display */}
            {balance !== null && (
              <p style={{ textAlign: "center", fontWeight: "bold", color: "#F5C518" }}>
                 Token Balance: {balance}
              </p>
            )}
  
            {/* Fetch History */}
            <button
              className={`${styles.actionButton} ${styles.historyButton}`}
              onClick={handleFetchTransactions}
            >
              <History size={18} />
              {txLoading ? "Fetching..." : "Show Transaction History"}
            </button>
          </div>
  
          {/* Transactions */}
          {transactions.length > 0 && (
            <div className={styles.transactionBox}>
              <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>Recent Transactions:</h3>
              <ul>
                {transactions.map((tx, index) => (
                  <li key={index} className={styles.transactionItem}>
                    <div> Signature: {tx.signature}</div>
                    <div>Status: {tx.status}</div>
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#4da6ff", textDecoration: "underline" }}
                    >
                      View on Explorer ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  
  
};

export default CreateTokenButton;
