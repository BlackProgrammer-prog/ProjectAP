import React, { useEffect } from 'react';
import { Stack } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import SideBar from './SideBar';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import { ContactsProvider } from '../../contexts/ContactsContext'; // Import the new provider

const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User is not authenticated. Redirecting to login...");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <Stack sx={{ height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p> 
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login-Register" />;
  }

  return (
    // Wrap the entire authenticated layout with the ContactsProvider only.
    // VideoCallProvider is provided globally in App.js to avoid duplicating state.
    <ContactsProvider>
      <Stack direction="row" sx={{ width: '100%' }}>
        <SideBar />
        {/* The Outlet will render the authenticated routes like /app, /contacts, etc. */}
        <Outlet />
      </Stack>
    </ContactsProvider>
  );
};

export default DashboardLayout;
