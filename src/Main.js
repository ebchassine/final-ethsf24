import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect } from 'react';
import DynamicMethods from './Methods.js';
import './Main.css';

const checkIsDarkSchemePreferred = () => window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;

const Main = () => {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);
  
  // Fetch the user and primary wallet data from DynamicContext
  const { user, primaryWallet } = useDynamicContext();

  // Handle dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());

    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch user details (for debugging or console logging)
  const fetchUserDetails = () => {
    if (user) {
      console.log('User details:', user);
    } else {
      console.log('No user logged in.');
    }
  };

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
                  <input type="text" id="wallet-address" placeholder="Enter wallet address" />
                </div>

                <div className="send-file">
                  <h3>Send a File</h3>
                  <form id="send-file-form">
                    <label htmlFor="file">Select File:</label>
                    <input type="file" id="file" />
                    <br />
                    <label htmlFor="send-wallet-address">Send to Wallet:</label>
                    <input type="text" id="send-wallet-address" placeholder="Enter wallet address" />
                    <button type="submit">Send File</button>
                  </form>
                </div>
              </div>
            </div>

            {/* Received Files Section */}
            <div className="received-files">
              <h3>Received Files</h3>
              <div className="file-list">
                {/* Example of dynamically generated file cards */}
                <div className="file-card">
                  <p><strong>Sender:</strong> 0xABC...DEF</p>
                  <p><strong>File Name:</strong> document.pdf</p>
                  <a href="#" className="file-preview">Preview</a>
                </div>
                {/* More file-card divs can be dynamically inserted here */}
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
