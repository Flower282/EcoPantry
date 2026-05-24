import { createRoot } from "react-dom/client";
import App from "@/pages/App";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/stores/authStore";
import "@/styles/index.css";

function Root() {
  const token = useAuthStore((s) => s.token);
  return token ? <App /> : <LoginPage />;
}

createRoot(document.getElementById("root")!).render(<Root />);