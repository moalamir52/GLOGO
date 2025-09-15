import React, { useState } from 'react';

function UniqueVillasModal({ uniqueVillas, onClose, navigateToClientsWithSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleVillaClick = (villaName) => {
    navigateToClientsWithSearch(villaName);
    onClose();
  };

  const filteredVillas = uniqueVillas.filter(villa => 
    villa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '30px',
        padding: '0',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        border: '4px solid #548235',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{
          background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 50%, #7db46c 100%)',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
            opacity: 0.8
          }}></div>
          <h2 style={{
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: '800',
            margin: '0 0 0.8rem 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '1px',
            position: 'relative',
            zIndex: 1
          }}>🏠 Villa Directory</h2>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: '700',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 1,
            textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {filteredVillas.length} Properties
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#DAF2D0' }}>
          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <input
              type="text"
              placeholder="🔍 Search properties by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                fontSize: '1rem',
                padding: '12px 50px 12px 20px',
                borderRadius: '25px',
                border: '3px solid #548235',
                width: '100%',
                transition: 'all 0.4s ease',
                boxShadow: '0 10px 30px rgba(84, 130, 53, 0.2)',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                fontWeight: '500'
              }}
            />
            <div style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#548235',
              fontSize: '1.5rem',
              pointerEvents: 'none'
            }}>🔍</div>
          </div>
        
          {filteredVillas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#548235',
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              {searchTerm ? '🔍 No properties found matching your search.' : '🏠 No properties found.'}
            </div>
          ) : (
            <div style={{
              flexGrow: 1,
              overflowY: 'auto',
              paddingRight: '15px',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                {filteredVillas.map((villa, index) => {
                  const colors = [
                    'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
                    'linear-gradient(135deg, #6a9c3d 0%, #7db46c 100%)',
                    'linear-gradient(135deg, #548235 0%, #7db46c 100%)'
                  ];
                  return (
                    <div
                      key={villa}
                      onClick={() => handleVillaClick(villa)}
                      style={{
                        padding: '12px 16px',
                        background: colors[index % 3],
                        color: 'white',
                        borderRadius: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 8px 25px rgba(84, 130, 53, 0.3)',
                        fontWeight: '700',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        border: '3px solid transparent',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(84, 130, 53, 0.4)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(84, 130, 53, 0.3)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 70%)',
                        opacity: 0.8
                      }}></div>
                      <span style={{ 
                        position: 'relative', 
                        zIndex: 2,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                        letterSpacing: '0.5px'
                      }}>🏠 {villa}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '3px solid #548235', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: 'pointer',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(84, 130, 53, 0.3)',
              background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
              color: 'white'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ✖️ Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UniqueVillasModal;
