import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect } from 'react';
import DynamicMethods from './Methods.js';
import './Main.css';
import { WeaveHelper, WeaveAPI } from "./weaveapi";
import {weaveReadFiles, weaveReadWallets, weaveSendFile} from "./Backend";
import {APP_CONFIG} from "./AppConfig";

import { ec, eddsa } from "elliptic";
import { binary_to_base58, base58_to_binary } from 'base58-js'
import keys from "./weaveapi/keys";
import LOCAL_STORAGE from "./LocalStorage";
import { enc } from "crypto-js"
import {Buffer} from "buffer";

const EC = ec;
const CURVE_TYPE = "secp256k1";
const ecc = new EC(CURVE_TYPE);

const checkIsDarkSchemePreferred = () => window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;

const Main = () => {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);
  const [targetWallet, setTargetWallet] = useState(null);
  const [files, setFiles] = useState([]);

  // Fetch the user and primary wallet data from DynamicContext
  const { user, primaryWallet } = useDynamicContext();

  // Handle dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());

    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    readFiles();
  }, [primaryWallet?.address]);

  // Fetch user details (for debugging or console logging)
  const fetchUserDetails = () => {
    if (user) {
      console.log('User details:', user);
    } else {
      console.log('No user logged in.');
    }
  };

  async function readFiles() {
    const wallets = await readWallets();
    console.log(wallets)

    console.log("Loading files")
    const files = await weaveReadFiles(APP_CONFIG.organization);
    console.log("Loaded files");
    //console.log(files)
    const result = [];
    (files.data || []).forEach((f) => {
      if (f.recipient === primaryWallet?.address) {
        const idxTarget = wallets ? wallets.findIndex(e => e.writer === f.writer) : -1;
        const source = idxTarget >= 0 ? wallets[idxTarget].wallet : "not proved";

        f.source = source;
        result.push(f);
      }
    })
    setFiles(result);
  }

  const setWallet = (data) => {
    console.log(data)
    setTargetWallet(data.wallet);
  }

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  async function readWallets() {
    console.log("Loading wallets")
    const wallets = await weaveReadWallets(APP_CONFIG.organization);
    console.log("Loaded wallets")
    console.log(wallets)
    return wallets.data;
  }

  const sendFile = async () => {
    if (targetWallet) {
      if (document.querySelector('#uploaded_file').files[0]) {
        const name = document.querySelector('#uploaded_file').files[0].name;
        const type = document.querySelector('#uploaded_file').files[0].type;
        const content = document.querySelector('#uploaded_file').files[0];
        console.log(content)
        const encoded = await toBase64(content);
        console.log(encoded)

        const wallets = await readWallets();
        console.log(wallets)
        const idxTarget = wallets ? wallets.findIndex(e => e.wallet === targetWallet) : -1;
        if (idxTarget >= 0) {
          //Diffie-Hellman
          const targetKey = wallets[idxTarget].writer;
          const pubTarget = ecc.keyFromPublic(WeaveHelper.ApiContext.deserializePublic(targetKey), "bytes");
          console.log(pubTarget);

          const state = LOCAL_STORAGE.loadState();
          const clientKeys = WeaveHelper.ApiContext.unpackKeys(state.backend?.pvk);
          const secretKey = keys.fromHexU(clientKeys.derive(pubTarget.getPublic()).toString(16), 32);

          const kex = new keys.KeyExchange();
          const seed = keys.wordToByteArray(enc.Hex.parse(APP_CONFIG.seed));
          var iv = new Int8Array(16);
          keys.getRandomValues(iv);
          const encrypted = kex.encrypt(secretKey, encoded, seed, iv)
          console.log(iv)
          console.log(secretKey)
          console.log(encrypted);
          const final = encrypted.toString('base64');
          //console.log(final)

          await weaveSendFile(APP_CONFIG.organization, name, type, targetWallet, final, keys.toHex(iv));
          console.log("Sent file");
        } else {
          console.log("Target wallet did not advertise public key")
        }
      } else {
        console.log("No file selected");
      }
    } else {
      console.log("No target wallet");
    }
  }

  const downloadFile = async (f) => {
      //Diffie-Hellman
      const sourceKey = f.writer;
      const pubSource = ecc.keyFromPublic(WeaveHelper.ApiContext.deserializePublic(sourceKey), "bytes");
      console.log(pubSource);

      const state = LOCAL_STORAGE.loadState();
      const clientKeys = WeaveHelper.ApiContext.unpackKeys(state.backend?.pvk);
      const secretKey = keys.fromHexU(clientKeys.derive(pubSource.getPublic()).toString(16), 32);

      const iv = keys.fromHex(f.iv);
      const kex = new keys.KeyExchange();
      const seed = keys.wordToByteArray(enc.Hex.parse(APP_CONFIG.seed));
      console.log(iv)
      console.log(secretKey)

      const data = Buffer.from(f.content, "base64");
      const decrypted = kex.decrypt(secretKey, data, seed, iv);
      console.log(decrypted);

      const result = new TextDecoder().decode(new Uint8Array(decrypted)).trim();
      console.log(result);

      var element = document.createElement('a');
      element.setAttribute('href', result);
      element.setAttribute('download', f.name);
      element.setAttribute('target', "_blank");
      element.style.display = 'none';
      element.click();
  }

  console.log(files)

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="header">
        <h1>EthBox: a Web3 Dropbox for immutable, secure audio media transfer</h1>
      </div>

      <div className="modal">
        {/* Dynamic Wallet Login */}
        <DynamicWidget />
        <DynamicMethods isDarkMode={isDarkMode} />

        {/* Render content only if user is authenticated */}
        {user ? (
          <>
            <div className="top-sections">
              {/* User Information, Wallet Address Input, and Send File Form in a Row */}
              <div className="info-row">
                <div className="user-info">
                  <h3>User Information</h3>
                  <p><strong>Name:</strong> {user.firstName || 'No name available'}</p>
                  <p><strong>Email:</strong> {user.email || 'No email available'}</p>
                  <p><strong>Wallet:</strong> {primaryWallet?.address || 'No wallet connected'}</p>
                </div>

                <div className="wallet-input">
                  <h3>Send to Wallet</h3>
                  <input type="text" id="wallet-address" placeholder="Enter wallet address" style={{width: 320}} onChange={(event) => setWallet({ wallet: event.target.value })}/>
                </div>

                <div className="send-file">
                  <h3>Send a File</h3>
                  <input type="file" id="uploaded_file" name="uploaded_file" />
                  <br />
                  {/*
                  <label htmlFor="send-wallet-address">Send to Wallet:</label>
                  <input type="text" id="send-wallet-address" placeholder="Enter wallet address" />
                  */}
                  <br/>
                  <button type="submit" onClick={() => sendFile()}>Send</button>
                </div>
              </div>
            </div>

            <div className="received-files">
              <h3>Received Files</h3>
              <div className="file-list">
                {(files || []).map((f) =>
                  <div className="file-card">
                    <p><strong>Sender:</strong> {f.source}</p>
                    <p><strong>File Name:</strong> {f.name}</p>
                    <button type="submit" onClick={() => downloadFile(f)}>Download</button>
                  </div>)
                }
              </div>
            </div>
        </>
        ) : (
          <p>Please connect your wallet to see user information and interact with the app.</p>
        )}
      </div>
    </div>
  );
};

export default Main;
