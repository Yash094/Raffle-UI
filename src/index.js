import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import "./styles/globals.css";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Mumbai } from "@thirdweb-dev/chains";
import Home from "./Pages/Home";
import Create from "./Pages/Create";
import Raffle from "./Pages/Raffle";
import { ChakraProvider } from "@chakra-ui/react";

// This is the chain your dApp will work on.
// Change this to the chain your app is built for.
// You can also import additional chains from `@thirdweb-dev/chains` and pass them directly.

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/create-raffle",
    element: <Create />,
  },
  {
    path: "/raffle/:id",
    element: <Raffle />,
  },
]);
const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <ThirdwebProvider
        activeChain={Mumbai}
        clientId={process.env.REACT_APP_TEMPLATE_CLIENT_ID}
      >
        <RouterProvider router={router} />
      </ThirdwebProvider>
    </ChakraProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
