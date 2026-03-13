import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/context/GameContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./pages/LoadingScreen";
import LoginScreen from "./pages/LoginScreen";
import TutorialScreen from "./pages/TutorialScreen";
import MainMapScreen from "./pages/MainMapScreen";
import LocationInteractionScreen from "./pages/LocationInteractionScreen";
import BattleScreen from "./pages/BattleScreen";
import LootScreen from "./pages/LootScreen";
import CharacterScreen from "./pages/CharacterScreen";
import InventoryScreen from "./pages/InventoryScreen";
import QuestScreen from "./pages/QuestScreen";
import ShopScreen from "./pages/ShopScreen";
import SettingsScreen from "./pages/SettingsScreen";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <GameProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/loading" element={<LoadingScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/tutorial" element={<TutorialScreen />} />
              <Route path="/map" element={<MainMapScreen />} />
              <Route path="/location/:id" element={<LocationInteractionScreen />} />
              <Route path="/battle/:id" element={<BattleScreen />} />
              <Route path="/loot" element={<LootScreen />} />
              <Route path="/character" element={<CharacterScreen />} />
              <Route path="/inventory" element={<InventoryScreen />} />
              <Route path="/quests" element={<QuestScreen />} />
              <Route path="/shop" element={<ShopScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GameProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
