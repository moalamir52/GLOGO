import { useState, useEffect, Fragment } from 'react';
import '../App.css'; // Adjusted import path
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { saveAppointments, loadAppointments } from '../services/database';
// Define data constants directly
const daysOfWeek = ["Saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const initialWorkers = ["Raqib", "Rahman"];
import WorkerAppointmentsModal from '../components/WorkerAppointmentsModal'; // Import the new modal
import UniqueVillasModal from '../components/UniqueVillasModal'; // Import the new UniqueVillasModal
import { getClientWashType } from '../utils/washTypeCalculator';

// --- SVG Icons ---
const VillaIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z" fill="currentColor"/></svg>;
const TimeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/></svg>;
const WorkerIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>;

// --- Data Constants ---
const initialAppointments = [];
const NO_WORKER_SELECTED = 'none';
const workers = initialWorkers;
const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = 6 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
}).sort((a, b) => {
  const [hourA] = a.split(':').map(Number);
  const [hourB] = b.split(':').map(Number);
  return hourA - hourB;
});

const isValidTime = (time) => {
  return timeSlots.includes(time);
};



// --- Edit Modal Component ---
function EditModal({ appointment, onSave, onDelete, onClose, showAlert }) { // Added showAlert prop
  const [modalData, setModalData] = useState(appointment);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isValidTime(modalData.time)) {
      showAlert(`Time ${modalData.time} is outside the allowed schedule (6:00 to 19:00).`, 'Invalid Time');
      return;
    }
    onSave(modalData);
  };

  // Filtered workers for primary worker dropdown
  const filteredPrimaryWorkers = workers.filter(worker =>
    worker !== modalData.secondaryWorker && modalData.secondaryWorker !== NO_WORKER_SELECTED
  );
  // Filtered workers for secondary worker dropdown
  const filteredSecondaryWorkers = workers.filter(worker =>
    worker !== modalData.worker && modalData.worker !== NO_WORKER_SELECTED
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Edit Appointment</h2>
        <form onSubmit={handleSave} className="modal-form">
          <label>Villa:</label>
          <input type="text" name="villa" value={modalData.villa} onChange={handleChange} required />
          <label>Day:</label>
          <select name="day" value={modalData.day} onChange={handleChange}>
            {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <label>Time:</label>
          <input type="time" name="time" value={modalData.time} onChange={handleChange} />
          <label>Worker:</label>
          <select name="worker" value={modalData.worker} onChange={handleChange}>
            {modalData.worker && <option key={modalData.worker} value={modalData.worker}>{modalData.worker}</option>}
            {filteredPrimaryWorkers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
          </select>
          <label>Secondary Worker:</label>
          <select name="secondaryWorker" value={modalData.secondaryWorker} onChange={handleChange}>
            <option value={NO_WORKER_SELECTED}>None</option>
            {modalData.secondaryWorker && modalData.secondaryWorker !== NO_WORKER_SELECTED && <option key={modalData.secondaryWorker} value={modalData.secondaryWorker}>{modalData.secondaryWorker}</option>}
            {filteredSecondaryWorkers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
          </select>
          <label>Wash Type:</label>
          <select name="washType" value={modalData.washType || 'EXT'} onChange={handleChange}>
            <option value="EXT">🚗 EXT</option>
            <option value="INT">🏠 INT</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(84, 130, 53, 0.3)'
            }}>Save Changes</button>
            <button type="button" onClick={onClose} style={{
              background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
            }}>Cancel</button>
            <button type="button" onClick={() => onDelete(appointment.id)} style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
            }}>Delete</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Export Modal Component ---
function ExportModal({ onClose, onExport }) {
  const [exportType, setExportType] = useState('daily');
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0]);
  const [selectedWorker, setSelectedWorker] = useState('all');

  const handleGenerateExport = () => {
    onExport(exportType, selectedDay, selectedWorker);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  }

  const handleBackdropClick = () => {
    onClose();
  }

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
    }} onClick={handleBackdropClick}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '3rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)',
        minWidth: '500px',
        maxWidth: '600px',
        width: '90%',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header with branding */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 50%, #548235 100%)',
            padding: '1rem 2rem',
            borderRadius: '15px',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: '700',
              margin: '0',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>📊 Export Schedule</h2>
          </div>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            margin: '0'
          }}>Generate Excel report with wash type information</p>
        </div>

        {/* Form Fields */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '1rem'
            }}>📅 Export Type:</label>
            <select value={exportType} onChange={(e) => setExportType(e.target.value)} style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              fontSize: '1rem',
              backgroundColor: '#f9fafb',
              transition: 'all 0.3s ease',
              outline: 'none'
            }}>
              <option value="daily">Daily Schedule</option>
              <option value="weekly">Weekly Schedule</option>
            </select>
          </div>

          {exportType === 'daily' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '1rem'
              }}>🗓️ Select Day:</label>
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                backgroundColor: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}>
                {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '1rem'
            }}>👷 For Worker:</label>
            <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)} style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              fontSize: '1rem',
              backgroundColor: '#f9fafb',
              transition: 'all 0.3s ease',
              outline: 'none'
            }}>
              <option value="all">All Workers</option>
              {workers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button onClick={handleGenerateExport} style={{
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📥 Generate Export
          </button>
          <button onClick={handleCancel} style={{
            background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 20px rgba(108, 117, 125, 0.3)'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Custom Alert/Confirm Dialog Component ---
function CustomAlertDialog({ isOpen, title, message, options, onConfirm, onCancel, needsPassword, userRole }) {
  const [password, setPassword] = useState('');
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (needsPassword && userRole !== 'admin') {
      try {
        const username = localStorage.getItem('glogo_username');
        let userPassword = null;
        
        // Check database for user password
        const { db } = await import('../firebase');
        const { collection, getDocs } = await import('firebase/firestore');
        const querySnapshot = await getDocs(collection(db, 'users'));
        const dbUser = querySnapshot.docs.find(doc => 
          doc.data().username === username.toLowerCase()
        );
        if (dbUser) {
          userPassword = dbUser.data().password;
        }

        if (userPassword === password) {
          onConfirm();
          setPassword('');
        } else {
          setPassword('');
          return;
        }
      } catch (error) {
        setPassword('');
        return;
      }
    } else {
      onConfirm();
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1001 }} onClick={handleCancel}>
      <div className="modal-content custom-alert-dialog" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <p style={{whiteSpace: 'pre-wrap'}}>{message}</p>
        {needsPassword && userRole !== 'admin' && (
          <div style={{ margin: '1rem 0' }}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '1rem',
                outline: 'none'
              }}
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
            />

          </div>
        )}
        <div className="modal-actions">
          {options.includes('cancel') && <button type="button" onClick={handleCancel} style={{
            background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)',
            marginRight: '0.5rem'
          }}>Cancel</button>}
          {options.includes('ok') && <button type="button" onClick={handleConfirm} style={{
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(84, 130, 53, 0.3)',
            marginRight: '0.5rem'
          }}>OK</button>}
          {options.includes('yes') && <button type="button" onClick={handleConfirm} style={{
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(84, 130, 53, 0.3)',
            marginRight: '0.5rem'
          }}>Yes</button>}
          {options.includes('no') && <button type="button" onClick={handleCancel} style={{
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
            marginRight: '0.5rem'
          }}>No</button>}
        </div>
      </div>
    </div>
  );
}

// --- Main SchedulePage Component ---
function SchedulePage({ navigateToClientsWithSearch, initialSearchTerm = '', userRole }) { // Receive the new props
  const [appointments, setAppointments] = useState(initialAppointments);
  const { logActivity } = useActivityLogger();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ villa: '', day: ['Saturday'], time: '06:00', worker: 'Raqib', secondaryWorker: NO_WORKER_SELECTED });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedWorkerForView, setSelectedWorkerForView] = useState(null); // New state for viewing worker appointments
  const [isWorkerAppointmentsModalOpen, setIsWorkerAppointmentsModalOpen] = useState(false); // New state for worker appointments modal
  const [isUniqueVillasModalOpen, setIsUniqueVillasModalOpen] = useState(false); // New state for unique villas modal
  const [draggedAppointment, setDraggedAppointment] = useState(null); // For drag and drop
  


  // State for custom alert/confirm dialog
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    options: [], // e.g., ['ok'], ['yes', 'no']
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showAlert = (message, title = 'Alert', onConfirm = () => {}) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      options: ['ok'],
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setAlertDialog(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (message, title = 'Confirm', onYes = () => {}, onNo = () => {}, needsPassword = false) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      options: ['yes', 'no'],
      needsPassword,
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }));
        onYes();
      },
      onCancel: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }));
        onNo();
      },
    });
  };



  // Load appointments from Firebase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedAppointments = await loadAppointments();
        setAppointments(loadedAppointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
        // Fallback to localStorage if Firebase fails
        const savedAppointments = localStorage.getItem('appointments');
        if (savedAppointments) {
          setAppointments(JSON.parse(savedAppointments));
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Save to both Firebase and localStorage whenever appointments change
  useEffect(() => {
    if (appointments.length > 0 || !isLoading) {
      localStorage.setItem('appointments', JSON.stringify(appointments));
      saveAppointments(appointments).catch(error => {
        console.error('Error saving to Firebase:', error);
      });
    }
  }, [appointments, isLoading]);

  // Auto-sync with Firebase every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const loadedAppointments = await loadAppointments();
        const currentAppointmentsStr = JSON.stringify(appointments.sort((a, b) => a.id.localeCompare(b.id)));
        const loadedAppointmentsStr = JSON.stringify(loadedAppointments.sort((a, b) => a.id.localeCompare(b.id)));
        
        if (currentAppointmentsStr !== loadedAppointmentsStr) {
          setAppointments(loadedAppointments);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [appointments]);

  const getWorkerCarCounts = () => {
    const counts = {};
    workers.forEach(worker => {
      counts[worker] = 0;
    });

    appointments.forEach(appt => {
      if (appt.worker && counts.hasOwnProperty(appt.worker)) {
        counts[appt.worker]++;
      }
      if (appt.secondaryWorker && counts.hasOwnProperty(appt.secondaryWorker)) {
        counts[appt.secondaryWorker]++;
      }
    });
    return counts;
  };

  const workerCarCounts = getWorkerCarCounts();
  const uniqueVillaCount = new Set(appointments.map(a => a.villa)).size;
  const uniqueVillas = Array.from(new Set(appointments.map(a => a.villa))).sort(); // Define uniqueVillas here
  

  


  const openExportModal = () => {
    setIsModalOpen(false);
    setAlertDialog(prev => ({ ...prev, isOpen: false }));
    setIsExportModalOpen(true);
  };
  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  const openWorkerAppointmentsModal = (workerName) => {
    setSelectedWorkerForView(workerName);
    setIsWorkerAppointmentsModalOpen(true);
  };

  const closeWorkerAppointmentsModal = () => {
    setSelectedWorkerForView(null);
    setIsWorkerAppointmentsModalOpen(false);
  };

  const openUniqueVillasModal = () => {
    setIsUniqueVillasModalOpen(true);
  };

  const closeUniqueVillasModal = () => {
    setIsUniqueVillasModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'day') {
      if (type === 'checkbox') {
        setFormData(prev => ({
          ...prev,
          day: checked
            ? [...prev.day, value]
            : prev.day.filter(day => day !== value)
        }));
      } else { // Fallback for select multiple, if it's still used somewhere or for future proofing
        const selectedDays = Array.from(e.target.options).filter(option => option.selected).map(option => option.value);
        setFormData(prev => ({ ...prev, day: selectedDays }));
      }
    } else {
      setFormData(prev => {
        const newFormData = { ...prev, [name]: value };
        if (name === 'worker' && newFormData.worker === newFormData.secondaryWorker) {
          newFormData.secondaryWorker = NO_WORKER_SELECTED;
        }
        return newFormData;
      });
    }
  };

  const handleExport = (exportType, selectedDay, selectedWorker) => {
    let filteredAppointments = appointments;

    if (selectedWorker !== 'all') {
      filteredAppointments = filteredAppointments.filter(appt => appt.worker === selectedWorker);
    }

    if (exportType === 'daily') {
      filteredAppointments = filteredAppointments.filter(appt => appt.day === selectedDay);
    }

    const formatTime = (time) => {
      if (!time) return '';
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = hourNum % 12 || 12;
      return `${formattedHour}:${minute} ${ampm}`;
    };

    // ترتيب المواعيد حسب التوقيت قبل التصدير
    const sortedAppointments = filteredAppointments.sort((a, b) => {
      const [hourA] = a.time.split(':').map(Number);
      const [hourB] = b.time.split(':').map(Number);
      return hourA - hourB;
    });
    
    const data = sortedAppointments.map(appt => {
      // استخدام التعديل اليدوي إذا كان موجود، وإلا استخدام الحساب التلقائي
      let washType;
      if (appt.manualWashType) {
        washType = appt.manualWashType === 'EXT' ? '🚗 EXT' : '🧽 INT';
      } else {
        washType = getClientWashType(appt.villa, appt.day) || 'N/A';
      }
      
      return {
        Villa: appt.villa,
        Day: appt.day,
        Time: formatTime(appt.time),
        Worker: appt.worker,
        'Wash Type': washType
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Schedule_Export_${exportType}_${selectedWorker}${exportType === 'daily' ? `_${selectedDay}` : ''}.xlsx`);
  };

  const handleSaveSettings = () => {
    const settings = {
      appointments: appointments,
    };
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, 'schedule_settings.json');
  };

  const handleLoadSettings = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const loadedSettings = JSON.parse(e.target.result);
        if (loadedSettings.appointments) {
          setAppointments(loadedSettings.appointments);
          await saveAppointments(loadedSettings.appointments);
        } else {
          showAlert('Invalid settings file: missing appointments data.', 'Error');
        }
      } catch (error) {
        showAlert('Error parsing settings file: ' + error.message, 'Error');
      }
    };
    reader.readAsText(file);
  };


  const handleResetSchedule = () => {
    showConfirm(
      "Are you sure you want to clear the entire schedule? This action cannot be undone.",
      "Confirm Reset",
      async () => {
        setAppointments([]);
        localStorage.removeItem('appointments');
        await saveAppointments([]);
        logActivity('Reset Schedule', 'Cleared entire schedule');
      },
      () => {},
      true
    );
  };

  const handleClearLocalStorage = () => {
    showConfirm(
      "Are you sure you want to clear all saved data from your browser? This will reset the schedule completely.",
      "Confirm Clear Data",
      async () => {
        localStorage.removeItem('appointments');
        setAppointments(initialAppointments);
        await saveAppointments([]);
        logActivity('Clear Storage', 'Cleared all saved data');
      },
      () => {},
      true
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.villa) {
      showAlert('Please enter a villa name.', 'Validation Error');
      return;
    }

    if (!isValidTime(formData.time)) {
      showAlert(`Time ${formData.time} is outside the allowed schedule (6:00 to 19:00).`, 'Invalid Time');
      return;
    }

    // Check if user needs password for adding appointments
    if (userRole !== 'admin') {
      showConfirm(
        `Are you sure you want to add appointment for ${formData.villa}?`,
        "Confirm Add Appointment",
        () => processSubmit(),
        () => {},
        true
      );
      return;
    }

    processSubmit();
  };

  const processSubmit = async () => {

    const showConfirmPromise = (message, title = 'Confirm') => {
      return new Promise((resolve) => {
        setAlertDialog({
          isOpen: true,
          title,
          message,
          options: ['yes', 'no'],
          onConfirm: () => {
            setAlertDialog(prev => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setAlertDialog(prev => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        });
      });
    };

    const appointmentsToAdd = [];
    const appointmentsToRemove = [];
    let abortAll = false;

    for (const day of formData.day) {
      if (abortAll) break;

      const isConflict = appointments.some(appt =>
        !appointmentsToRemove.includes(appt.id) &&
        appt.day === day &&
        appt.time === formData.time &&
        appt.worker === formData.worker
      );

      if (isConflict) {
        const alternativeWorker = workers.find(w =>
          w !== formData.worker &&
          !appointments.some(appt =>
            !appointmentsToRemove.includes(appt.id) &&
            appt.day === day &&
            appt.time === formData.time &&
            appt.worker === w
          )
        );

        if (alternativeWorker) {
          const userAgreed = await showConfirmPromise(
            `Worker "${formData.worker}" is busy on ${day} at ${formData.time}. Assign to "${alternativeWorker}" instead?`,
            "Worker Conflict"
          );

          if (userAgreed) {
            appointmentsToAdd.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${day}-${alternativeWorker}`,
              day,
              time: formData.time,
              worker: alternativeWorker,
              villa: formData.villa
            });
          } else {
            abortAll = true;
          }
        } else {
          showAlert(`No available workers on ${day} at ${formData.time}. Aborting schedule creation.`, 'No Worker Available');
          abortAll = true;
        }
      } else {
        const secondaryConflictAppt = appointments.find(appt =>
          !appointmentsToRemove.includes(appt.id) &&
          appt.day === day &&
          appt.time === formData.time &&
          appt.secondaryWorker === formData.worker
        );

        if (secondaryConflictAppt) {
          const userAgreed = await showConfirmPromise(
            `Worker "${formData.worker}" is currently a secondary worker for villa "${secondaryConflictAppt.villa}" on ${day} at ${formData.time}. Do you want to assign them as primary for this new task and remove them from the secondary task?`,
            "Secondary Worker Conflict"
          );

          if (userAgreed) {
            appointmentsToRemove.push(secondaryConflictAppt.id);
            appointmentsToAdd.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${day}-${formData.worker}`,
              day,
              time: formData.time,
              worker: formData.worker,
              secondaryWorker: formData.secondaryWorker !== NO_WORKER_SELECTED ? formData.secondaryWorker : undefined,
              villa: formData.villa
            });
          } else {
            abortAll = true;
          }
        } else {
          let secondaryWorkerConflict = false;
          if (formData.secondaryWorker !== NO_WORKER_SELECTED) {
            if (formData.secondaryWorker === formData.worker) {
              showAlert('Primary and secondary workers cannot be the same. Aborting schedule creation.', 'Conflict');
              abortAll = true;
              break;
            }
            secondaryWorkerConflict = appointments.some(appt =>
              !appointmentsToRemove.includes(appt.id) &&
              appt.day === day &&
              appt.time === formData.time &&
              (appt.worker === formData.secondaryWorker || appt.secondaryWorker === formData.secondaryWorker)
            );
            if (secondaryWorkerConflict) {
              showAlert(`Secondary worker "${formData.secondaryWorker}" is busy on ${day} at ${formData.time}. Aborting schedule creation.`, 'Conflict');
              abortAll = true;
              break;
            }
          }

          if (!secondaryWorkerConflict) {
            appointmentsToAdd.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${day}-${formData.worker}`,
              day,
              time: formData.time,
              worker: formData.worker,
              secondaryWorker: formData.secondaryWorker !== NO_WORKER_SELECTED ? formData.secondaryWorker : undefined,
              villa: formData.villa
            });
          }
        }
      }
    }

    if (!abortAll && (appointmentsToAdd.length > 0 || appointmentsToRemove.length > 0)) {
      setAppointments(prev => {
        const afterRemoval = prev.filter(appt => !appointmentsToRemove.includes(appt.id));
        const afterAddition = [...afterRemoval, ...appointmentsToAdd];
        return afterAddition.sort((a, b) => {
          const [hourA] = a.time.split(':').map(Number);
          const [hourB] = b.time.split(':').map(Number);
          return hourA - hourB;
        });
      });
      
      // Log activity
      appointmentsToAdd.forEach(appt => {
        logActivity('Add Appointment', `Added ${appt.villa} on ${appt.day} at ${appt.time} for ${appt.worker}`);
      });
      
      setFormData(prev => ({ ...prev, villa: '' }));
    } else if (abortAll) {
      showAlert('Schedule creation aborted due to conflicts or user cancellation.', 'Aborted');
    }
  };

  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleUpdateAppointment = (updatedAppt) => {
    if (userRole !== 'admin') {
      showConfirm(
        `Are you sure you want to edit appointment for ${updatedAppt.villa}?`,
        "Confirm Edit Appointment",
        () => processUpdateAppointment(updatedAppt),
        () => {},
        true
      );
      return;
    }
    processUpdateAppointment(updatedAppt);
  };

  const processUpdateAppointment = (updatedAppt) => {
    const finalUpdatedAppt = {
      ...updatedAppt,
      secondaryWorker: updatedAppt.secondaryWorker === NO_WORKER_SELECTED ? undefined : updatedAppt.secondaryWorker,
      // حفظ نوع الغسيل المحدد يدوياً
      manualWashType: updatedAppt.washType
    };

    if (finalUpdatedAppt.secondaryWorker && finalUpdatedAppt.worker === finalUpdatedAppt.secondaryWorker) {
      showAlert('Primary and secondary workers cannot be the same for an appointment.', 'Conflict');
      return; // Prevent the update
    }

    setAppointments(prev => prev.map(appt => appt.id === finalUpdatedAppt.id ? finalUpdatedAppt : appt).sort((a, b) => {
      const [hourA] = a.time.split(':').map(Number);
      const [hourB] = b.time.split(':').map(Number);
      return hourA - hourB;
    }));
    
    // Log activity
    logActivity('Edit Appointment', `Modified ${finalUpdatedAppt.villa} - ${finalUpdatedAppt.day} at ${finalUpdatedAppt.time}`);
    
    handleCloseModal();
  };

  const handleDeleteAppointment = (idToDelete) => {
    const apptToDelete = appointments.find(a => a.id === idToDelete);
    
    if (userRole !== 'admin') {
      showConfirm(
        `Are you sure you want to delete appointment for ${apptToDelete?.villa}?`,
        "Confirm Delete Appointment",
        () => processDeleteAppointment(idToDelete),
        () => {},
        true
      );
      return;
    }
    
    showConfirm(
      "Are you sure you want to delete this appointment?",
      "Confirm Delete",
      () => processDeleteAppointment(idToDelete)
    );
  };

  const processDeleteAppointment = (idToDelete) => {
    const apptToDelete = appointments.find(a => a.id === idToDelete);
    setAppointments(prev => prev.filter(appt => appt.id !== idToDelete));
    
    // Log activity
    if (apptToDelete) {
      logActivity('Delete Appointment', `Deleted ${apptToDelete.villa} - ${apptToDelete.day} at ${apptToDelete.time}`);
    }
    
    handleCloseModal();
  };

  const handleVillaClick = (villaName) => {
    // Clear current search before navigating
    setSearchTerm('');
    // Navigate to Clients page with search term
    navigateToClientsWithSearch(villaName);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWorker, targetDay, targetTime) => {
    e.preventDefault();
    
    if (!draggedAppointment || draggedAppointment.worker === targetWorker) {
      setDraggedAppointment(null);
      return;
    }
    // Check if target slot is occupied
    const targetSlotOccupied = appointments.find(appt => 
      appt.day === targetDay && 
      appt.time === targetTime && 
      appt.worker === targetWorker
    );

    if (targetSlotOccupied) {
      // Allow swapping if both appointments are at the same time
      if (draggedAppointment.day === targetDay && draggedAppointment.time === targetTime) {
        // Swap the workers
        // Check if user needs password for swapping appointments
        if (userRole !== 'admin') {
          showConfirm(
            `Are you sure you want to swap ${draggedAppointment.villa} with ${targetSlotOccupied.villa}?`,
            "Confirm Swap Appointments",
            () => {
              setAppointments(prev => prev.map(appt => {
                if (appt.id === draggedAppointment.id) {
                  return { ...appt, worker: targetWorker };
                }
                if (appt.id === targetSlotOccupied.id) {
                  return { ...appt, worker: draggedAppointment.worker };
                }
                return appt;
              }));
              
              // Log activity
              logActivity('Swap Appointments', `Swapped ${draggedAppointment.villa} and ${targetSlotOccupied.villa} workers`);
            },
            () => {},
            true
          );
        } else {
          setAppointments(prev => prev.map(appt => {
            if (appt.id === draggedAppointment.id) {
              return { ...appt, worker: targetWorker };
            }
            if (appt.id === targetSlotOccupied.id) {
              return { ...appt, worker: draggedAppointment.worker };
            }
            return appt;
          }));
          
          // Log activity
          logActivity('Swap Appointments', `Swapped ${draggedAppointment.villa} and ${targetSlotOccupied.villa} workers`);
        }
        
        setDraggedAppointment(null);
        return;
      } else {
        showAlert(`${targetWorker} is already busy at ${targetTime} on ${targetDay}`, 'Slot Occupied');
        setDraggedAppointment(null);
        return;
      }
    }

    // Check if user needs password for moving appointments
    if (userRole !== 'admin') {
      showConfirm(
        `Are you sure you want to move ${draggedAppointment.villa} to ${targetWorker}?`,
        "Confirm Move Appointment",
        () => {
          // Update the appointment with new worker
          setAppointments(prev => prev.map(appt => 
            appt.id === draggedAppointment.id 
              ? { ...appt, worker: targetWorker, day: targetDay, time: targetTime }
              : appt
          ));
          
          // Log activity
          logActivity('Move Appointment', `Moved ${draggedAppointment.villa} to ${targetWorker} on ${targetDay} at ${targetTime}`);
        },
        () => {},
        true
      );
    } else {
      // Update the appointment with new worker
      setAppointments(prev => prev.map(appt => 
        appt.id === draggedAppointment.id 
          ? { ...appt, worker: targetWorker, day: targetDay, time: targetTime }
          : appt
      ));
      
      // Log activity
      logActivity('Move Appointment', `Moved ${draggedAppointment.villa} to ${targetWorker} on ${targetDay} at ${targetTime}`);
    }

    setDraggedAppointment(null);
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
  };

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: '#DAF2D0', 
        borderRadius: '20px', 
        padding: '2rem', 
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#548235' }}>🔄 Loading schedule...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#DAF2D0', borderRadius: '20px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
      {isModalOpen && (
        <EditModal 
          appointment={editingAppointment}
          onSave={handleUpdateAppointment}
          onDelete={handleDeleteAppointment}
          onClose={handleCloseModal}
          showAlert={showAlert}
        />
      )}

      <CustomAlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        options={alertDialog.options}
        onConfirm={alertDialog.onConfirm}
        onCancel={alertDialog.onCancel}
        needsPassword={alertDialog.needsPassword}
        userRole={userRole}
      />



      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 50%, #548235 100%)',
          padding: '1.5rem 3rem',
          borderRadius: '25px',
          boxShadow: '0 8px 32px rgba(84, 130, 53, 0.3)',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)',
            backgroundSize: '20px 20px'
          }}></div>
          <h1 style={{
            color: 'white',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: '700',
            margin: '0',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '1px',
            position: 'relative',
            zIndex: 1
          }}>GLOGO car wash Schedule</h1>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '20px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.8rem',
            fontWeight: '400'
          }}>
            Developed by Mihamed Alamir
          </div>
        </div>
      </div>
      {/* Worker Car Counts and Client Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#DAF2D0',
          borderRadius: '15px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{
            color: '#548235',
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>👷 Worker Car Counts</h3>
          {workers.map(worker => (
            <div key={worker} 
              onClick={() => openWorkerAppointmentsModal(worker)} 
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                margin: '8px 0',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontWeight: '600', color: '#374151' }}>{worker}</span>
              <span style={{
                backgroundColor: '#548235',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>{workerCarCounts[worker] || 0} cars</span>
            </div>
          ))}
        </div>
        
        <div style={{
          backgroundColor: '#DAF2D0',
          borderRadius: '15px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{
            color: '#548235',
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>🏠 Client Stats</h3>
          <div 
            onClick={openUniqueVillasModal}
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontWeight: '600', color: '#374151' }}>Total Unique Villas</span>
            <span style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>{uniqueVillaCount}</span>
          </div>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="villa-input"><VillaIcon /> Villa:</label>
            <input id="villa-input" type="text" name="villa" placeholder="Villa Name" value={formData.villa} onChange={handleInputChange} required />
          </div>
          <div className="form-field">
            <label><CalendarIcon /> Day:</label>
            <div className="day-checkboxes">
              {daysOfWeek.map(day => (
                <label key={day}>
                  <input
                    type="checkbox"
                    name="day"
                    value={day}
                    checked={formData.day.includes(day)}
                    onChange={handleInputChange}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="time-input"><TimeIcon /> Time:</label>
            <input id="time-input" type="time" name="time" value={formData.time} onChange={handleInputChange} />
          </div>
          <div className="form-field">
            <label htmlFor="worker-select"><WorkerIcon /> Worker:</label>
            <select id="worker-select" name="worker" value={formData.worker} onChange={handleInputChange}>
              {workers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="secondary-worker-select"><WorkerIcon /> Secondary Worker:</label>
            <select id="secondary-worker-select" name="secondaryWorker" value={formData.secondaryWorker} onChange={handleInputChange}>
              <option value={NO_WORKER_SELECTED}>None</option>
              {workers
                .filter(w => w !== formData.worker)
                .map(worker => <option key={worker} value={worker}>{worker}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="search-input">🔍 Search:</label>
            <div style={{ position: 'relative' }}>
              <input 
                id="search-input" 
                type="text" 
                name="search" 
                placeholder="Search Villa, Worker, Day..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingRight: searchTerm ? '40px' : '0.8rem' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: '0',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e9ecef';
                    e.target.style.color = '#495057';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6c757d';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <button type="submit" style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>➕ Add Appointment</button>
          <button type="button" onClick={openExportModal} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>📊 Export to Excel</button>
          <button type="button" onClick={handleSaveSettings} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>💾 Save Settings</button>
          <input
            type="file"
            accept=".json"
            onChange={handleLoadSettings}
            style={{ display: 'none' }}
            id="import-settings-file"
          />
          <button type="button" onClick={() => document.getElementById('import-settings-file').click()} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>📁 Import Settings</button>
          <button type="button" onClick={handleResetSchedule} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(108, 117, 125, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>🔄 Reset Schedule</button>
          <button type="button" onClick={handleClearLocalStorage} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(220, 53, 69, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>🗑️ Clear Storage</button>
          <button type="button" onClick={() => {
            const savedAppointments = localStorage.getItem('appointments');
            if (savedAppointments) {
              const parsedAppointments = JSON.parse(savedAppointments);
              const updatedAppointments = parsedAppointments.map(appt => ({
                ...appt,
                washType: undefined
              }));
              localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
              setAppointments(updatedAppointments);
              window.location.reload();
            }
          }} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(23, 162, 184, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>🔄 Recalculate Wash Types</button>
          <button type="button" onClick={async () => {
            setIsLoading(true);
            try {
              const loadedAppointments = await loadAppointments();
              setAppointments(loadedAppointments);
              showAlert('Schedule updated successfully!', 'Update');
            } catch (error) {
              showAlert('Error loading data from server', 'Error');
            } finally {
              setIsLoading(false);
            }
          }} style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(40, 167, 69, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '0.5rem',
            marginBottom: '0.5rem'
          }}>🔄 Sync from Server</button>
        </form>
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(40, 167, 69, 0.3)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0',
            color: '#155724',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>💡 Schedule syncs automatically every 30 seconds. If updates don't appear, click "Sync from Server"</p>
        </div>
      </div>

      {isExportModalOpen && (
        <ExportModal
          onClose={closeExportModal}
          onExport={handleExport}
        />
      )}

      {isWorkerAppointmentsModalOpen && (
        <WorkerAppointmentsModal
          workerName={selectedWorkerForView}
          appointments={appointments}
          onClose={closeWorkerAppointmentsModal}
          onEditAppointment={handleEditClick}
          onDeleteAppointment={handleDeleteAppointment}
          showAlert={showAlert}
        />
      )}

      {isUniqueVillasModalOpen && (
        <UniqueVillasModal
          uniqueVillas={uniqueVillas}
          onClose={closeUniqueVillasModal}
          navigateToClientsWithSearch={navigateToClientsWithSearch}
        />
      )}

      <div className="schedule-grid" style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="header-cell" style={{ minWidth: '80px' }}>Time</div>
        {daysOfWeek.map(day => (
          <div key={day} className="header-cell day-header" style={{ minWidth: '200px' }}>
            <span>{day}</span>
            <div className="worker-headers">
              {workers.map(w => <span key={w} style={{ fontSize: '0.8rem' }}>{w}</span>)}
            </div>
          </div>
        ))}

        {timeSlots.map(time => (
          <Fragment key={time}>
            <div className="time-slot-cell" style={{ minWidth: '80px' }}>{time}</div>
            {daysOfWeek.map(day => (
              <div key={day} className="grid-cell" style={{ minWidth: '200px' }}>
                {workers.map(worker => {
                  const primaryAppointment = appointments.find(
                    appt => appt.day === day && appt.time === time && appt.worker === worker
                  );
                  const secondaryAppointment = appointments.find(
                    appt => appt.day === day && appt.time === time && appt.secondaryWorker === worker
                  );

                  const term = searchTerm.toLowerCase();
                  
                  let primaryMatches = false;
                  if (searchTerm) { // Only check for matches if searchTerm is not empty
                      primaryMatches = primaryAppointment && (
                          primaryAppointment.villa.toLowerCase().includes(term) ||
                          primaryAppointment.worker.toLowerCase().includes(term) ||
                          primaryAppointment.day.toLowerCase().includes(term)
                      );
                  }

                  let secondaryMatches = false;
                  if (searchTerm) { // Only check for matches if searchTerm is not empty
                      secondaryMatches = secondaryAppointment && (
                          secondaryAppointment.villa.toLowerCase().includes(term) ||
                          (secondaryAppointment.worker && secondaryAppointment.worker.toLowerCase().includes(term)) ||
                          (secondaryAppointment.secondaryWorker && secondaryAppointment.secondaryWorker.toLowerCase().includes(term)) ||
                          secondaryAppointment.day.toLowerCase().includes(term)
                      );
                  }

                  const shouldRenderPrimary = !searchTerm || primaryMatches;
                  const shouldRenderSecondary = !searchTerm || secondaryMatches;

                  return (
                    <div 
                      key={worker} 
                      className="worker-slot"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, worker, day, time)}
                      style={{
                        minHeight: '40px',
                        border: draggedAppointment && draggedAppointment.worker !== worker ? '1px dashed #548235' : 'none',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease',
                        padding: '2px'
                      }}
                    >
                      {primaryAppointment && shouldRenderPrimary && (
                        <div 
                          className={`appointment-card worker-${primaryAppointment.worker.toLowerCase()} ${primaryMatches ? 'highlight' : ''}`}
                          onClick={() => handleVillaClick(primaryAppointment.villa)}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, primaryAppointment)}
                          onDragEnd={handleDragEnd}
                          style={{
                            cursor: 'grab',
                            opacity: draggedAppointment && draggedAppointment.id === primaryAppointment.id ? 0.5 : 1
                          }}
                        >
                          <strong>{primaryAppointment.villa}</strong>
                          <div style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            marginTop: '2px',
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            {primaryAppointment.manualWashType ? 
                              (primaryAppointment.manualWashType === 'EXT' ? '🚗 EXT' : '🧽 INT') : 
                              (getClientWashType(primaryAppointment.villa, primaryAppointment.day) || '🚗 EXT')
                            }
                          </div>
                          <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick(primaryAppointment); }}>✏️</button>
                        </div>
                      )}
                      {secondaryAppointment && shouldRenderSecondary && (
                        <div 
                          className={`appointment-card secondary-worker-card worker-${secondaryAppointment.secondaryWorker.toLowerCase()} ${secondaryMatches ? 'highlight' : ''}`}
                          onClick={() => handleVillaClick(secondaryAppointment.villa)}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, secondaryAppointment)}
                          onDragEnd={handleDragEnd}
                          style={{
                            cursor: 'grab',
                            opacity: draggedAppointment && draggedAppointment.id === secondaryAppointment.id ? 0.5 : 1
                          }}
                        >
                          <strong>{secondaryAppointment.villa}</strong>
                          <div style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            marginTop: '2px',
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            {secondaryAppointment.manualWashType ? 
                              (secondaryAppointment.manualWashType === 'EXT' ? '🚗 EXT' : '🧽 INT') : 
                              (getClientWashType(secondaryAppointment.villa, secondaryAppointment.day) || '🚗 EXT')
                            }
                          </div>
                          <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick(secondaryAppointment); }}>✏️</button>
                        </div>
                      )}
                      {!primaryAppointment && !secondaryAppointment && draggedAppointment && (
                        <div style={{
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#548235',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          opacity: 0.7
                        }}>
                          Drop here
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default SchedulePage; // Renamed export
