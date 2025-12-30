import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Worklist = () => {
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expandedPatient, setExpandedPatient] = useState(null);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('routine');
  const [addingForPatient, setAddingForPatient] = useState(null);

  // -------------------------------
  // Helpers
  // -------------------------------
  const isWithin24Hours = (patient) => {
    if (patient.status !== 'pending_approval') return true;
    const createdAt = new Date(patient.created_at).getTime();
    return Date.now() - createdAt < 24 * 60 * 60 * 1000;
  };

  const priorityOrder = {
    stat: 0,
    urgent: 1,
    routine: 2
  };

  const tasksForPatient = (patientId) =>
    tasks
      .filter(t => t.patient_id === patientId)
      .sort(
        (a, b) =>
          priorityOrder[a.priority || 'routine'] -
          priorityOrder[b.priority || 'routine']
      );

  // -------------------------------
  // Initial load
  // -------------------------------
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profileData) {
      console.error(error);
      return;
    }

    setProfile(profileData);
    await refreshAll(profileData.unit_id);
  };

  const refreshAll = async (unitId) => {
    // Patients (active + pending, 24h window)
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('unit_id', unitId)
      .in('status', ['active', 'pending_approval'])
      .order('created_at', { ascending: false });

    if (!patientError) {
      setPatients((patientData || []).filter(isWithin24Hours));
    }

    // Tasks
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!taskError) {
      setTasks(taskData || []);
    }
  };

  // -------------------------------
  // Actions
  // -------------------------------
  const handleAddTask = async (patientId) => {
    if (!newTaskText.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .insert({
        description: newTaskText,
        priority: newTaskPriority,
        patient_id: patientId,
        status: 'pending',
        created_by: profile.id
      });

    if (error) {
      alert('Failed to add task');
      console.error(error);
      return;
    }

    setNewTaskText('');
    setNewTaskPriority('routine');
    setAddingForPatient(null);
    refreshAll(profile.unit_id);
  };

  const handleCompleteTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: profile.id
      })
      .eq('id', taskId);

    if (!error) refreshAll(profile.unit_id);
  };

  // ✅ NEW: Discharge patient (PG / SR only)
  const handleDischargePatient = async (patientId) => {
    const confirmDischarge = window.confirm(
      'Discharge this patient?\n\nThey will be removed from chat and worklist.'
    );
    if (!confirmDischarge) return;

    const { error } = await supabase
      .from('patients')
      .update({
        status: 'archived',
        discharged_at: new Date().toISOString(),
        discharged_by: profile.id
      })
      .eq('id', patientId);

    if (error) {
      alert('Failed to discharge patient');
      console.error(error);
      return;
    }

    refreshAll(profile.unit_id);
  };

  // -------------------------------
  // Render
  // -------------------------------
  if (!profile) {
    return (
      <div className="app-container">
        <p>Loading worklist…</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h2 style={{ marginBottom: '12px' }}>Worklist</h2>

      {patients.length === 0 && <p>No patients available.</p>}

      {patients.map(patient => {
        const patientTasks = tasksForPatient(patient.id);
        const isOpen = expandedPatient === patient.id;

        return (
          <div key={patient.id} className="card">
            {/* Patient header */}
            <div
              onClick={() =>
                setExpandedPatient(isOpen ? null : patient.id)
              }
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div>
                <strong>{patient.display_name}</strong>
                {patient.status === 'pending_approval' && (
                  <div style={{ fontSize: '12px', color: '#f5c542' }}>
                    Pending PG approval
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {(profile.role === 'PG' || profile.role === 'SR') && (
                  <>
                    <button
                      className="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingForPatient(patient.id);
                        setExpandedPatient(patient.id);
                      }}
                    >
                      +
                    </button>

                    <button
                      className="secondary"
                      style={{ color: '#ff6b6b' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDischargePatient(patient.id);
                      }}
                    >
                      Discharge
                    </button>
                  </>
                )}
                <span>{isOpen ? '▾' : '▸'}</span>
              </div>
            </div>

            {/* Tasks */}
            {isOpen && (
              <div style={{ marginTop: '10px' }}>
                {patientTasks.length === 0 && (
                  <p style={{ fontSize: '13px' }}>No tasks yet.</p>
                )}

                {patientTasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #2a2a2a'
                    }}
                  >
                    <span>
                      {task.priority === 'stat' && '🔴 '}
                      {task.priority === 'urgent' && '🟡 '}
                      {task.priority === 'routine' && '🟢 '}
                      <span
                        style={{
                          textDecoration:
                            task.status === 'completed'
                              ? 'line-through'
                              : 'none'
                        }}
                      >
                        {task.description}
                      </span>
                    </span>

                    {task.status !== 'completed' &&
                      profile.role === 'INTERN' && (
                        <button
                          className="primary"
                          onClick={() =>
                            handleCompleteTask(task.id)
                          }
                        >
                          Done
                        </button>
                      )}
                  </div>
                ))}

                {/* Inline add task */}
                {(profile.role === 'PG' || profile.role === 'SR') &&
                  addingForPatient === patient.id && (
                    <div style={{ marginTop: '10px' }}>
                      <input
                        placeholder="New task…"
                        value={newTaskText}
                        onChange={(e) =>
                          setNewTaskText(e.target.value)
                        }
                      />

                      <select
                        value={newTaskPriority}
                        onChange={(e) =>
                          setNewTaskPriority(e.target.value)
                        }
                      >
                        <option value="routine">🟢 Routine</option>
                        <option value="urgent">🟡 Urgent</option>
                        <option value="stat">🔴 Stat</option>
                      </select>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="primary"
                          onClick={() =>
                            handleAddTask(patient.id)
                          }
                        >
                          Add
                        </button>
                        <button
                          className="secondary"
                          onClick={() =>
                            setAddingForPatient(null)
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Worklist;