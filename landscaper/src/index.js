import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import i18n_res from "./data/i18n/i18n";

import LandscaperCore from './core/core';
import NeutralinoBackend from './core/backend/neutralino';

// if (!window.NL_PORT){
//   let auth_info = require("./auth_info.json");
//   window.NL_PORT = auth_info.port;
//   window.NL_TOKEN = auth_info.accessToken;
// }

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: i18n_res,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
try{
  window.Neutralino.init(); // Add this function call
} catch(e){
  console.log(e);
}
window.landscaper = new LandscaperCore(new NeutralinoBackend(window.Neutralino));