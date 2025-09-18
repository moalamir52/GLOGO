// دالة للحصول على نوع الغسيل لعميل معين في يوم محدد
const getClientWashType = (villaName, appointmentDay) => {
  const clientsData = JSON.parse(localStorage.getItem('clientsData') || '[]');
  const client = clientsData.find(c => 
    c.villa && villaName && 
    c.villa.replace(/\s+/g, ' ').trim().toLowerCase() === villaName.replace(/\s+/g, ' ').trim().toLowerCase()
  );
  
  if (!client || !client.days) return '';
  
  let washPackage = client.washmanPackage;
  if (!washPackage && client.worker) {
    const workerText = client.worker.toLowerCase();
    if (workerText.includes('ext') || workerText.includes('int')) {
      washPackage = client.worker;
    }
  }
  
  if (!washPackage) return '';
  
  let dayPosition = 0;
  
  if (client.days.toLowerCase() === 'daily') {
    const dayMap = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
    dayPosition = dayMap[appointmentDay] || 0;
  } else if (client.days.toLowerCase() === 'weekends') {
    dayPosition = appointmentDay === 'Friday' ? 0 : 1;
  } else {
    const dayMap = { 'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'thurs': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday' };
    const clientDaysList = client.days.toLowerCase().split('-').map(d => dayMap[d.trim()]).filter(Boolean);
    dayPosition = clientDaysList.indexOf(appointmentDay);
    if (dayPosition === -1) dayPosition = 0;
  }
  
  const packageStr = washPackage.toLowerCase();
  
  if (packageStr.includes('2 ext 1 int week')) {
    return dayPosition === 1 ? '🧽 INT' : '🚗 EXT';
  }
  
  if (packageStr.includes('3 ext 1 int week')) {
    return dayPosition === 1 ? '🧽 INT' : '🚗 EXT';
  }
  
  if (packageStr.includes('bi week')) {
    if (!client.startDate) return '🚗 EXT';
    
    let startDateObj;
    if (client.startDate.includes('-')) {
      const [day, month, year] = client.startDate.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      startDateObj = new Date(parseInt(year), monthMap[month], parseInt(day));
    } else {
      startDateObj = new Date(client.startDate);
    }
    
    const today = new Date();
    const weeksSinceStart = Math.floor((today - startDateObj) / (1000 * 60 * 60 * 24 * 7));
    
    if (packageStr.includes('2 ext 1 int bi week')) {
      const biWeeklyPosition = (weeksSinceStart * 2 + dayPosition) % 4;
      return biWeeklyPosition === 3 ? '🧽 INT' : '🚗 EXT';
    }
    
    if (packageStr.includes('3 ext 1 int bi week')) {
      const biWeeklyPosition = (weeksSinceStart * 3 + dayPosition) % 6;
      return biWeeklyPosition === 4 ? '🧽 INT' : '🚗 EXT';
    }
  }
  
  return '🚗 EXT';
};

// دالة لعرض النمط الكامل للعميل
const getClientWashPattern = (client) => {
  if (!client || !client.days) return '';
  
  let washPackage = client.washmanPackage;
  if (!washPackage && client.worker) {
    const workerText = client.worker.toLowerCase();
    if (workerText.includes('ext') || workerText.includes('int')) {
      washPackage = client.worker;
    }
  }
  
  if (!washPackage) return '';
  
  const packageStr = washPackage.toLowerCase();
  
  if (packageStr.includes('2 ext 1 int week')) {
    return 'EXT→INT';
  }
  
  if (packageStr.includes('3 ext 1 int week')) {
    return 'EXT→INT→EXT';
  }
  
  if (packageStr.includes('2 ext 1 int bi week')) {
    return 'EXT→EXT→EXT→INT';
  }
  
  if (packageStr.includes('3 ext 1 int bi week')) {
    return 'EXT→EXT→EXT→EXT→INT→EXT';
  }
  
  return '';
};

// دوال فارغة للتوافق مع الكود الموجود
const getClientWashTypeForDay = () => '';
const getWashTypeForClient = () => '';
const calculateWeeksSinceStart = () => 0;

export { getClientWashType, getClientWashTypeForDay, getWashTypeForClient, calculateWeeksSinceStart, getClientWashPattern };