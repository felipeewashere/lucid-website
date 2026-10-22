import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Scripts from "./pages/Scripts";
import Executors from "./pages/Executors";
import Showcases from "./pages/Showcases";
import Key from "./pages/Key";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reviews from "./pages/Reviews";
import Tos from "./pages/Tos";
import Admin from "./pages/Admin";
import RedeemInstructions from "./pages/RedeemInstructions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        if (location.pathname === "/login" || location.pathname === "/register") {
          navigate("/dashboard");
        }
      }
      if (event === "SIGNED_OUT") {
        if (location.pathname === "/dashboard") {
          navigate("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(//$/, "")}>
        <AuthListener />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/executors" element={<Executors />} />
          <Route path="/showcases" element={<Showcases />} />
          <Route path="/key" element={<Key />} />
          <Route path="/pricing" element={<Navigate to="/key" replace />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/tos" element={<Tos />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checkout" element={<Navigate to="/key" replace />} />
          <Route path="/redeem-instructions" element={<RedeemInstructions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
