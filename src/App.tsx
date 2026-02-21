import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import Index from "./pages/Index";

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <Index />
      <ToastContainer />
    </ToastProvider>
  </AuthProvider>
);

export default App;
