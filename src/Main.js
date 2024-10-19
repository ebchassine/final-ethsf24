import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect } from 'react';
import DynamicMethods from './Methods.js';
import './Main.css';

const checkIsDarkSchemePreferred = () => window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;

const Main = () => {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);

  // Fetch the user and primary wallet data
  const { user, primaryWallet } = useDynamicContext();

  // Handle the dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());

    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch user information with DynamicMethods if needed
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
        {/* Widget for wallet connection */}
        <DynamicWidget />

        {/* Pass user info to DynamicMethods component */}
        <DynamicMethods isDarkMode={isDarkMode} />

        {user ? (
          <div className="user-info">
            <button className="btn btn-primary" onClick={fetchUserDetails}>Fetch User</button>
            
            {/* Display user's first name, email, and connected wallet address */}
            <h3>Connected Address:</h3>
            <p>{user.firstName || 'No name available'}</p>
            <p>{user.email || 'No email available'}</p>
            <p>{primaryWallet?.address ?? 'No wallet connected'}</p>
          </div>
        ) : (
          <p>Please connect your wallet to see user information.</p>
        )}
      </div>
    </div>
  );
};

export default Main;
