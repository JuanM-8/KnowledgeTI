import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <>
      <Link to={"/"}><button>Volver</button></Link>
      <h1>404 🙍‍♂️</h1>
    </>
  );
}
