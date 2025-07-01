
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from "./Dashboard";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard to provide access to navigation
    navigate('/dashboard');
  }, [navigate]);

  return <Dashboard />;
};

export default Index;
