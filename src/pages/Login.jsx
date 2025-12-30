import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Authenticate user (identity only)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Check if access profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile || !profile.unit_id) {
      navigate('/access-setup');
    } else {
      navigate('/app');
    }

    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="card">
        <h1>Medical Intern Support App</h1>
        <p>Please sign in to continue</p>

        <form onSubmit={handleLogin} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate('/register')}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;