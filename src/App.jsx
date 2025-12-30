import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import AccessSetup from './pages/AccessSetup';

import Layout from './components/Layout';
import ChatList from './pages/ChatList';
import Worklist from './pages/Worklist';
import PatientChat from './pages/PatientChat';
import AddPatient from './pages/AddPatient';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/access-setup" element={<AccessSetup />} />

        {/* Protected app routes */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="chats" replace />} />
          <Route path="chats" element={<ChatList />} />
          <Route path="chats/unit" element={<PatientChat type="UNIT" />} />
          <Route path="chats/patient/:patientId" element={<PatientChat type="PATIENT" />} />
          <Route path="worklist" element={<Worklist />} />
          <Route path="add-patient" element={<AddPatient />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;