import { createRoot } from "react-dom/client";
import { Home } from "./pages/Home.jsx"; //pages
import { Login } from "./pages/Login.jsx"; //pages
import { NotFoundPage } from "./pages/NotFoundPage.jsx"; //pages
import { Footer } from "./components/Footer.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/Authcontext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import "./styles/index.css";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/home",
    element: (
      <PrivateRoute>
        <Home />
      </PrivateRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <span class="glow"></span>
    <RouterProvider router={router} />
    <Footer></Footer>
  </AuthProvider>
);
