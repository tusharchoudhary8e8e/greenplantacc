
  import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Auto-recover from chunk load errors when new deployments happen
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  window.location.reload();
});

window.addEventListener("error", (event) => {
  if (
    event.message &&
    (event.message.includes("dynamically imported module") ||
      event.message.includes("Failed to fetch dynamically imported module") ||
      event.message.includes("Importing a module script failed"))
  ) {
    event.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
  