import React from 'react';

const styles = {
  navbar: {
    backgroundColor: '#548235',
    padding: '1rem 2rem',
    display: 'flex',
    gap: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.07)',
    justifyContent: 'center'
  },
  button: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease-in-out',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent'
  },
  activeButton: {
    backgroundColor: '#007bff'
  }
};

function Navbar({ setCurrentPage, currentPage }) {
  return (
    <nav style={styles.navbar}>
      <button 
        onClick={() => setCurrentPage('schedule')}
        style={currentPage === 'schedule' ? {...styles.button, ...styles.activeButton} : styles.button}
        onMouseOver={(e) => currentPage !== 'schedule' && (e.target.style.backgroundColor = 'rgba(255,255,255,0.1)')}
        onMouseOut={(e) => currentPage !== 'schedule' && (e.target.style.backgroundColor = 'transparent')}
      >
        📅 Schedule
      </button>
      <button 
        onClick={() => setCurrentPage('clients')}
        style={currentPage === 'clients' ? {...styles.button, ...styles.activeButton} : styles.button}
        onMouseOver={(e) => currentPage !== 'clients' && (e.target.style.backgroundColor = 'rgba(255,255,255,0.1)')}
        onMouseOut={(e) => currentPage !== 'clients' && (e.target.style.backgroundColor = 'transparent')}
      >
        👥 Clients
      </button>
    </nav>
  );
}

export default Navbar;
