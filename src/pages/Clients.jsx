import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clients as defaultClients } from '../data';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getClientWashType, getClientWashTypeForDay, getWashTypeForClient, calculateWeeksSinceStart, getClientWashPattern } from '../utils/washTypeCalculator';
import InvoiceGenerator from '../components/InvoiceGenerator';

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  backgroundColor: 'white',
  border: '2px solid #548235'
};

const thStyles = {
  backgroundColor: '#548235',
  color: 'white',
  padding: '16px 20px',
  textAlign: 'center',
  fontWeight: '600',
  fontSize: '0.95rem',
  letterSpacing: '0.5px',
  border: '1px solid #3d6b28',
  borderBottom: '2px solid #3d6b28'
};

const tdStyles = {
  padding: '12px 20px',
  border: '1px solid #e5e7eb',
  fontSize: '0.9rem',
  textAlign: 'center'
};

const trStyles = {
  transition: 'all 0.2s ease',
  cursor: 'pointer'
};

const evenTrStyles = {
  backgroundColor: '#DAF2D0'
};

const searchInputStyles = {
  fontSize: '1rem',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid #ced4da',
  width: '100%',
  maxWidth: '400px',
  marginBottom: '2rem',
  display: 'block',
  transition: 'all 0.3s ease',
  backgroundColor: '#DAF2D0',
  outline: 'none'
};

const buttonBaseStyles = {
  padding: '12px 24px',
  borderRadius: '8px',
  cursor: 'pointer',
  border: 'none',
  fontSize: '0.95rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none'
};

const containerStyles = {
  padding: '0',
  backgroundColor: '#DAF2D0'
};

const cardStyles = {
  backgroundColor: '#DAF2D0',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.07)',
  border: '1px solid #e9ecef'
};

const excelDateToFormattedDate = (excelDate) => {
  if (typeof excelDate === 'number') {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
  }
  return String(excelDate || '');
};



const isValidDays = (daysString) => {
  if (typeof daysString !== 'string' || !daysString.trim()) {
    return false;
  }

  const allowedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const allowedKeywords = ['Daily', 'Weekends'];

  const normalizedDaysString = daysString.trim();

  if (allowedKeywords.includes(normalizedDaysString)) {
    return true;
  }

  const parts = normalizedDaysString.split('-').map(day => day.trim());
  for (const part of parts) {
    if (!allowedDays.includes(part)) {
      return false;
    }
  }
  return true;
};

const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/1sG0itNKcxg10mOzbuiY_i-IsPBQ3fmXwXDvqCbT3kFU/export?format=csv&gid=0';

function ClientsPage({ initialSearchTerm = '', navigateToScheduleWithSearch, navigateToReport }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const searchInputRef = useRef(null);
  const [clientsData, setClientsData] = useState(defaultClients);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState(null);

  // Load clients data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('clientsData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.length > 0) {
          setClientsData(parsedData);
        }
      } catch (error) {
        console.error('Error loading clients data:', error);
      }
    }
    setIsDataLoading(false);
  }, []);

  // Save clients data to localStorage whenever clientsData changes
  useEffect(() => {
    if (!isDataLoading) {
      localStorage.setItem('clientsData', JSON.stringify(clientsData));
    }
  }, [clientsData, isDataLoading]);

  useEffect(() => {
    if (initialSearchTerm && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [initialSearchTerm]);

  // Auto-fetch Google Sheets data on page load
  useEffect(() => {
    fetchGoogleSheetData();
  }, []);

  const handleImportClients = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const importedClients = json.map(row => ({
        id: row.id || Math.random().toString(36).substr(2, 9),
        name: String(row.Name || ''),
        villa: String(row.Villa || ''),
        phone: String(row.Phone || ''),
        numCars: String(row['Number of car'] || ''),
        carType: String(row['Type of Car'] || ''),
        days: String(row.Days || ''),
        time: String(row.Time || ''),
        worker: String(row.Worker || ''),
        fee: String(row.Fee || ''),
        startDate: excelDateToFormattedDate(row['start date']),
        payment: String(row.payment || ''),
        washmanPackage: String(row['Washman Package'] || ''),
        status: String(row.Status || ''),
        notes: String(row.Notes || ''),
      }));



      setClientsData(importedClients);
      alert('Clients data imported successfully!');
    };
    reader.readAsArrayBuffer(file);
  };

  const normalizeTime = (timeStr) => {
    if (!timeStr) return '';
    
    // Handle multiple times separated by & or ,
    if (timeStr.includes('&') || timeStr.includes(',')) {
      const separator = timeStr.includes('&') ? '&' : ',';
      return timeStr.split(separator).map(t => normalizeTime(t.trim())).join(' & ');
    }
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|Am|Pm|am|pm)?/i);
    if (!match) return timeStr;
    
    let [, hour, minute, period] = match;
    hour = parseInt(hour);
    
    if (period && period.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period && period.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  const hasMatchingTime = (clientTime, scheduleTime) => {
    const normalizedClientTime = normalizeTime(clientTime);
    
    // If client has multiple times, check if any matches
    if (normalizedClientTime.includes('&')) {
      const clientTimes = normalizedClientTime.split(' & ').map(t => t.trim());
      return clientTimes.includes(scheduleTime);
    }
    
    return normalizedClientTime === scheduleTime;
  };

  const normalizeVilla = (villa) => {
    return villa.replace(/\s+/g, ' ').trim();
  };

  const handleVillaClick = (villaName) => {
    if (navigateToScheduleWithSearch) {
      navigateToScheduleWithSearch(villaName);
    }
  };

  const compareWithSchedule = () => {
    const scheduleData = JSON.parse(localStorage.getItem('appointments') || '[]');
    
    // Filter only active clients for comparison
    const activeClients = clientsData.filter(client => 
      client.status && client.status.toLowerCase() === 'active'
    );
    
    const matches = [];
    const clientsNotInSchedule = [];
    const scheduleNotInClients = [];
    const inactiveClients = clientsData.filter(client => 
      !client.status || client.status.toLowerCase() !== 'active'
    );
    
    activeClients.forEach(client => {
      const match = scheduleData.find(appt => 
        normalizeVilla(appt.villa) === normalizeVilla(client.villa) && 
        hasMatchingTime(client.time, appt.time)
      );
      
      if (match) {
        matches.push({ client, schedule: match });
      } else {
        clientsNotInSchedule.push(client);
      }
    });
    
    scheduleData.forEach(appt => {
      const match = activeClients.find(client => 
        normalizeVilla(client.villa) === normalizeVilla(appt.villa) && 
        hasMatchingTime(client.time, appt.time)
      );
      
      if (!match) {
        scheduleNotInClients.push(appt);
      }
    });
    
    setComparisonResults({
      matches,
      clientsNotInSchedule,
      scheduleNotInClients,
      inactiveClients,
      totalClients: clientsData.length,
      activeClientsCount: activeClients.length
    });
    setShowComparison(true);
  };

  const autoFillSchedule = () => {
    const activeClients = clientsData.filter(client => 
      client.status && client.status.toLowerCase() === 'active' &&
      client.villa && client.time && client.days
    );

    if (activeClients.length === 0) {
      alert('No active clients with complete data found!');
      return;
    }

    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const newAppointments = [...existingAppointments];
    
    const workers = ['Raqib', 'Rahman'];
    const workerAssignments = { 'Raqib': 0, 'Rahman': 0 };
    const workerIntAssignments = { 'Raqib': 0, 'Rahman': 0 };
    const dailyWorkerAssignments = {
      'Monday': { 'Raqib': 0, 'Rahman': 0 },
      'Tuesday': { 'Raqib': 0, 'Rahman': 0 },
      'Wednesday': { 'Raqib': 0, 'Rahman': 0 },
      'Thursday': { 'Raqib': 0, 'Rahman': 0 },
      'Friday': { 'Raqib': 0, 'Rahman': 0 },
      'Saturday': { 'Raqib': 0, 'Rahman': 0 },
      'Sunday': { 'Raqib': 0, 'Rahman': 0 }
    };
    const conflicts = [];
    const ignoredAppointments = [];
    
    // Helper function to check if appointment will be INT
    const willBeInternal = (client, day) => {
      let washPackage = client.washmanPackage;
      if (!washPackage && client.worker) {
        const workerText = client.worker.toLowerCase();
        if (workerText.includes('ext') || workerText.includes('int')) {
          washPackage = client.worker;
        }
      }
      if (!washPackage) return false;
      
      const packageStr = washPackage.toLowerCase();
      if (packageStr.includes('int')) {
        // Simple check - if it's a pattern with INT, it might be internal
        return packageStr.includes('2 ext 1 int') || packageStr.includes('3 ext 1 int');
      }
      return false;
    };
    
    // Process each active client
    activeClients.forEach(client => {
      // Parse client days
      let clientDays = [];
      if (client.days.toLowerCase() === 'daily') {
        clientDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      } else if (client.days.toLowerCase() === 'weekends') {
        clientDays = ['Friday', 'Saturday'];
      } else {
        // Handle day ranges like "Mon-Wed-Fri"
        const dayMap = {
          'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 
          'thu': 'Thursday', 'thurs': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday'
        };
        const dayParts = client.days.split('-').map(d => d.trim().toLowerCase());
        clientDays = dayParts.map(day => dayMap[day]).filter(Boolean);

      }

      // Parse client times with Notes override
      const getTimeForDay = (day) => {
        if (client.notes) {
          const dayMap = {
            'Monday': ['mon', 'monday'],
            'Tuesday': ['tue', 'tuesday'], 
            'Wednesday': ['wed', 'wednesday'],
            'Thursday': ['thu', 'thursday'],
            'Friday': ['fri', 'friday'],
            'Saturday': ['sat', 'saturday'],
            'Sunday': ['sun', 'sunday']
          };
          
          const dayAliases = dayMap[day] || [];
          for (const alias of dayAliases) {
            const regex = new RegExp(`${alias}\\s+at\\s+(\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)?)`, 'i');
            const match = client.notes.match(regex);
            if (match) {
              return normalizeTime(match[1]);
            }
          }
        }
        
        // Fallback to regular time
        if (client.time.includes('&')) {
          const times = client.time.split('&').map(t => t.trim());
          return normalizeTime(times[0]); // Use first time as default
        }
        return normalizeTime(client.time);
      };

      // Create appointments for each day with specific time
      clientDays.forEach(day => {
        const time = getTimeForDay(day);
        if (time) {
          // Check if appointment already exists for this villa/day/time
          const existingAppt = newAppointments.find(appt => 
            normalizeVilla(appt.villa) === normalizeVilla(client.villa) &&
            appt.day === day &&
            appt.time === time
          );

          if (!existingAppt) {
            const conflictingAppts = newAppointments.filter(appt => 
              appt.day === day && appt.time === time
            );
            
            let assignedWorker;
            const busyWorkers = conflictingAppts.map(appt => appt.worker);
            const availableWorkers = workers.filter(worker => !busyWorkers.includes(worker));
            
            const isInternal = willBeInternal(client, day);
            
            if (availableWorkers.length > 0) {
              assignedWorker = availableWorkers.reduce((prev, curr) => {
                if (isInternal) {
                  if (workerIntAssignments[prev] !== workerIntAssignments[curr]) {
                    return workerIntAssignments[prev] < workerIntAssignments[curr] ? prev : curr;
                  }
                }
                
                const prevDayCount = dailyWorkerAssignments[day][prev];
                const currDayCount = dailyWorkerAssignments[day][curr];
                if (prevDayCount !== currDayCount) {
                  return prevDayCount < currDayCount ? prev : curr;
                }
                return workerAssignments[prev] <= workerAssignments[curr] ? prev : curr;
              });
            } else if (conflictingAppts.length < workers.length) {
              assignedWorker = workers.reduce((prev, curr) => {
                if (isInternal) {
                  if (workerIntAssignments[prev] !== workerIntAssignments[curr]) {
                    return workerIntAssignments[prev] < workerIntAssignments[curr] ? prev : curr;
                  }
                }
                
                const prevDayCount = dailyWorkerAssignments[day][prev];
                const currDayCount = dailyWorkerAssignments[day][curr];
                if (prevDayCount !== currDayCount) {
                  return prevDayCount < currDayCount ? prev : curr;
                }
                return workerAssignments[prev] <= workerAssignments[curr] ? prev : curr;
              });
              conflicts.push({
                day: day,
                time: time,
                workers: conflictingAppts.map(appt => appt.worker).concat([assignedWorker])
              });
            } else {
              ignoredAppointments.push({
                clientName: client.name,
                villa: client.villa,
                day: day,
                time: time,
                reason: 'No workers available at this time'
              });
              return;
            }
            
            workerAssignments[assignedWorker]++;
            dailyWorkerAssignments[day][assignedWorker]++;
            if (isInternal) {
              workerIntAssignments[assignedWorker]++;
            }

            const newAppointment = {
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              villa: client.villa,
              day: day,
              time: time,
              worker: assignedWorker
            };

            newAppointments.push(newAppointment);
          }
        }
      });
    });

    // Balance Internal/External workload between workers
    const balanceWorkload = (appointments) => {
      const clientsData = JSON.parse(localStorage.getItem('clientsData') || '[]');
      
      // Get INT/EXT counts for each worker
      const workerStats = {};
      workers.forEach(worker => {
        workerStats[worker] = { int: [], ext: [], total: 0 };
      });
      
      appointments.forEach(appt => {
        if (!appt.worker || !workerStats[appt.worker]) return;
        
        const client = clientsData.find(c => 
          c.villa && appt.villa && 
          c.villa.replace(/\s+/g, ' ').trim().toLowerCase() === appt.villa.replace(/\s+/g, ' ').trim().toLowerCase()
        );
        
        if (client) {
          let washPackage = client.washmanPackage;
          if (!washPackage && client.worker) {
            const workerText = client.worker.toLowerCase();
            if (workerText.includes('ext') || workerText.includes('int')) {
              washPackage = client.worker;
            }
          }
          
          if (washPackage && washPackage.toLowerCase().includes('int')) {
            // This is likely an INT appointment
            let dayPosition = 0;
            if (client.days.toLowerCase() === 'daily') {
              const dayMap = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
              dayPosition = dayMap[appt.day] || 0;
            } else {
              const dayMap = { 'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'thurs': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday' };
              const clientDaysList = client.days.toLowerCase().split('-').map(d => dayMap[d.trim()]).filter(Boolean);
              dayPosition = clientDaysList.indexOf(appt.day);
              if (dayPosition === -1) dayPosition = 0;
            }
            
            const packageStr = washPackage.toLowerCase();
            let isInternal = false;
            
            if (packageStr.includes('2 ext 1 int week')) {
              isInternal = dayPosition === 1;
            } else if (packageStr.includes('3 ext 1 int week')) {
              isInternal = dayPosition === 1;
            }
            
            if (isInternal) {
              workerStats[appt.worker].int.push(appt);
            } else {
              workerStats[appt.worker].ext.push(appt);
            }
          } else {
            workerStats[appt.worker].ext.push(appt);
          }
        } else {
          workerStats[appt.worker].ext.push(appt);
        }
        
        workerStats[appt.worker].total++;
      });
      
      // Find imbalance and swap appointments
      const workerNames = Object.keys(workerStats);
      if (workerNames.length === 2) {
        const [worker1, worker2] = workerNames;
        const stats1 = workerStats[worker1];
        const stats2 = workerStats[worker2];
        
        const intDiff = stats1.int.length - stats2.int.length;
        
        // If difference is > 1, try to balance
        if (Math.abs(intDiff) > 1) {
          const swapsNeeded = Math.floor(Math.abs(intDiff) / 2);
          
          if (intDiff > 0) {
            // worker1 has more INT, worker2 has more EXT
            // Swap INT from worker1 with EXT from worker2
            for (let i = 0; i < swapsNeeded && i < stats1.int.length && i < stats2.ext.length; i++) {
              const intAppt = stats1.int[i];
              const extAppt = stats2.ext[i];
              
              // Check if they're not at the same time (to avoid conflicts)
              const conflict = appointments.some(appt => 
                appt.id !== intAppt.id && appt.id !== extAppt.id &&
                appt.day === intAppt.day && appt.time === intAppt.time && appt.worker === worker2
              ) || appointments.some(appt => 
                appt.id !== intAppt.id && appt.id !== extAppt.id &&
                appt.day === extAppt.day && appt.time === extAppt.time && appt.worker === worker1
              );
              
              if (!conflict) {
                // Swap workers
                const intIndex = appointments.findIndex(appt => appt.id === intAppt.id);
                const extIndex = appointments.findIndex(appt => appt.id === extAppt.id);
                
                if (intIndex !== -1 && extIndex !== -1) {
                  appointments[intIndex].worker = worker2;
                  appointments[extIndex].worker = worker1;
                }
              }
            }
          } else {
            // worker2 has more INT, worker1 has more EXT
            for (let i = 0; i < swapsNeeded && i < stats2.int.length && i < stats1.ext.length; i++) {
              const intAppt = stats2.int[i];
              const extAppt = stats1.ext[i];
              
              const conflict = appointments.some(appt => 
                appt.id !== intAppt.id && appt.id !== extAppt.id &&
                appt.day === intAppt.day && appt.time === intAppt.time && appt.worker === worker1
              ) || appointments.some(appt => 
                appt.id !== intAppt.id && appt.id !== extAppt.id &&
                appt.day === extAppt.day && appt.time === extAppt.time && appt.worker === worker2
              );
              
              if (!conflict) {
                const intIndex = appointments.findIndex(appt => appt.id === intAppt.id);
                const extIndex = appointments.findIndex(appt => appt.id === extAppt.id);
                
                if (intIndex !== -1 && extIndex !== -1) {
                  appointments[intIndex].worker = worker1;
                  appointments[extIndex].worker = worker2;
                }
              }
            }
          }
        }
      }
      
      return appointments;
    };
    
    // Apply workload balancing
    const balancedAppointments = balanceWorkload(newAppointments);
    
    localStorage.setItem('appointments', JSON.stringify(balancedAppointments));
    
    const addedCount = balancedAppointments.length - existingAppointments.length;
    const workerCounts = {};
    workers.forEach(worker => {
      workerCounts[worker] = balancedAppointments.filter(appt => appt.worker === worker).length;
    });
    
    // Calculate final INT/EXT distribution
    const finalWorkerStats = {};
    workers.forEach(worker => {
      finalWorkerStats[worker] = { int: 0, ext: 0, total: 0 };
    });
    
    const clientsData2 = JSON.parse(localStorage.getItem('clientsData') || '[]');
    balancedAppointments.forEach(appt => {
      if (!appt.worker || !finalWorkerStats[appt.worker]) return;
      
      const client = clientsData2.find(c => 
        c.villa && appt.villa && 
        c.villa.replace(/\s+/g, ' ').trim().toLowerCase() === appt.villa.replace(/\s+/g, ' ').trim().toLowerCase()
      );
      
      let isInternal = false;
      if (client) {
        let washPackage = client.washmanPackage;
        if (!washPackage && client.worker) {
          const workerText = client.worker.toLowerCase();
          if (workerText.includes('ext') || workerText.includes('int')) {
            washPackage = client.worker;
          }
        }
        
        if (washPackage && washPackage.toLowerCase().includes('int')) {
          let dayPosition = 0;
          if (client.days.toLowerCase() === 'daily') {
            const dayMap = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
            dayPosition = dayMap[appt.day] || 0;
          } else {
            const dayMap = { 'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'thurs': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday' };
            const clientDaysList = client.days.toLowerCase().split('-').map(d => dayMap[d.trim()]).filter(Boolean);
            dayPosition = clientDaysList.indexOf(appt.day);
            if (dayPosition === -1) dayPosition = 0;
          }
          
          const packageStr = washPackage.toLowerCase();
          if (packageStr.includes('2 ext 1 int week')) {
            isInternal = dayPosition === 1;
          } else if (packageStr.includes('3 ext 1 int week')) {
            isInternal = dayPosition === 1;
          }
        }
      }
      
      if (isInternal) {
        finalWorkerStats[appt.worker].int++;
      } else {
        finalWorkerStats[appt.worker].ext++;
      }
      finalWorkerStats[appt.worker].total++;
    });
    
    // Show balance information
    const totalAssignments = Object.values(workerCounts).reduce((sum, count) => sum + count, 0);
    const balanceInfo = workers.map(worker => {
      const percentage = totalAssignments > 0 ? ((workerCounts[worker] / totalAssignments) * 100).toFixed(1) : 0;
      const intCount = workerIntAssignments[worker] || 0;
      return `   ${worker}: ${workerCounts[worker]} total (${percentage}%) - ${intCount} INT assignments`;
    }).join('\n');
    
    // Show daily distribution
    const dailyDistribution = Object.keys(dailyWorkerAssignments).map(day => {
      const dayTotal = dailyWorkerAssignments[day]['Raqib'] + dailyWorkerAssignments[day]['Rahman'];
      if (dayTotal === 0) return null;
      return `   ${day}: Raqib(${dailyWorkerAssignments[day]['Raqib']}) Rahman(${dailyWorkerAssignments[day]['Rahman']})`;
    }).filter(Boolean).join('\n');

    let statsMessage = `📋 Auto-Fill Schedule Completed\n` +
      `${'='.repeat(30)}\n\n` +
      `• Added: ${addedCount} new appointments\n` +
      `• Total appointments: ${newAppointments.length}\n`;
    
    if (ignoredAppointments.length > 0) {
      statsMessage += `• Ignored appointments: ${ignoredAppointments.length}\n`;
    }
    
    if (conflicts.length > 0) {
      statsMessage += `• Conflicts: ${conflicts.length}\n`;
    }
    
    statsMessage += `\n✅ Data saved successfully!`;
    
    // Save report data for separate viewing
    const reportData = {
      totalScheduled: addedCount,
      ignoredAppointments,
      conflicts,
      workerStats: finalWorkerStats
    };
    localStorage.setItem('lastReportData', JSON.stringify(reportData));
    
    alert(statsMessage);
  };

  const fetchGoogleSheetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(googleSheetUrl);
      const csvText = await response.text();
      
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const importedClients = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          
          return {
            id: row.id || `google_${index}`,
            name: String(row.Name || ''),
            villa: String(row.Villa || ''),
            phone: String(row.Phone || ''),
            numCars: String(row['Number of car'] || ''),
            carType: String(row['Type of Car'] || ''),
            days: String(row.Days || ''),
            time: String(row.Time || ''),
            worker: String(row.Worker || ''),
            fee: String(row.Fee || ''),
            startDate: String(row['start date'] || ''),
            payment: String(row.payment || ''),
            washmanPackage: String(row['Washman Package'] || ''),
            status: String(row.Status || ''),
            notes: String(row.Notes || ''),
          };
        });
      
      setClientsData(importedClients);
    } catch (error) {
      alert('Error updating data from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  }, []);



  const filteredClients = clientsData.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.villa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showComparison && comparisonResults) {
    return (
      <div style={containerStyles}>
        <div style={cardStyles}>
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setShowComparison(false)}
              style={{
                ...buttonBaseStyles,
                background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
                border: '2px solid transparent'
              }}
            >
              ← Back to Clients
            </button>
          </div>
          
          <h1 style={{
            color: '#548235',
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>Comparison Results</h1>
          
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem', 
            padding: '1rem', 
            backgroundColor: '#DAF2D0', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem', color: '#495057' }}>
              📊 <strong>Total Clients:</strong> {comparisonResults.totalClients} | 
              ✅ <strong>Active Clients:</strong> {comparisonResults.activeClientsCount} | 
              ❌ <strong>Inactive Clients:</strong> {comparisonResults.inactiveClients.length}
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
              <em>Only Active clients are included in the comparison</em>
            </p>
          </div>
        
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: '#28a745' }}>✅ Matched ({comparisonResults.matches.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={thStyles}>Client Name</th>
                  <th style={thStyles}>Villa</th>
                  <th style={thStyles}>Client Time</th>
                  <th style={thStyles}>Client Days</th>
                  <th style={thStyles}>Schedule Day</th>
                  <th style={thStyles}>Schedule Time</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.matches.map((match, index) => (
                  <tr key={index} style={index % 2 === 0 ? { ...trStyles, ...evenTrStyles } : trStyles}>
                    <td style={tdStyles}>{match.client.name}</td>
                    <td style={tdStyles}>{match.client.villa}</td>
                    <td style={tdStyles}>{match.client.time}</td>
                    <td style={tdStyles}>{match.client.days}</td>
                    <td style={tdStyles}>{match.schedule.day}</td>
                    <td style={tdStyles}>{match.schedule.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: '#dc3545' }}>❌ Clients Not in Schedule ({comparisonResults.clientsNotInSchedule.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={thStyles}>Name</th>
                  <th style={thStyles}>Villa</th>
                  <th style={thStyles}>Time</th>
                  <th style={thStyles}>Days</th>
                  <th style={thStyles}>Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.clientsNotInSchedule.map((client, index) => (
                  <tr key={index} style={index % 2 === 0 ? { ...trStyles, ...evenTrStyles } : trStyles}>
                    <td style={tdStyles}>{client.name}</td>
                    <td style={tdStyles}>{client.villa}</td>
                    <td style={tdStyles}>{client.time}</td>
                    <td style={tdStyles}>{client.days}</td>
                    <td style={tdStyles}>
                      {!client.time || !client.days ? 'Incomplete Data' : 'Not Scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <h2 style={{ color: '#ffc107' }}>⚠️ Schedule Not in Clients ({comparisonResults.scheduleNotInClients.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={thStyles}>Villa</th>
                  <th style={thStyles}>Day</th>
                  <th style={thStyles}>Time</th>
                  <th style={thStyles}>Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.scheduleNotInClients.map((appt, index) => (
                  <tr key={index} style={index % 2 === 0 ? { ...trStyles, ...evenTrStyles } : trStyles}>
                    <td style={tdStyles}>{appt.villa}</td>
                    <td style={tdStyles}>{appt.day}</td>
                    <td style={tdStyles}>{appt.time}</td>
                    <td style={tdStyles}>No Client Found</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedClientForInvoice && (
        <InvoiceGenerator 
          clientData={selectedClientForInvoice}
          onClose={() => setSelectedClientForInvoice(null)}
        />
      )}
    <div style={containerStyles}>
      <div style={cardStyles}>
        <h1 style={{
          color: '#548235',
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>Clients Management</h1>
        
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportClients}
            style={{ display: 'none' }}
            id="import-clients"
          />
          <label 
            htmlFor="import-clients" 
            style={{
              ...buttonBaseStyles,
              background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
              border: '2px solid transparent'
            }}
          >
            📁 Import Excel/CSV
          </label>
          
          <button
            onClick={fetchGoogleSheetData}
            disabled={isLoading}
            style={{
              ...buttonBaseStyles,
              background: isLoading ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? '0 4px 15px rgba(148, 163, 184, 0.3)' : '0 6px 20px rgba(84, 130, 53, 0.3)',
              border: '2px solid transparent'
            }}
          >
            {isLoading ? '🔄 Updating...' : '🔄 Refresh from Google Sheets'}
          </button>
          
          <button
            onClick={compareWithSchedule}
            style={{
              ...buttonBaseStyles,
              background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
              border: '2px solid transparent'
            }}
          >
            📊 Compare with Schedule
          </button>
          
          <button
            onClick={autoFillSchedule}
            style={{
              ...buttonBaseStyles,
              background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
              border: '2px solid transparent'
            }}
          >
            ✨ Auto Fill Schedule
          </button>
          
          <button
            onClick={() => {
              const savedReportData = localStorage.getItem('lastReportData');
              if (savedReportData && navigateToReport) {
                navigateToReport(JSON.parse(savedReportData));
              } else {
                alert('لا يوجد تقرير متاح. يرجى تشغيل الجدولة التلقائية أولاً.');
              }
            }}
            style={{
              ...buttonBaseStyles,
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              color: 'white',
              boxShadow: '0 6px 20px rgba(23, 162, 184, 0.3)',
              border: '2px solid transparent'
            }}
          >
            📊 View Report
          </button>
          

        </div>

        <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '2rem' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="🔍 Search clients by name, villa, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...searchInputStyles,
              marginBottom: '0',
              paddingRight: searchTerm ? '40px' : '1rem'
            }}
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
                fontSize: '18px',
                color: '#6c757d',
                cursor: 'pointer',
                padding: '0',
                width: '20px',
                height: '20px',
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

        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Name</th>
                <th style={thStyles}>Villa</th>
                <th style={thStyles}>Phone</th>
                <th style={thStyles}>Number of Cars</th>
                <th style={thStyles}>Type of Car</th>
                <th style={thStyles}>Days</th>
                <th style={thStyles}>Time</th>

                <th style={thStyles}>Fee</th>
                <th style={thStyles}>Start Date</th>
                <th style={thStyles}>Payment</th>
                <th style={thStyles}>Washman Package</th>
                <th style={thStyles}>Notes</th>
                <th style={thStyles}>Current Wash</th>
                <th style={thStyles}>Status</th>
                <th style={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr key={client.id} style={index % 2 === 0 ? { ...trStyles, ...evenTrStyles } : trStyles}>
                  <td style={tdStyles}>{client.name}</td>
                  <td style={{
                    ...tdStyles,
                    cursor: 'pointer',
                    color: '#548235',
                    fontWeight: '600',
                    textDecoration: 'underline'
                  }} onClick={() => handleVillaClick(client.villa)}>
                    {client.villa}
                  </td>
                  <td style={tdStyles}>{client.phone}</td>
                  <td style={tdStyles}>{client.numCars}</td>
                  <td style={tdStyles}>{client.carType}</td>
                  <td style={tdStyles}>{client.days}</td>
                  <td style={tdStyles}>{client.time}</td>

                  <td style={tdStyles}>{client.fee}</td>
                  <td style={tdStyles}>{client.startDate}</td>
                  <td style={tdStyles}>{client.payment}</td>
                  <td style={tdStyles}>{client.washmanPackage}</td>
                  <td style={tdStyles}>{client.notes}</td>
                  <td style={tdStyles}>
                    {(() => {
                      if (!client.startDate || !client.days) {
                        return (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            backgroundColor: '#6c757d',
                            color: 'white'
                          }}>
                            ❓ Missing Data
                          </span>
                        );
                      }
                      
                      // Check for wash package in washmanPackage field first, then in worker field
                      let washPackage = client.washmanPackage;
                      if (!washPackage && client.worker) {
                        const workerText = client.worker.toLowerCase();
                        if (workerText.includes('ext') || workerText.includes('int')) {
                          washPackage = client.worker;
                        }
                      }
                      
                      if (!washPackage) {
                        return (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            backgroundColor: '#6c757d',
                            color: 'white'
                          }}>
                            ❓ Missing Data
                          </span>
                        );
                      }
                      
                      // عرض نمط الغسيل
                      const washPattern = getClientWashPattern(client);
                      
                      if (washPattern) {
                        return (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            backgroundColor: '#17a2b8',
                            color: 'white'
                          }}>
                            {washPattern}
                          </span>
                        );
                      }
                      
                      // إذا مافيش باكج بس في بيانات أخرى
                      if (client.washmanPackage || (client.worker && (client.worker.toLowerCase().includes('ext') || client.worker.toLowerCase().includes('int')))) {
                        return (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            backgroundColor: '#ffc107',
                            color: 'black'
                          }}>
                            {client.washmanPackage || client.worker}
                          </span>
                        );
                      }
                      
                      return (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          backgroundColor: '#6c757d',
                          color: 'white'
                        }}>
                          ❓ No Package
                        </span>
                      );
                    })()}
                  </td>
                  <td style={tdStyles}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: client.status && client.status.toLowerCase() === 'active' ? '#28a745' : '#dc3545',
                      color: 'white'
                    }}>
                      {client.status || 'Not Active'}
                    </span>
                  </td>
                  <td style={tdStyles}>
                    <button
                      onClick={() => setSelectedClientForInvoice(client)}
                      style={{
                        background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(84, 130, 53, 0.3)'
                      }}
                    >
                      📄 Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontSize: '1.1rem' }}>
            🔍 No clients found matching your search.
          </p>
        )}
      </div>
    </div>
    </>
  );
}

export default ClientsPage;