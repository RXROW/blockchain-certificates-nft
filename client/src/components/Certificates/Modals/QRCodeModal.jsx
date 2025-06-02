import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeModal = ({ showQRModal, certificate, closeQRModal, baseUrl = window.location.origin }) => {
  const qrRef = useRef(null);
  
  if (!showQRModal || !certificate) return null;
  
  // Create the public URL for the certificate
  const certificateUrl = `${baseUrl}/certificate/${certificate.id}`;
  
  // Download QR code as image
  const downloadQRCode = () => {
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      // Download PNG
      const downloadLink = document.createElement("a");
      downloadLink.download = `certificate-${certificate.id}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-violet-400">Certificate QR Code</h3>
          <button
            onClick={closeQRModal}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCodeSVG
              ref={qrRef}
              value={certificateUrl}
              size={200}
              level="H" // High error correction
              includeMargin={true}
              className="mx-auto"
            />
          </div>
          
          <p className="text-gray-300 mb-3">Scan this QR code to view and verify this certificate</p>
          
          <div className="text-sm text-gray-400 mb-4 break-all p-2 bg-gray-900 rounded">
            <span className="font-medium">URL:</span> {certificateUrl}
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={downloadQRCode}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            >
              Download QR
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(certificateUrl);
                alert("Certificate URL copied to clipboard!");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-sm text-gray-400 mb-2">
            <span className="font-semibold">Certificate ID:</span> {certificate.id}
          </p>
          <p className="text-sm text-gray-400 mb-2">
            <span className="font-semibold">Course:</span> {certificate.courseName}
          </p>
          <p className="text-sm text-gray-400">
            <span className="font-semibold">Recipient:</span> {certificate.studentName || certificate.student.substring(0, 6) + '...' + certificate.student.substring(certificate.student.length - 4)}
          </p>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={closeQRModal}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal; 