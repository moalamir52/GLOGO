import { useState } from 'react';
import { daysOfWeek, workers } from '../data';

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = 6 + i;
  return `${hour < 10 ? '0' : ''}${hour}:00`;
});

function DayScheduleModal({ appointments, onClose }) {
  const [selectedDaySchedule, setSelectedDaySchedule] = useState('');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#548235' }}>📅 Day Schedule</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Select Day:</label>
          <select value={selectedDaySchedule} onChange={(e) => setSelectedDaySchedule(e.target.value)} style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem'
          }}>
            <option value="">Choose a day...</option>
            {daysOfWeek.filter(day => {
              return appointments.some(appt => appt.day === day);
            }).map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>

        {selectedDaySchedule && (
          <div>
            <h3 style={{ color: '#548235', marginBottom: '1rem' }}>{selectedDaySchedule} Schedule:</h3>
            {timeSlots.map(time => {
              const dayAppointments = appointments.filter(appt => 
                appt.day === selectedDaySchedule && appt.time.split(':')[0] === time.split(':')[0]
              );
              
              if (dayAppointments.length === 0) return null;
              
              return (
                <div key={time} style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#548235', marginBottom: '0.5rem' }}>
                    🕐 {time}
                  </div>
                  {workers.map(worker => {
                    const workerAppt = dayAppointments.find(appt => 
                      appt.worker === worker || appt.secondaryWorker === worker
                    );
                    if (!workerAppt) return null;
                    
                    const isPrimary = workerAppt.worker === worker;
                    return (
                      <div key={worker} style={{
                        padding: '0.5rem',
                        marginBottom: '0.3rem',
                        backgroundColor: isPrimary ? '#d4edda' : '#fff3cd',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        <strong>{worker}</strong>: {workerAppt.villa} {isPrimary ? '(Primary)' : '(Secondary)'}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DayScheduleModal;