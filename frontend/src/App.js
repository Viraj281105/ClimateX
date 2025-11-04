import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";

// Page imports
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import PolicyLabPage from "@/pages/PolicyLabPage";
import AboutPage from "@/pages/AboutPage";
import CausalSimulator from "@/pages/CausalSimulator";
import SentimentTracker from "@/pages/SentimentTracker";

function App() {
  return (
    <div className="App min-h-screen text-foreground">
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Vanta background will be applied only in HomePage.jsx */}
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/policy-lab" element={<PolicyLabPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/causal-simulator" element={<CausalSimulator />} />
          <Route path="/sentiment-tracker" element={<SentimentTracker />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
