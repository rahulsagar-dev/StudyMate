import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted light/dark preference before first paint
if (typeof window !== "undefined" && localStorage.getItem("studymate-light-mode") === "1") {
  document.documentElement.classList.add("light-mode");
}

createRoot(document.getElementById("root")!).render(<App />);
