import { useState, useEffect } from 'react';
import { useDynamicContext, useIsLoggedIn, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from '@dynamic-labs/ethereum'

import './Methods.css';
import { APP_CONFIG } from "./AppConfig"
import {weaveReadFiles, weaveReadWallets, weaveStoreWallet} from "./Backend";
import LOCAL_STORAGE from "./LocalStorage";
import { enc } from "crypto-js"

export default function DynamicMethods({ isDarkMode }) {
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, primaryWallet, user } = useDynamicContext();
  const userWallets = useUserWallets();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState('');

  async function readWallets() {
    console.log("Loading wallets")
    const wallets = await weaveReadWallets(APP_CONFIG.organization);
    console.log("Loaded wallets")
    console.log(wallets)
  }

  async function readFiles() {
    console.log("Loading files")
    const files = await weaveReadFiles(APP_CONFIG.organization);
    console.log("Loaded files");
    //console.log(files)
    const result = [];
    (files.data || []).forEach((f) => {
        if (f.recipient === primaryWallet) {
            result.push(f);
        }
    })
    console.log(result);
  }

    const safeStringify = (obj) => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      }, 2);
    };


  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn && primaryWallet) {
      readFiles();
      readWallets();
      setIsLoading(false);
    }
  }, [sdkHasLoaded, isLoggedIn, primaryWallet]);

  function clearResult() {
    setResult('');
  }

  function showUser() {
    setResult(safeStringify(user));
    readFiles();
  }

  function showUserWallets() {
    setResult(safeStringify(userWallets));
  }


    async function fetchPublicClient() {
        if(!primaryWallet || !isEthereumWallet(primaryWallet)) return;

        const publicClient = await primaryWallet.getPublicClient();
        setResult(safeStringify(publicClient));
    }

    async function fetchWalletClient() {
        if(!primaryWallet || !isEthereumWallet(primaryWallet)) return;

        const walletClient = await primaryWallet.getWalletClient();
        setResult(safeStringify(walletClient));
    }

    async function signMessage() {
        await readWallets();
        await readFiles();

        if(!primaryWallet || !isEthereumWallet(primaryWallet)) return;

        const wallet = primaryWallet.address;
        const state = LOCAL_STORAGE.loadState();
        const wevKey = state.backend?.pub;
        const toSign = `Please sign this message to confirm you own this wallet\nThere will be no blockchain transaction or any gas fees.\n\nWallet: ${wallet}\nKey: ${wevKey}`;
        const signature = await primaryWallet.signMessage(toSign);
        setResult(signature);
        console.log(signature)

        LOCAL_STORAGE.saveState({...state, signature, wallet})

        weaveStoreWallet(APP_CONFIG.organization, wallet, signature);
    }


   return (
    <>
      {!isLoading && (
        <div className="dynamic-methods" data-theme={isDarkMode ? 'dark' : 'light'}>
          <div className="methods-container">
            <button className="btn btn-primary" onClick={showUser}>Fetch User</button>
            <button className="btn btn-primary" onClick={showUserWallets}>Fetch User Wallets</button>

            
    {isEthereumWallet(primaryWallet) &&
      <>
        <button className="btn btn-primary" onClick={fetchPublicClient}>Fetch Public Client</button>
        <button className="btn btn-primary" onClick={fetchWalletClient}>Fetch Wallet Client</button>
        <button className="btn btn-primary" onClick={signMessage}>Prove Wallet Ownership</button>
      </>
    }

        </div>
          {result && (
            <div className="results-container">
              <pre className="results-text">
                {result && (
                  typeof result === "string" && result.startsWith("{")
                  ? JSON.stringify(JSON.parse(result), null, 2)
                  : result
                )}
              </pre>
            </div>
          )}
          {result && (
            <div className="clear-container">
              <button className="btn btn-primary" onClick={clearResult}>Clear</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}