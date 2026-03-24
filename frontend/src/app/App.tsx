import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { AuthProvider } from "./AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
