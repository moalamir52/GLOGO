import { useState, useEffect, Fragment } from 'react';
import './App.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- SVG Icons ---
const VillaIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z" fill="currentColor"/></svg>;
const TimeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/></svg>;
const WorkerIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>;

// --- Data Constants ---
const initialAppointments = [];
const NO_WORKER_SELECTED = 'none';
const daysOfWeek = ["Saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const workers = ["Raqib", "Rahman"];
const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = 6 + i;
  return `${hour < 10 ? '0' : ''}${hour}:00`;
});

// --- Edit Modal Component ---
function EditModal({ appointment, onSave, onDelete, onClose }) {
  const [modalData, setModalData] = useState(appointment);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
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
            {/* Ensure the currently selected worker is always an option, even if it conflicts */}
            {modalData.worker && <option key={modalData.worker} value={modalData.worker}>{modalData.worker}</option>}
            {filteredPrimaryWorkers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
          </select>
          <label>Secondary Worker:</label>
          <select name="secondaryWorker" value={modalData.secondaryWorker} onChange={handleChange}>
            <option value={NO_WORKER_SELECTED}>None</option>
            {/* Ensure the currently selected secondary worker is always an option, even if it conflicts */}
            {modalData.secondaryWorker && modalData.secondaryWorker !== NO_WORKER_SELECTED && <option key={modalData.secondaryWorker} value={modalData.secondaryWorker}>{modalData.secondaryWorker}</option>}
            {filteredSecondaryWorkers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
          </select>
          <div className="modal-actions">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="delete-btn-modal" onClick={() => onDelete(appointment.id)}>Delete</button>
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Export Schedule</h2>
        <div className="form-field">
          <label htmlFor="export-type-select">Export Type:</label>
          <select id="export-type-select" value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {exportType === 'daily' && (
          <div className="form-field">
            <label htmlFor="export-day-select">Select Day:</label>
            <select id="export-day-select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="export-worker-select">For Worker:</label>
          <select id="export-worker-select" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
            <option value="all">All Workers</option>
            {workers.map(worker => <option key={worker} value={worker}>{worker}</option>)}
          </select>
        </div>

        <div className="modal-actions">
          <button onClick={handleGenerateExport}>Generate Export</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Custom Alert/Confirm Dialog Component ---
function CustomAlertDialog({ isOpen, title, message, options, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content custom-alert-dialog" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          {options.includes('cancel') && <button type="button" onClick={onCancel}>Cancel</button>}
          {options.includes('ok') && <button type="button" onClick={onConfirm}>OK</button>}
          {options.includes('yes') && <button type="button" onClick={onConfirm}>Yes</button>}
          {options.includes('no') && <button type="button" onClick={onCancel}>No</button>}
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---
function App() {
  const [appointments, setAppointments] = useState(() => {
    const savedAppointments = localStorage.getItem('appointments');
    return savedAppointments ? JSON.parse(savedAppointments) : initialAppointments;
  });
  const [formData, setFormData] = useState({ villa: '', day: ['Saturday'], time: '06:00', worker: 'Raqib', secondaryWorker: NO_WORKER_SELECTED });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  const showConfirm = (message, title = 'Confirm', onYes = () => {}, onNo = () => {}) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      options: ['yes', 'no'],
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

  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
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

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModal(false);

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
        // If we just changed the primary worker and it's now the same as the secondary,
        // reset the secondary worker.
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

    const data = filteredAppointments.map(appt => ({
      Villa: appt.villa,
      Day: appt.day,
      Time: appt.time,
      Worker: appt.worker,
    }));

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
      // You can add other state variables here if you want to save them too
      // formData: formData,
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
    reader.onload = (e) => {
      try {
        const loadedSettings = JSON.parse(e.target.result);
        if (loadedSettings.appointments) {
          setAppointments(loadedSettings.appointments);
          showAlert('Schedule loaded successfully!', 'Success');
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
      () => {
        setAppointments([]);
        localStorage.removeItem('appointments');
        showAlert('Schedule has been reset.', 'Success');
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.villa) {
      showAlert('Please enter a villa name.', 'Validation Error');
      return;
    }

    const appointmentsToAdd = [];

    let shouldAbort = false;

    for (const day of formData.day) {
      const isConflict = appointments.some(appt => 
        appt.day === day && 
        appt.time === formData.time && 
        appt.worker === formData.worker
      );

      if (isConflict) {
        const alternativeWorker = workers.find(w => 
          w !== formData.worker && 
          !appointments.some(appt => 
            appt.day === day && 
            appt.time === formData.time && 
            appt.worker === w
          )
        );

        if (alternativeWorker) {
          showConfirm(
            `Worker "${formData.worker}" is busy on ${day} at ${formData.time}. Assign to "${alternativeWorker}" instead?`,
            "Worker Conflict",
            () => { // On Yes
              appointmentsToAdd.push({ 
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${day}-${alternativeWorker}`,
                day,
                time: formData.time,
                worker: alternativeWorker,
                villa: formData.villa
              });
            },
            () => { // On No
              shouldAbort = true;
            }
          );
          if (shouldAbort) break; // Exit the loop if user declines alternative worker
        }
        else {
          showAlert(`No available workers on ${day} at ${formData.time}. Aborting schedule creation.`, 'No Worker Available');
          shouldAbort = true;
          break; // Exit the loop if no alternative worker is found
        }
      } else { // No primary worker conflict
        // Check if the new primary worker is an existing secondary worker for another appointment
        const secondaryConflictAppt = appointments.find(appt =>
          appt.day === day &&
          appt.time === formData.time &&
          appt.secondaryWorker === formData.worker
        );

        if (secondaryConflictAppt) {
          showConfirm(
            `Worker "${formData.worker}" is currently a secondary worker for villa "${secondaryConflictAppt.villa}" on ${day} at ${formData.time}. Do you want to assign them as primary for this new task and remove them from the secondary task?`,
            "Secondary Worker Conflict",
            () => { // On Yes: Remove from secondary, add as primary
              setAppointments(prev => prev.filter(appt => appt.id !== secondaryConflictAppt.id)); // Remove the old secondary appointment
              appointmentsToAdd.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${day}-${formData.worker}`,
                day,
                time: formData.time,
                worker: formData.worker,
                secondaryWorker: formData.secondaryWorker !== NO_WORKER_SELECTED ? formData.secondaryWorker : undefined,
                villa: formData.villa
              });
            },
            () => { // On No: Abort the current new appointment
              shouldAbort = true;
            }
          );
          if (shouldAbort) break; // Exit the loop if user declines
        } else {
          // Check for secondary worker conflicts (original logic)
          let secondaryWorkerConflict = false;
          if (formData.secondaryWorker !== NO_WORKER_SELECTED) {
            if (formData.secondaryWorker === formData.worker) {
              showAlert('Primary and secondary workers cannot be the same. Aborting schedule creation.', 'Conflict');
              shouldAbort = true;
              break;
            } else {
              secondaryWorkerConflict = appointments.some(appt =>
                appt.day === day &&
                appt.time === formData.time &&
                (appt.worker === formData.secondaryWorker || appt.secondaryWorker === formData.secondaryWorker)
              );
              if (secondaryWorkerConflict) {
                showAlert(`Secondary worker "${formData.secondaryWorker}" is busy on ${day} at ${formData.time}. Aborting schedule creation.`, 'Conflict');
                shouldAbort = true;
                break;
              }
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

    if (!shouldAbort && appointmentsToAdd.length > 0) {
      setAppointments(prev => [...prev, ...appointmentsToAdd].sort((a, b) => a.time.localeCompare(b.time)));
      setFormData(prev => ({ ...prev, villa: '' }));
    } else if (shouldAbort) {
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
    const finalUpdatedAppt = {
      ...updatedAppt,
      secondaryWorker: updatedAppt.secondaryWorker === NO_WORKER_SELECTED ? undefined : updatedAppt.secondaryWorker,
    };

    // Check if primary and secondary workers are the same
    if (finalUpdatedAppt.secondaryWorker && finalUpdatedAppt.worker === finalUpdatedAppt.secondaryWorker) {
      showAlert('Primary and secondary workers cannot be the same for an appointment.', 'Conflict');
      return; // Prevent the update
    }

    setAppointments(prev => prev.map(appt => appt.id === finalUpdatedAppt.id ? finalUpdatedAppt : appt).sort((a, b) => a.time.localeCompare(b.time)));
    handleCloseModal();
  };

  const handleDeleteAppointment = (idToDelete) => {
    showConfirm(
      "Are you sure you want to delete this appointment?",
      "Confirm Delete",
      () => { // On Yes
        setAppointments(prev => prev.filter(appt => appt.id !== idToDelete));
        handleCloseModal();
      }
    );
  };

  return (
    <div className="App">
      {isModalOpen && (
        <EditModal 
          appointment={editingAppointment}
          onSave={handleUpdateAppointment}
          onDelete={handleDeleteAppointment}
          onClose={handleCloseModal}
        />
      )}

      <CustomAlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        options={alertDialog.options}
        onConfirm={alertDialog.onConfirm}
        onCancel={alertDialog.onCancel}
      />

      <h1>Weekly Car Wash Schedule</h1>
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
          <button type="submit" className="add-btn">Add Appointment</button>
          <button type="button" className="export-btn" onClick={openExportModal}>Export to Excel</button>
          <button type="button" className="save-btn" onClick={handleSaveSettings}>Save Settings</button>
          <input
            type="file"
            accept=".json"
            onChange={handleLoadSettings}
            style={{ display: 'none' }}
            id="import-settings-file"
          />
          <button type="button" className="import-btn" onClick={() => document.getElementById('import-settings-file').click()}>
            Import Settings
          </button>
          <button type="button" className="reset-btn" onClick={handleResetSchedule}>Reset Schedule</button>
        </form>
      </div>

      <div className="worker-stats">
        <h2>Worker Car Counts</h2>
        {workers.map(worker => (
          <p key={worker}>{worker}: {workerCarCounts[worker] || 0} cars</p>
        ))}
      </div>

      {isExportModalOpen && (
        <ExportModal
          onClose={closeExportModal}
          onExport={handleExport}
        />
      )}

      <div className="schedule-grid">
        <div className="header-cell">Time</div>
        {daysOfWeek.map(day => (
          <div key={day} className="header-cell day-header">
            <span>{day}</span>
            <div className="worker-headers">
              {workers.map(w => <span key={w}>{w}</span>)}
            </div>
          </div>
        ))}

        {timeSlots.map(time => (
          <Fragment key={time}>
            <div className="time-slot-cell">{time}</div>
            {daysOfWeek.map(day => (
              <div key={day} className="grid-cell">
                {workers.map(worker => {
                  const primaryAppointment = appointments.find(
                    appt => appt.day === day && appt.time.split(':')[0] === time.split(':')[0] && appt.worker === worker
                  );
                  const secondaryAppointment = appointments.find(
                    appt => appt.day === day && appt.time.split(':')[0] === time.split(':')[0] && appt.secondaryWorker === worker
                  );

                  return (
                    <div key={worker} className="worker-slot">
                      {primaryAppointment && (
                        <div className={`appointment-card worker-${primaryAppointment.worker.toLowerCase()}`}>
                          <strong>{primaryAppointment.villa}</strong>
                          <button className="edit-btn" onClick={() => handleEditClick(primaryAppointment)}>✏️</button>
                        </div>
                      )}
                      {secondaryAppointment && (
                        <div className={`appointment-card secondary-worker-card worker-${secondaryAppointment.secondaryWorker.toLowerCase()}`}>
                          <strong>{secondaryAppointment.villa}</strong>
                          <button className="edit-btn" onClick={() => handleEditClick(secondaryAppointment)}>✏️</button>
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

export default App;