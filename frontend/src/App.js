import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Common/Home';
import Login from './Common/Login';
import Register from './Common/Register';
import AdminDashboard from './Admin/AdminDashboard';
import VolunteerDashboard from './Volunteer/VolunteerDashboard';
import NGODashboard from './Authority/NGODashboard';
import Profile from './Common/Profile';
import Notifications from './Common/Notifications';

import ManageUsers from './Admin/ManageUsers';
import ManageVolunteers from './Admin/ManageVolunteers';
import ManageAuthorities from './Admin/ManageAuthorities';
import ManageIncidents from './Admin/ManageIncidents';
import ManageResources from './Admin/ManageResources';
import TaskAssignment from './Admin/TaskAssignment';
import ReportsAnalytics from './Admin/ReportsAnalytics';
import ReportsChart from './Admin/ReportsChart';

import AdminMap from './Admin/AdminMap';
import ManageReliefNodes from './Admin/ManageReliefNodes';

import ReportAnalyzing from './Authority/ReportAnalyzing';
import RescueOperation from './Authority/RescueOperation';
import ResourceAllocation from './Authority/ResourceAllocation';
import AuthorityCommunication from './Authority/AuthorityCommunication';

import AssignedTasks from './Volunteer/AssignedTasks';
import DisasterReports from './Volunteer/DisasterReports';
import VolunteerResources from './Volunteer/VolunteerResources';
import VolunteerMap from './Volunteer/VolunteerMap';

import { Toaster } from 'react-hot-toast';

function App() {
  const [auth, setAuth] = useState(JSON.parse(localStorage.getItem('user')) || null);

  // Sync auth state if localStorage is updated (e.g. on login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setAuth(JSON.parse(localStorage.getItem('user')) || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* If not authenticated OR if the auth object is empty/missing role */}
        {(!auth || !auth.role) ? (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
          <>
            {/* COMMON AUTHENTICATED ROUTES */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* ROLE-SPECIFIC ROUTES */}
            {auth.role === "Admin" && (
              <>
                <Route path="/" element={<Navigate to="/admin-dashboard" />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/volunteers" element={<ManageVolunteers />} />
                <Route path="/admin/authorities" element={<ManageAuthorities />} />
                <Route path="/admin/incidents" element={<ManageIncidents />} />
                <Route path="/admin/resources" element={<ManageResources />} />
                <Route path="/admin/relief-nodes" element={<ManageReliefNodes />} />
                <Route path="/admin/tasks" element={<TaskAssignment />} />
                <Route path="/admin/reports" element={<ReportsAnalytics />} />
                <Route path="/admin/reports-chart" element={<ReportsChart />} />
                <Route path="/admin/map" element={<AdminMap />} />
                <Route path="/admin/communication" element={<AuthorityCommunication />} />

                <Route path="*" element={<Navigate to="/admin-dashboard" />} />
              </>
            )}
            {auth.role === "User" && (
              <>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
            {auth.role === "Volunteer" && (
              <>
                <Route path="/" element={<Navigate to="/volunteer-dashboard" />} />
                <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
                <Route path="/volunteer/tasks" element={<AssignedTasks />} />
                <Route path="/volunteer/reports" element={<DisasterReports />} />
                <Route path="/volunteer/map" element={<VolunteerMap />} />
                <Route path="/volunteer/resources" element={<VolunteerResources />} />
                <Route path="/volunteer/communication" element={<AuthorityCommunication />} />
                <Route path="*" element={<Navigate to="/volunteer-dashboard" />} />
              </>
            )}
            {auth.role === "NGO" && (
              <>
                <Route path="/" element={<Navigate to="/ngo-dashboard" />} />
                <Route path="/ngo-dashboard" element={<NGODashboard />} />
                <Route path="/ngo/reports" element={<ReportAnalyzing />} />
                <Route path="/ngo/rescue" element={<RescueOperation />} />
                <Route path="/ngo/resources" element={<ResourceAllocation />} />
                <Route path="/ngo/communication" element={<AuthorityCommunication />} />
                <Route path="*" element={<Navigate to="/ngo-dashboard" />} />
              </>
            )}
          </>
            {/* Catch-all for logged in but unknown role */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
