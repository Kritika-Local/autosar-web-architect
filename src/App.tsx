
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
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/projects" element={<AppLayout />}>
            <Route index element={<ProjectManager />} />
          </Route>
          <Route path="/swc-builder" element={<AppLayout />}>
            <Route index element={<SWCBuilder />} />
          </Route>
          <Route path="/port-editor" element={<AppLayout />}>
            <Route index element={<PortEditor />} />
          </Route>
          <Route path="/data-types" element={<AppLayout />}>
            <Route index element={<DataTypeEditor />} />
          </Route>
          <Route path="/data-element-editor" element={<AppLayout />}>
            <Route index element={<DataElementEditor />} />
          </Route>
          <Route path="/behavior-designer" element={<AppLayout />}>
            <Route index element={<BehaviorDesigner />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
