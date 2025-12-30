import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);

  // -----------------------------
  // LOAD PROFILE (READ-ONLY)
  // -----------------------------
  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', session.user.id)
        .single();

      if (!error) {
        setProfile(data);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="layout-root">
      {/* 👇 THIS is the centering container */}
      <div className="app-container">

        {/* Header */}
        <header className="layout-header">
          <span className="header-user">
            {profile?.name || 'User'} {profile?.role && `(${profile.role})`}
          </span>

          <button
            className="header-logout"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
            }}
          >
            Logout
          </button>
        </header>

        {/* Tabs */}
        <div className="layout-tabs">
          <div
            className={
              location.pathname === '/app' ||
              location.pathname === '/app/chats'
                ? 'tab active'
                : 'tab'
            }
            onClick={() => navigate('/app/chats')}
          >
            Chats
          </div>

          <div
            className={
              location.pathname === '/app/worklist'
                ? 'tab active'
                : 'tab'
            }
            onClick={() => navigate('/app/worklist')}
          >
            Worklist
          </div>
        </div>

        {/* Page Content */}
        <main className="layout-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;