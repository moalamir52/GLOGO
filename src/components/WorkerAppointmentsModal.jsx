import React from 'react';
import { daysOfWeek } from '../data';

function WorkerAppointmentsModal({ workerName, appointments, onClose, onEditAppointment, onDeleteAppointment, showAlert }) {
  const formatTime = (time) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const calculateWeeksSinceStart = (startDateStr) => {
    if (!startDateStr) return 0;
    
    let startDate;
    if (startDateStr.includes('-')) {
      const [day, month, year] = startDateStr.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      startDate = new Date(parseInt(year), monthMap[month], parseInt(day));
    } else {
      startDate = new Date(startDateStr);
    }
    
    const today = new Date();
    const diffTime = today - startDate;
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diffWeeks);
  };

  const getWashTypeForWeek = (washPackage, weekNumber, clientDays) => {
    if (!washPackage || !clientDays) return '';
    
    const packageStr = washPackage.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const numbers = packageStr.match(/\d+/g) || [];
    const hasExt = /ext/i.test(packageStr);
    const hasInt = /int/i.test(packageStr);
    const isBiWeekly = /bi/i.test(packageStr);
    
    let extCount = 0;
    let intCount = 0;
    
    if (numbers.length >= 2 && hasExt && hasInt) {
      extCount = parseInt(numbers[0]);
      intCount = parseInt(numbers[1]);
    } else if (numbers.length >= 1 && hasExt && !hasInt) {
      extCount = parseInt(numbers[0]);
      intCount = 0;
    } else if (numbers.length >= 1 && hasInt && !hasExt) {
      extCount = 0;
      intCount = parseInt(numbers[0]);
    } else {
      return '';
    }
    
    const totalRatio = extCount + intCount;
    if (totalRatio === 0) return '';
    
    let daysPerWeek = 0;
    if (clientDays.toLowerCase() === 'daily') {
      daysPerWeek = 7;
    } else if (clientDays.toLowerCase() === 'weekends') {
      daysPerWeek = 2;
    } else {
      const dayParts = clientDays.split('-').filter(d => d.trim());
      daysPerWeek = dayParts.length;
    }
    
    if (daysPerWeek === 0) return '';
    
    const adjustedWeek = isBiWeekly ? Math.floor(weekNumber / 2) : weekNumber;
    
    if (daysPerWeek >= totalRatio) {
      const washIndex = adjustedWeek % daysPerWeek;
      const extDays = Math.round((extCount / totalRatio) * daysPerWeek);
      return washIndex < extDays ? '🚗 EXT' : '🧽 INT';
    } else {
      const positionInCycle = adjustedWeek % totalRatio;
      return positionInCycle < extCount ? '🚗 EXT' : '🧽 INT';
    }
  };

  const getClientWashType = (villaName) => {
    const clientsData = JSON.parse(localStorage.getItem('clientsData') || '[]');
    const client = clientsData.find(c => 
      c.villa && villaName && 
      c.villa.replace(/\s+/g, ' ').trim().toLowerCase() === villaName.replace(/\s+/g, ' ').trim().toLowerCase()
    );
    
    if (!client || !client.startDate || !client.days) {
      return '';
    }
    
    let washPackage = client.washmanPackage;
    if (!washPackage && client.worker) {
      const workerText = client.worker.toLowerCase();
      if (workerText.includes('ext') || workerText.includes('int')) {
        washPackage = client.worker;
      }
    }
    
    if (!washPackage) {
      return '';
    }
    
    const weeksSinceStart = calculateWeeksSinceStart(client.startDate);
    return getWashTypeForWeek(washPackage, weeksSinceStart, client.days);
  };

  const workerAppointments = appointments
    .filter(appt => appt.worker === workerName || appt.secondaryWorker === workerName)
    .sort((a, b) => {
      const dayIndexA = daysOfWeek.indexOf(a.day);
      const dayIndexB = daysOfWeek.indexOf(b.day);
      if (dayIndexA !== dayIndexB) {
        return dayIndexA - dayIndexB;
      }
      return a.time.localeCompare(b.time);
    });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '2px solid #548235',
        minWidth: '600px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #548235'
        }}>
          <h2 style={{
            color: '#548235',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>👷 Appointments for {workerName}</h2>
          <p style={{
            color: '#6c757d',
            fontSize: '0.9rem',
            margin: '0.5rem 0 0 0'
          }}>Total: {workerAppointments.length} appointments</p>
        </div>

        {workerAppointments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6c757d'
          }}>
            <p style={{ fontSize: '1.2rem', margin: '0' }}>📅 No appointments found for {workerName}</p>
          </div>
        ) : (
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            paddingRight: '10px',
            marginBottom: '1rem'
          }}>
            {workerAppointments.map(appt => {
              const washType = getClientWashType(appt.villa);
              return (
                <div key={appt.id} style={{
                  background: 'linear-gradient(135deg, #DAF2D0 0%, #c8e6c9 100%)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  {/* Villa Name with Wash Type */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      color: '#548235',
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏠 {appt.villa}
                    </h3>
                    {washType && (
                      <span style={{
                        backgroundColor: washType.includes('EXT') ? '#007bff' : '#28a745',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {washType}
                      </span>
                    )}
                  </div>
                  
                  {/* Appointment Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>📅</span>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: '500' }}>Day</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>{appt.day}</div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>⏰</span>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: '500' }}>Time</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>{formatTime(appt.time)}</div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>👤</span>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: '500' }}>Role</div>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: appt.worker === workerName ? '#548235' : '#6f42c1'
                        }}>
                          {appt.worker === workerName ? 'Primary' : 'Secondary'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button onClick={() => onEditAppointment(appt)} style={{
                      backgroundColor: '#548235',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>✏️ Edit</button>
                    <button onClick={() => onDeleteAppointment(appt.id)} style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>🗑️ Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Footer */}
        <div style={{
          paddingTop: '1rem',
          borderTop: '2px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <button onClick={onClose} style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default WorkerAppointmentsModal;
