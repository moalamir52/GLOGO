import React from 'react';

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem'
  },
  buttonContainer: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '8px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    border: '2px solid #548235',
    display: 'flex',
    gap: '8px'
  },
  button: {
    color: '#548235',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    padding: '12px 20px',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '120px',
    justifyContent: 'center'
  },
  activeButton: {
    backgroundColor: '#548235',
    color: 'white',
    boxShadow: '0 4px 15px rgba(84, 130, 53, 0.3)'
  }
};

function Navbar({ setCurrentPage, currentPage, onLogout, username, userRole }) {
  return (
    <nav style={styles.navbar}>
      <div style={styles.buttonContainer}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: userRole === 'admin' ? '#28a745' : '#17a2b8',
          borderRadius: '8px',
          marginRight: '10px'
        }}>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
            {userRole === 'admin' ? '👑' : '👤'} {username} ({userRole})
          </span>
        </div>
        <button 
          onClick={() => setCurrentPage('schedule')}
          style={currentPage === 'schedule' ? {...styles.button, ...styles.activeButton} : styles.button}
          onMouseOver={(e) => {
            if (currentPage !== 'schedule') {
              e.target.style.backgroundColor = '#DAF2D0';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 'schedule') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          📅 Schedule
        </button>
        <button 
          onClick={() => setCurrentPage('clients')}
          style={currentPage === 'clients' ? {...styles.button, ...styles.activeButton} : styles.button}
          onMouseOver={(e) => {
            if (currentPage !== 'clients') {
              e.target.style.backgroundColor = '#DAF2D0';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 'clients') {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          👥 Clients
        </button>
        <button 
          onClick={onLogout}
          style={{
            ...styles.button,
            backgroundColor: '#dc3545',
            color: 'white',
            marginLeft: '20px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#c82333';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#dc3545';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🚪 Exit
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
