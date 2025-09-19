import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SchedulePage from './pages/Schedule';
import ClientsPage from './pages/Clients';
import Report from './pages/Report';
import LoginScreen from './components/LoginScreen';
import { initializeFirebaseData } from './services/initializeData';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');
  const [currentPage, setCurrentPage] = useState('schedule');
  const [clientSearchTerm, setClientSearchTerm] = useState(''); // New state for client search
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState(''); // New state for schedule search
  const [reportData, setReportData] = useState(null); // State for report data

  useEffect(() => {
    // Check if user was previously authenticated
    const savedAuth = sessionStorage.getItem('glogo_authenticated');
    const savedRole = sessionStorage.getItem('glogo_user_role');
    const savedUsername = sessionStorage.getItem('glogo_username');
    
    if (savedAuth === 'true' && savedRole && savedUsername) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setUsername(savedUsername);
      initializeFirebaseData();
    }
  }, []);

  const handleLogin = (role, user) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(user);
    sessionStorage.setItem('glogo_authenticated', 'true');
    sessionStorage.setItem('glogo_user_role', role);
    sessionStorage.setItem('glogo_username', user);
    initializeFirebaseData();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername('');
    sessionStorage.removeItem('glogo_authenticated');
    sessionStorage.removeItem('glogo_user_role');
    sessionStorage.removeItem('glogo_username');
    setCurrentPage('schedule');
    setClientSearchTerm('');
    setScheduleSearchTerm('');
    setReportData(null);
  };

  const navigateToClientsWithSearch = (searchTerm = '') => {
    setClientSearchTerm(searchTerm);
    setCurrentPage('clients');
  };

  const navigateToScheduleWithSearch = (searchTerm = '') => {
    setScheduleSearchTerm(searchTerm);
    setCurrentPage('schedule');
  };

  const navigateToReport = (data) => {
    setReportData(data);
    setCurrentPage('report');
  };

  const renderPage = () => {
    if (currentPage === 'schedule') {
      return <SchedulePage 
        navigateToClientsWithSearch={navigateToClientsWithSearch} 
        initialSearchTerm={scheduleSearchTerm}
        userRole={userRole}
      />;
    }
    if (currentPage === 'clients') {
      return <ClientsPage 
        initialSearchTerm={clientSearchTerm} 
        navigateToScheduleWithSearch={navigateToScheduleWithSearch}
        navigateToReport={navigateToReport}
        userRole={userRole}
      />;
    }
    if (currentPage === 'report') {
      return <Report 
        reportData={reportData}
        onBack={() => setCurrentPage('clients')}
      />;
    }
  };

  // Clear search terms when navigating away from pages
  const handlePageChange = (page) => {
    if (currentPage === 'clients' && page !== 'clients') {
      setClientSearchTerm('');
    }
    if (currentPage === 'schedule' && page !== 'schedule') {
      setScheduleSearchTerm('');
    }
    setCurrentPage(page);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Navbar 
        setCurrentPage={handlePageChange} 
        currentPage={currentPage}
        onLogout={handleLogout}
        username={username}
        userRole={userRole}
      />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;