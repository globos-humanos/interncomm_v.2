import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AddPatient = () => {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    hospital_number: ''
  });

  const [profile, setProfile] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // ----------------------------
  // Load profile from Supabase
  // ----------------------------
  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      setProfile(data);
    };

    loadProfile();
  }, []);

  // ----------------------------
  // OCR logic (unchanged)
  // ----------------------------
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      processImage(e.target.files[0]);
    }
  };

  const processImage = async (file) => {
    setLoading(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      setOcrText(text);

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const potentialName = lines.find(l => l.length > 5 && !/\d/.test(l));
      const potentialNumber = lines.find(l => /\d{5,}/.test(l));

      setFormData({
        display_name: potentialName || '',
        age: '',
        hospital_number: potentialNumber || ''
      });

      setStep(2);
    } catch (err) {
      console.error(err);
      alert('OCR Failed. Please enter details manually.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Submit → Supabase insert
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase.from('patients').insert({
      display_name: formData.display_name,
      age: formData.age,
      hospital_number: formData.hospital_number,
      unit_id: profile.unit_id,
      status: profile.role === 'INTERN' ? 'pending_approval' : 'active'
    });

    if (error) {
      console.error(error);
      alert('Error creating patient');
      return;
    }

    alert(
      profile.role === 'INTERN'
        ? 'Patient submitted for approval.'
        : 'Patient created successfully.'
    );

    navigate('/app/chats');
  };

  if (!profile) {
    return <div style={{ padding: '20px' }}>Loading…</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Add New Patient</h2>

      {loading && <p>Processing Image... Please wait.</p>}

      {step === 1 && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              padding: '20px',
              fontSize: '18px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              width: '100%'
            }}
          >
            📸 Take Photo of Card
          </button>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />

          <div style={{ textAlign: 'center', color: '#666' }}>
            Or enter manually below...
          </div>

          <button onClick={() => setStep(2)}>Skip Photo</button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {image && (
            <img
              src={image}
              alt="Capture"
              style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
            />
          )}

          <div>
            <label>Patient Name</label>
            <input
              value={formData.display_name}
              onChange={e => setFormData({ ...formData, display_name: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>

          <div>
            <label>Age</label>
            <input
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>Hospital Number</label>
            <input
              value={formData.hospital_number}
              onChange={e => setFormData({ ...formData, hospital_number: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ backgroundColor: '#fff3cd', padding: '10px', fontSize: '12px' }}>
            Please verify all details against the physical card.
          </div>

          <button
            type="submit"
            style={{
              padding: '15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              fontSize: '16px'
            }}
          >
            {profile.role === 'INTERN' ? 'Submit for Confirmation' : 'Create Patient'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddPatient;