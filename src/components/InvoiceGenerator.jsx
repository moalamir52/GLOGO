import React, { useState } from 'react';

// ====================================================================
// 1. مكون الفاتورة الأساسي (للعرض فقط)
// Invoice Component (Dumb Component for Display)
// ====================================================================

const Invoice = ({ invoiceData }) => {
  // تعريف متغيرات لسهولة الوصول للبيانات
  const {
    ref,
    date,
    customer,
    service,
    basePrice
  } = invoiceData;

  // إعدادات ثابتة
  const TRN = "أدخل رقمك الضريبي الثابت هنا"; // TRN is constant
  const VAT_RATE = 0.05; // 5% VAT

  // حسابات السعر
  const vatAmount = basePrice * VAT_RATE;
  const totalPrice = basePrice + vatAmount;

  // تنسيق التاريخ ليكون بشكل "DD/MM/YYYY"
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div style={styles.invoiceContainer}>
      <h1 style={styles.header}>Tax Invoice</h1>

      <div style={styles.invoiceInfo}>
        <p>Date: {formattedDate}</p>
      </div>
      
      <div style={styles.refInfo}>
        <p>Ref: {ref}</p>
        <p>TRN#: {TRN}</p>
      </div>

      <div style={styles.customerInfo}>
        <p>{customer.name}</p>
        <p>{customer.addressLine1}</p>
        <p>{customer.addressLine2}</p>
      </div>

      <p style={styles.subject}>SUB: {service.subject}</p>

      <p>Dear Sir,</p>
      <p>Thank you for subscribing to the monthly car wash service.</p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>No.</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Duration</th>
            <th style={styles.th}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{...styles.td, textAlign: 'center', verticalAlign: 'middle'}}>1</td>
            <td style={styles.td}>
              Name: {customer.name}<br />
              Package ID: {service.packageId}<br />
              Vehicle: {service.vehicleType}<br />
              Start: {service.startDate}<br />
              End: {service.endDate}
            </td>
            <td style={{...styles.td, textAlign: 'center', verticalAlign: 'middle'}}>{service.duration}</td>
            <td style={{...styles.td, textAlign: 'center', verticalAlign: 'middle'}}>{basePrice} + {VAT_RATE * 100}% VAT</td>
          </tr>
          <tr>
            <td style={styles.emptyCell}></td>
            <td style={styles.emptyCell}></td>
            <td style={styles.totalLabelCell}>TOTAL:</td>
            <td style={styles.totalValueCell}>AED {totalPrice.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style={styles.footer}>
        <h3>General Conditions:</h3>
        <p>Terms: Payments are to be made in advance at the beginning of each month</p>
        <p style={{ marginTop: '20px' }}>Best Regards,</p>
        <p>GLOGO car wash</p>
      </div>
    </div>
  );
};

// ====================================================================
// 2. مكون لتوليد الفاتورة وتزويدها بالبيانات
// Invoice Generator Component (Handles Data)
// ====================================================================

export const InvoiceGenerator = ({ clientData, onClose }) => {
  const [showInvoice, setShowInvoice] = useState(false);

  // تحويل بيانات العميل إلى بيانات فاتورة
  const generateInvoiceData = () => {
    const today = new Date();
    
    // استخدام تاريخ بداية العميل أو التاريخ الحالي
    let startDate = clientData.startDate || today.toLocaleDateString('en-GB');
    
    // حساب تاريخ النهاية (30 يوم من تاريخ البداية)
    let startDateObj;
    if (clientData.startDate && clientData.startDate.includes('-')) {
      const [day, month, year] = clientData.startDate.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      startDateObj = new Date(parseInt(year), monthMap[month], parseInt(day));
    } else {
      startDateObj = new Date(clientData.startDate || today);
    }
    
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 30);
    
    return {
      ref: `GLOGO-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      date: today.toISOString().split('T')[0],
      customer: {
        name: clientData.name || 'Customer Name',
        addressLine1: clientData.villa || 'Villa Address',
        addressLine2: 'Dubai, U.A.E.'
      },
      service: {
        subject: 'Car Wash',
        packageId: clientData.washmanPackage || 'Standard Package',
        vehicleType: clientData.carType || 'Vehicle',
        startDate: startDateObj.toLocaleDateString('en-GB'),
        endDate: endDateObj.toLocaleDateString('en-GB'),
        duration: '30 days'
      },
      basePrice: parseInt(clientData.fee) || 100
    };
  };

  const handlePrint = () => {
    window.print();
  };

  if (!showInvoice) {
    return (
      <div style={styles.modalBackdrop} onClick={onClose}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: '#548235', marginBottom: '1.5rem' }}>Generate Invoice</h2>
          <div style={styles.clientPreview}>
            <p><strong>Client:</strong> {clientData.name}</p>
            <p><strong>Villa:</strong> {clientData.villa}</p>
            <p><strong>Package:</strong> {clientData.washmanPackage}</p>
            <p><strong>Fee:</strong> AED {clientData.fee}</p>
          </div>
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => setShowInvoice(true)}
              style={styles.generateButton}
            >
              📄 Generate Invoice
            </button>
            <button 
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const invoiceData = generateInvoiceData();

  const handleExportWord = () => {
    const formattedDate = new Date(invoiceData.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const vatAmount = invoiceData.basePrice * 0.05;
    const totalPrice = invoiceData.basePrice + vatAmount;
    
    const invoiceHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Tax Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; width: 800px; margin: auto; padding: 40px; }
            h1 { text-align: center; text-decoration: underline; }
            .invoice-info { text-align: left; margin-bottom: 10px; }
            .ref-info { text-align: right; margin-bottom: 30px; }
            .customer-info { text-align: left; margin-bottom: 30px; }
            .subject { font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; }
            th { text-align: center; background-color: #f2f2f2; }
            td { text-align: left; vertical-align: top; }
            .empty-cell { border: none; }
            .total-label { border: 1px solid #000; text-align: center; background-color: #f2f2f2; font-weight: bold; }
            .total-value { border: 1px solid #000; text-align: center; font-weight: bold; font-size: 1.1em; }
            .footer { margin-top: 50px; }
          </style>
        </head>
        <body>
          <h1>Tax Invoice</h1>
          <div class="invoice-info">
            <p>Date: ${formattedDate}</p>
          </div>
          <div class="ref-info">
            <p>Ref: ${invoiceData.ref}</p>
            <p>TRN#: أدخل رقمك الضريبي الثابت هنا</p>
          </div>
          <div class="customer-info">
            <p>${invoiceData.customer.name}</p>
            <p>${invoiceData.customer.addressLine1}</p>
            <p>${invoiceData.customer.addressLine2}</p>
          </div>
          <p class="subject">SUB: ${invoiceData.service.subject}</p>
          <p>Dear Sir,</p>
          <p>Thank you for subscribing to the monthly car wash service.</p>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; vertical-align: middle;">1</td>
                <td>
                  Name: ${invoiceData.customer.name}<br/>
                  Package ID: ${invoiceData.service.packageId}<br/>
                  Vehicle: ${invoiceData.service.vehicleType}<br/>
                  Start: ${invoiceData.service.startDate}<br/>
                  End: ${invoiceData.service.endDate}
                </td>
                <td style="text-align: center; vertical-align: middle;">${invoiceData.service.duration}</td>
                <td style="text-align: center; vertical-align: middle;">${invoiceData.basePrice} + 5% VAT</td>
              </tr>
              <tr>
                <td class="empty-cell"></td>
                <td class="empty-cell"></td>
                <td class="total-label">TOTAL:</td>
                <td class="total-value">AED ${totalPrice.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <h3>General Conditions:</h3>
            <p>Terms: Payments are to be made in advance at the beginning of each month</p>
            <p style="margin-top: 20px;">Best Regards,</p>
            <p>GLOGO car wash</p>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoiceData.ref}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.invoiceModal} onClick={e => e.stopPropagation()}>
        <div style={styles.invoiceActions}>
          <button onClick={handlePrint} style={styles.printButton}>
            🖨️ Print Invoice
          </button>
          <button onClick={handleExportWord} style={styles.wordButton}>
            📄 Export Word
          </button>
          <button onClick={() => setShowInvoice(false)} style={styles.backButton}>
            ← Back
          </button>
          <button onClick={onClose} style={styles.closeButton}>
            ✕ Close
          </button>
        </div>
        <Invoice invoiceData={invoiceData} />
      </div>
    </div>
  );
};

// ====================================================================
// 3. الأنماط (CSS) لجعل الشكل مشابه للملف الأصلي
// Styles (CSS-in-JS)
// ====================================================================

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '2rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    minWidth: '400px',
    maxWidth: '500px'
  },
  invoiceModal: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '1rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  clientPreview: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  generateButton: {
    background: 'linear-gradient(135deg, #548235 0%, #6a9c3d 100%)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(84, 130, 53, 0.3)'
  },
  cancelButton: {
    background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)'
  },
  invoiceActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #eee'
  },
  printButton: {
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
  },
  wordButton: {
    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
  },
  backButton: {
    background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)'
  },
  closeButton: {
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
  },
  invoiceContainer: {
    fontFamily: 'Arial, sans-serif',
    width: '800px',
    margin: 'auto',
    padding: '40px',
    border: '1px solid #eee',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
    backgroundColor: 'white'
  },
  header: {
    textAlign: 'center',
    textDecoration: 'underline'
  },
  invoiceInfo: {
    textAlign: 'left',
    marginBottom: '10px'
  },
  refInfo: {
    textAlign: 'right',
    marginBottom: '30px'
  },
  customerInfo: {
    textAlign: 'left',
    marginBottom: '30px'
  },
  subject: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  th: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'center',
    backgroundColor: '#f2f2f2'
  },
  td: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'left',
    verticalAlign: 'top'
  },
  emptyCell: {
    border: 'none',
    padding: '8px'
  },
  totalLabelCell: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'center',
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold'
  },
  totalValueCell: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.1em'
  },
  footer: {
    marginTop: '50px'
  }
};

export default InvoiceGenerator;