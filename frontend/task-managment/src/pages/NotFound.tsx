import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-shell">
      <h1>Page not found</h1>
      <p>The requested page does not exist or you do not have access.</p>
      <Link to="/">Go back home</Link>
    </div>
  );
}
