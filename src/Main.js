
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect } from 'react';
import DynamicMethods from './Methods.js';
import './Main.css';

const checkIsDarkSchemePreferred = () => window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;

const Main = () => {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="header">
        <h1>EthBox: a Web3 Dropbox for immutable, secure audio media transfer</h1>
        {/* <img className="logo" src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"} alt="dynamic" /> */}
      </div>
      <div className="modal">
        <DynamicWidget />
        <DynamicMethods isDarkMode={isDarkMode} />
      </div>
    </div> 
  );
}

export default Main;
