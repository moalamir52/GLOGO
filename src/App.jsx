import { useState } from 'react';
import Navbar from './components/Navbar';
import SchedulePage from './pages/Schedule';
import ClientsPage from './pages/Clients';
import Report from './pages/Report';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('schedule');
  const [clientSearchTerm, setClientSearchTerm] = useState(''); // New state for client search
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState(''); // New state for schedule search
  const [reportData, setReportData] = useState(null); // State for report data

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
      />;
    }
    if (currentPage === 'clients') {
      return <ClientsPage 
        initialSearchTerm={clientSearchTerm} 
        navigateToScheduleWithSearch={navigateToScheduleWithSearch}
        navigateToReport={navigateToReport}
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

  return (
    <div className="App">
      <Navbar setCurrentPage={handlePageChange} currentPage={currentPage} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;