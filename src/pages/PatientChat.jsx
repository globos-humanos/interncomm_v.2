import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PatientChat = () => {
  const { patientId } = useParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  // ----------------------------------
  // Load profile, patient & messages
  // ----------------------------------
  const loadData = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const userId = session.user.id;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(profileData);

    // Load patient
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    setPatient(patientData);

    // ✅ Load messages WITH proper sender join
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        created_at,
        sender:profiles (
          id,
          name,
          role
        )
      `)
      .eq('context_type', 'PATIENT')
      .eq('context_id', patientId)
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(messagesData || []);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ----------------------------------
  // Send message
  // ----------------------------------
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    await supabase.from('messages').insert({
      sender_id: sessionData.session.user.id,
      context_type: 'PATIENT',
      context_id: patientId,
      content: newMessage.trim()
    });

    setNewMessage('');
    loadData();
  };

  if (loading || !profile || !patient) {
    return <div className="card">Loading…</div>;
  }

  const pendingMeta =
    patient.bed_number_proposed ||
    patient.working_diagnosis_proposed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Patient header */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <strong>{patient.display_name}</strong>

        <div style={{ fontSize: '13px', marginTop: '4px' }}>
          Bed:{' '}
          {patient.bed_number ||
            patient.bed_number_proposed ||
            '—'}
          <br />
          Dx:{' '}
          {patient.working_diagnosis ||
            patient.working_diagnosis_proposed ||
            '—'}
        </div>

        {pendingMeta && (
          <div style={{ fontSize: '12px', color: '#f5c542', marginTop: '4px' }}>
            Pending PG confirmation
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
        {messages.length === 0 && (
          <p style={{ color: '#777' }}>No messages yet.</p>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === profile.id;

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
                marginBottom: '10px'
              }}
            >
              {/* Sender name */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#999',
                  marginBottom: '2px'
                }}
              >
                {msg.sender?.name || 'Unknown'}
                {msg.sender?.role && ` (${msg.sender.role})`}
              </div>

              {/* Message bubble */}
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: isMine ? '#f5c542' : '#1a1a1a',
                  color: isMine ? '#000' : '#fff'
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          placeholder="Type a message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default PatientChat;
