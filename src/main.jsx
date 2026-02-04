import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider.jsx"
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store.js';
import "bootstrap/dist/css/bootstrap.css";
import "./index.css"
import "react-toastify/dist/ReactToastify.css";


createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </BrowserRouter>
);
