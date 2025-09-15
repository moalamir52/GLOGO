import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clients as defaultClients } from '../data';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

const calculateWeeksSinceStart = (startDateStr) => {
  if (!startDateStr) return 0;
  
  let startDate;
  if (startDateStr.includes('-')) {
    // Handle DD-MMM-YYYY format (e.g., "15-Jan-2024")
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
  
  // Smart parsing for various formats like "3 Ext 1 Bi week", "2 EXT 1 INT week", etc.
  const packageStr = washPackage.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  
  // Extract numbers and keywords
  const numbers = packageStr.match(/\d+/g) || [];
  const hasExt = /ext/i.test(packageStr);
  const hasInt = /int/i.test(packageStr);
  const isBiWeekly = /bi/i.test(packageStr);
  
  let extCount = 0;
  let intCount = 0;
  
  if (numbers.length >= 2 && hasExt && hasInt) {
    // Format like "3 Ext 1 Int" or "2 EXT 1 INT"
    extCount = parseInt(numbers[0]);
    intCount = parseInt(numbers[1]);
  } else if (numbers.length >= 1 && hasExt && !hasInt) {
    // Format like "3 Ext" (assume 0 INT)
    extCount = parseInt(numbers[0]);
    intCount = 0;
  } else if (numbers.length >= 1 && hasInt && !hasExt) {
    // Format like "2 Int" (assume 0 EXT)
    extCount = 0;
    intCount = parseInt(numbers[0]);
  } else {
    return ''; // Can't parse
  }
  const totalRatio = extCount + intCount;
  
  if (totalRatio === 0) return '';
  
  // Count days per week
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
  
  // For bi-weekly: cycle period is doubled
  const adjustedWeek = isBiWeekly ? Math.floor(weekNumber / 2) : weekNumber;
  
  // If multiple washes per week, distribute based on ratio
  if (daysPerWeek >= totalRatio) {
    const washIndex = adjustedWeek % daysPerWeek;
    const extDays = Math.round((extCount / totalRatio) * daysPerWeek);
    return washIndex < extDays ? '🚗 EXT' : '🧽 INT';
  } else {
    // If fewer washes than ratio, cycle through weeks
    const positionInCycle = adjustedWeek % totalRatio;
    return positionInCycle < extCount ? '🚗 EXT' : '🧽 INT';
  }
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

function ClientsPage({ initialSearchTerm = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const searchInputRef = useRef(null);
  const [clientsData, setClientsData] = useState(() => {
    const savedClients = localStorage.getItem('clientsData');
    return savedClients ? JSON.parse(savedClients) : defaultClients;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    localStorage.setItem('clientsData', JSON.stringify(clientsData));
  }, [clientsData]);

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
      }));

      importedClients.forEach(client => {
        if (!isValidDays(client.days)) {
          console.warn(`Validation Warning: Client "${client.name}" (ID: ${client.id}) has an invalid "Days" value: "${client.days}"`);
        }
      });

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
    // Get active clients only
    const activeClients = clientsData.filter(client => 
      client.status && client.status.toLowerCase() === 'active' &&
      client.villa && client.time && client.days
    );

    if (activeClients.length === 0) {
      alert('No active clients with complete data found!');
      return;
    }

    // Get existing appointments
    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const newAppointments = [...existingAppointments];
    
    // Available workers with balanced assignment
    const workers = ['Raqib', 'Rahman'];
    const workerAssignments = { 'Raqib': 0, 'Rahman': 0 };
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

      // Parse client times
      const clientTimes = [];
      if (client.time.includes('&')) {
        const times = client.time.split('&').map(t => t.trim());
        times.forEach(time => {
          const normalizedTime = normalizeTime(time);
          if (normalizedTime) clientTimes.push(normalizedTime);
        });
      } else {
        const normalizedTime = normalizeTime(client.time);
        if (normalizedTime) clientTimes.push(normalizedTime);
      }

      // Create appointments for each day and time combination
      clientDays.forEach(day => {
        clientTimes.forEach(time => {
          // Check if appointment already exists for this villa/day/time
          const existingAppt = newAppointments.find(appt => 
            normalizeVilla(appt.villa) === normalizeVilla(client.villa) &&
            appt.day === day &&
            appt.time === time
          );

          if (!existingAppt) {
            // Check for worker conflicts at this day/time
            const conflictingAppts = newAppointments.filter(appt => 
              appt.day === day && appt.time === time
            );
            
            // Find available worker (not busy at this time)
            let assignedWorker;
            const busyWorkers = conflictingAppts.map(appt => appt.worker);
            const availableWorkers = workers.filter(worker => !busyWorkers.includes(worker));
            
            if (availableWorkers.length > 0) {
              // Choose worker with fewer assignments for this day, then overall balance
              assignedWorker = availableWorkers.reduce((prev, curr) => {
                const prevDayCount = dailyWorkerAssignments[day][prev];
                const currDayCount = dailyWorkerAssignments[day][curr];
                if (prevDayCount !== currDayCount) {
                  return prevDayCount < currDayCount ? prev : curr;
                }
                return workerAssignments[prev] <= workerAssignments[curr] ? prev : curr;
              });
            } else {
              // All workers busy, choose one with fewer assignments for this day
              assignedWorker = workers.reduce((prev, curr) => {
                const prevDayCount = dailyWorkerAssignments[day][prev];
                const currDayCount = dailyWorkerAssignments[day][curr];
                if (prevDayCount !== currDayCount) {
                  return prevDayCount < currDayCount ? prev : curr;
                }
                return workerAssignments[prev] <= workerAssignments[curr] ? prev : curr;
              });
              conflicts.push({
                villa: client.villa,
                day: day,
                time: time,
                worker: assignedWorker,
                message: `⚠️ Worker conflict: ${assignedWorker} already busy at ${time} on ${day}`
              });
            }
            
            // Track assignment for balance
            workerAssignments[assignedWorker]++;
            dailyWorkerAssignments[day][assignedWorker]++;

            // Create new appointment
            const newAppointment = {
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              villa: client.villa,
              day: day,
              time: time,
              worker: assignedWorker
            };

            newAppointments.push(newAppointment);
          }
        });
      });
    });

    // Save updated appointments
    localStorage.setItem('appointments', JSON.stringify(newAppointments));
    
    // Calculate statistics
    const addedCount = newAppointments.length - existingAppointments.length;
    const workerCounts = {};
    workers.forEach(worker => {
      workerCounts[worker] = newAppointments.filter(appt => appt.worker === worker).length;
    });
    
    // Show balance information
    const totalAssignments = Object.values(workerCounts).reduce((sum, count) => sum + count, 0);
    const balanceInfo = workers.map(worker => {
      const percentage = totalAssignments > 0 ? ((workerCounts[worker] / totalAssignments) * 100).toFixed(1) : 0;
      return `   ${worker}: ${workerCounts[worker]} appointments (${percentage}%)`;
    }).join('\n');
    
    // Show daily distribution
    const dailyDistribution = Object.keys(dailyWorkerAssignments).map(day => {
      const dayTotal = dailyWorkerAssignments[day]['Raqib'] + dailyWorkerAssignments[day]['Rahman'];
      if (dayTotal === 0) return null;
      return `   ${day}: Raqib(${dailyWorkerAssignments[day]['Raqib']}) Rahman(${dailyWorkerAssignments[day]['Rahman']})`;
    }).filter(Boolean).join('\n');

    let statsMessage = `Schedule Auto-Fill Complete!\n\n` +
      `✅ Added: ${addedCount} new appointments\n` +
      `📊 Total appointments: ${newAppointments.length}\n` +
      `👷 Overall Worker Distribution:\n` +
      balanceInfo +
      (dailyDistribution ? `\n\n📅 Daily Distribution:\n${dailyDistribution}` : '');
    
    if (conflicts.length > 0) {
      statsMessage += `\n\n⚠️ CONFLICTS DETECTED (${conflicts.length}):\n` +
        conflicts.map(conflict => 
          `• ${conflict.villa} - ${conflict.day} ${conflict.time} (${conflict.worker})`
        ).join('\n') +
        `\n\n🚨 Some workers are assigned to multiple locations at the same time!`;
    }
    
    statsMessage += `\n\n🔄 Please refresh the Schedule page to see changes.`;

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
          };
        });
      
      setClientsData(importedClients);
    } catch (error) {
      console.error('Error fetching Google Sheet data:', error);
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
                <th style={thStyles}>Worker</th>
                <th style={thStyles}>Fee</th>
                <th style={thStyles}>Start Date</th>
                <th style={thStyles}>Payment</th>
                <th style={thStyles}>Washman Package</th>
                <th style={thStyles}>Current Wash</th>
                <th style={thStyles}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr key={client.id} style={index % 2 === 0 ? { ...trStyles, ...evenTrStyles } : trStyles}>
                  <td style={tdStyles}>{client.name}</td>
                  <td style={tdStyles}>{client.villa}</td>
                  <td style={tdStyles}>{client.phone}</td>
                  <td style={tdStyles}>{client.numCars}</td>
                  <td style={tdStyles}>{client.carType}</td>
                  <td style={tdStyles}>{client.days}</td>
                  <td style={tdStyles}>{client.time}</td>
                  <td style={tdStyles}>{client.worker}</td>
                  <td style={tdStyles}>{client.fee}</td>
                  <td style={tdStyles}>{client.startDate}</td>
                  <td style={tdStyles}>{client.payment}</td>
                  <td style={tdStyles}>{client.washmanPackage}</td>
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
                      
                      const washType = getWashTypeForWeek(washPackage, calculateWeeksSinceStart(client.startDate), client.days);
                      
                      return (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: washType.includes('EXT') ? '#007bff' : '#28a745',
                          color: 'white'
                        }}>
                          {washType || 'N/A'}
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
  );
}

export default ClientsPage;