
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/AppLayout';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import ProjectManager from '@/pages/ProjectManager';
import SWCBuilder from '@/pages/SWCBuilder';
import PortEditor from '@/pages/PortEditor';
import DataTypeEditor from '@/pages/DataTypeEditor';
import DataElementEditor from '@/pages/DataElementEditor';
import BehaviorDesigner from '@/pages/BehaviorDesigner';
import ECUCompositionEditor from '@/pages/ECUCompositionEditor';
import RequirementImporter from '@/pages/RequirementImporter';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/projects" element={<AppLayout><ProjectManager /></AppLayout>} />
          <Route path="/swc-builder" element={<AppLayout><SWCBuilder /></AppLayout>} />
          <Route path="/port-editor" element={<AppLayout><PortEditor /></AppLayout>} />
          <Route path="/data-types" element={<AppLayout><DataTypeEditor /></AppLayout>} />
          <Route path="/data-element-editor" element={<AppLayout><DataElementEditor /></AppLayout>} />
          <Route path="/behavior-designer" element={<AppLayout><BehaviorDesigner /></AppLayout>} />
          <Route path="/ecu-composition" element={<AppLayout><ECUCompositionEditor /></AppLayout>} />
          <Route path="/requirement-importer" element={<AppLayout><RequirementImporter /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
