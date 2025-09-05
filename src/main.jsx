import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import Home from "./pages/Home.jsx";
import { Login } from "./pages/Login.jsx";
//react router
import {  createBrowserRouter ,RouterProvider} from "react-router-dom";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path:"*",
    element:<NotFoundPage/>
  }
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router}/>

  </StrictMode>
);  
