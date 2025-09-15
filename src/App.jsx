import { useState } from 'react';
import Navbar from './components/Navbar';
import SchedulePage from './pages/Schedule';
import ClientsPage from './pages/Clients';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('schedule');
  const [clientSearchTerm, setClientSearchTerm] = useState(''); // New state for client search

  const navigateToClientsWithSearch = (searchTerm = '') => {
    setClientSearchTerm(searchTerm);
    setCurrentPage('clients');
  };

  const renderPage = () => {
    if (currentPage === 'schedule') {
      return <SchedulePage navigateToClientsWithSearch={navigateToClientsWithSearch} />; // Pass the new prop
    }
    if (currentPage === 'clients') {
      return <ClientsPage initialSearchTerm={clientSearchTerm} />; // Pass the new prop
    }
  };

  // Clear search term when navigating away from clients page
  const handlePageChange = (page) => {
    if (currentPage === 'clients' && page !== 'clients') {
      setClientSearchTerm('');
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