import { useAuth } from "./context/AuthContext";
import { BalancePage } from "./pages/BalancePage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const { token } = useAuth();
  return token ? <BalancePage /> : <LoginPage />;
}
