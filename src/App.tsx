
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Dashboard from "./pages/Dashboard";
import SWCBuilder from "./pages/SWCBuilder";
import PortEditor from "./pages/PortEditor";
import DataTypeEditor from "./pages/DataTypeEditor";
import BehaviorDesigner from "./pages/BehaviorDesigner";
import ProjectManager from "./pages/ProjectManager";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/projects" element={<ProjectManager />} />
              <Route path="/swc-builder" element={<SWCBuilder />} />
              <Route path="/port-editor" element={<PortEditor />} />
              <Route path="/data-types" element={<DataTypeEditor />} />
              <Route path="/behavior" element={<BehaviorDesigner />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
