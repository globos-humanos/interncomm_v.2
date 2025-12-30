import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AccessSetup = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [pgCode, setPgCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1️⃣ Get current authenticated user
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      alert('Session expired. Please login again.');
      navigate('/');
      return;
    }

    const userId = session.user.id;
    const userName = session.user.user_metadata?.name || session.user.email;

    if (!role || !unitCode) {
      alert('Please select role and enter unit code.');
      setLoading(false);
      return;
    }

    // 2️⃣ Validate unit
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('*')
      .eq('unit_code', unitCode)
      .single();

    if (unitError || !unit) {
      alert('Invalid unit code.');
      setLoading(false);
      return;
    }

    // 3️⃣ Validate PG code if needed
    if (role === 'PG') {
      if (!pgCode) {
        alert('PG code required.');
        setLoading(false);
        return;
      }

      if (pgCode !== unit.pg_code) {
        alert('Invalid PG code.');
        setLoading(false);
        return;
      }
    }

    // 4️⃣ Create or update profile (ACCESS BINDING)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: userName,
        role: role,
        unit_id: unit.id
      });

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    alert('Access configured successfully.');
    navigate('/'); // back to Login — Login decides next step
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Set Up Your Posting</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
      >
        <div>
          <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select role</option>
            <option value="INTERN">Intern</option>
            <option value="PG">PG</option>
          </select>
        </div>

        <div>
          <label>Unit Code</label>
          <input
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            placeholder="Enter unit code"
            required
          />
        </div>

        {role === 'PG' && (
          <div>
            <label>PG Code</label>
            <input
              value={pgCode}
              onChange={(e) => setPgCode(e.target.value)}
              placeholder="Enter PG code"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Saving…' : 'Confirm Access'}
        </button>
      </form>
    </div>
  );
};

export default AccessSetup;