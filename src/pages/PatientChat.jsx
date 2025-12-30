import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PatientChat = () => {
  const { patientId } = useParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  // ----------------------------
  // Load profile + messages
  // ----------------------------
  const loadMessages = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const userId = sessionData.session.user.id;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(profileData);

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_type', 'PATIENT')
      .eq('context_id', patientId)
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(messagesData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ----------------------------
  // Send message
  // ----------------------------
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
    loadMessages();
  };

  if (loading || !profile) {
    return <div className="card">Loading…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}
            >
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