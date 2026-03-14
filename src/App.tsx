import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/context/GameContext";
import { IntlProviderWrapper } from "@/i18n/IntlProviderWrapper";

import { Navigate } from "react-router-dom";
import { useAirRaidAlert } from "@/hooks/useAirRaidAlert";
import { AirRaidAlert } from "@/components/game/AirRaidAlert";
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
import ShopScreen from "./pages/ShopScreen";
import SettingsScreen from "./pages/SettingsScreen";
import PatternsScreen from "./pages/PatternsScreen";
import DungeonEntranceScreen from "./pages/DungeonEntranceScreen";

const queryClient = new QueryClient();

function AppContent() {
  const { showDialog, setShowDialog, regionName } = useAirRaidAlert();
  return (
    <>
      <AirRaidAlert open={showDialog} onClose={() => setShowDialog(false)} regionName={regionName} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/tutorial" element={<TutorialScreen />} />
        <Route path="/map" element={<MainMapScreen />} />
        <Route path="/location/:id" element={<LocationInteractionScreen />} />
        <Route path="/dungeon/:id" element={<DungeonEntranceScreen />} />
        <Route path="/battle/:id" element={<BattleScreen />} />
        <Route path="/loot" element={<LootScreen />} />
        <Route path="/character" element={<CharacterScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/quests" element={<Navigate to="/map" replace />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/patterns" element={<PatternsScreen />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <GameProvider>
            <IntlProviderWrapper>
              <AppContent />
            </IntlProviderWrapper>
          </GameProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
