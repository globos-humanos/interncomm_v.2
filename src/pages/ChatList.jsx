import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ChatList = () => {
  const [patients, setPatients] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ----------------------------
  // Helper: check if approval overdue (>24h)
  // ----------------------------
  const isOverdue = (patient) => {
    if (patient.status !== 'pending_approval') return false;
    const createdAt = new Date(patient.created_at).getTime();
    return Date.now() - createdAt > 24 * 60 * 60 * 1000;
  };

  // ----------------------------
  // Load profile + unit patients
  // ----------------------------
  const loadData = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    // Load profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData) {
      console.error(profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Load patients for this unit
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('unit_id', profileData.unit_id)
      .order('created_at', { ascending: false });

    if (patientsError) {
      console.error(patientsError);
    } else {
      setPatients(patientsData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------
  // Approve patient (PG / SR)
  // ----------------------------
  const approvePatient = async (patientId) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session.user.id;

    const { error } = await supabase
      .from('patients')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: userId
      })
      .eq('id', patientId);

    if (error) {
      alert('Error approving patient');
      console.error(error);
      return;
    }

    loadData();
  };

  if (loading || !profile) {
    return (
      <div className="app-container">
        <p>Loading…</p>
      </div>
    );
  }

  // ----------------------------
  // Derived lists
  // ----------------------------
  const overduePatients = patients.filter(p => isOverdue(p));

  const pendingPatients = patients.filter(
    p => p.status === 'pending_approval' && !isOverdue(p)
  );

  const chatPatients = patients.filter(
    p =>
      (p.status === 'active' || p.status === 'pending_approval') &&
      p.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">

      {/* ⏰ Overdue approvals (PG/SR only) */}
      {(profile.role === 'PG' || profile.role === 'SR') &&
        overduePatients.length > 0 && (
          <div className="card" style={{ borderLeft: '4px solid #ff6b6b' }}>
            <h3 style={{ color: '#ff6b6b' }}>⏰ Overdue Approvals</h3>

            {overduePatients.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px'
                }}
              >
                <span>{p.display_name}</span>
                <button
                  className="secondary"
                  onClick={() => approvePatient(p.id)}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

      {/* ⚠️ Pending approvals (PG/SR only) */}
      {(profile.role === 'PG' || profile.role === 'SR') &&
        pendingPatients.length > 0 && (
          <div className="card">
            <h3>⚠️ Pending Approvals</h3>

            {pendingPatients.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px'
                }}
              >
                <span>{p.display_name}</span>
                <button
                  className="secondary"
                  onClick={() => approvePatient(p.id)}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search patients…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add patient */}
      <div className="card">
        <button
          className="primary"
          onClick={() => navigate('/app/add-patient')}
        >
          + Add New Patient
        </button>
      </div>

      {/* Chat-visible patients */}
      <div className="card">
        <h3>Patients</h3>

        {chatPatients.length === 0 && (
          <p>No patients yet.</p>
        )}

        {chatPatients.map(patient => {
          const overdue = isOverdue(patient);

          return (
            <div
              key={patient.id}
              onClick={() => navigate(`/app/chats/patient/${patient.id}`)}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #2a2a2a',
                cursor: 'pointer',
                opacity: overdue ? 0.7 : 1
              }}
            >
              <strong>{patient.display_name}</strong>
              <p style={{ fontSize: '12px' }}>
                {patient.status === 'active' && 'Active'}
                {patient.status === 'pending_approval' && !overdue && 'Pending approval'}
                {patient.status === 'pending_approval' && overdue && '⚠️ Approval overdue'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;