'use client';

import { useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { X, Camera, Upload } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);

    try {
      // Scan the image for barcode
      const html5QrCode = new Html5Qrcode('barcode-reader');
      const result = await html5QrCode.scanFile(file, true);
      
      console.log('Barcode detected:', result);
      onScanSuccess(result);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error scanning barcode:', error);
      alert('Could not detect barcode in image. Please try again with better lighting or a clearer photo.');
      setPreviewUrl(null);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-4 border-darkgray max-w-md w-full shadow-pixel">
        {/* Header */}
        <div className="bg-primary border-b-4 border-darkgray p-4 flex justify-between items-center">
          <h2 className="heading-pixel text-xl">Scan Barcode</h2>
          <button
            onClick={onClose}
            className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Preview or Instructions */}
          {previewUrl ? (
            <div className="mb-4">
              <img 
                src={previewUrl} 
                alt="Barcode preview" 
                className="w-full border-2 border-darkgray"
              />
              {scanning && (
                <p className="text-center font-mono text-sm mt-2">
                  Scanning barcode...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-darkgray mb-4">
              <Camera size={48} className="mx-auto mb-4 text-darkgray/50" />
              <p className="font-mono text-sm text-darkgray/70">
                Take a photo or upload an image of the barcode
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
              variant="primary"
              className="w-full"
            >
              <Camera size={20} className="inline mr-2" />
              {scanning ? 'Processing...' : 'Take Photo'}
            </Button>
            
            <Button
              onClick={() => uploadInputRef.current?.click()}
              disabled={scanning}
              variant="secondary"
              className="w-full"
            >
              <Upload size={20} className="inline mr-2" />
              Upload from Gallery
            </Button>
            
            <p className="text-pixel-xs text-darkgray/60 text-center mt-2">
              On desktop: Both options open file picker<br/>
              On mobile: "Take Photo" opens camera
            </p>
          </div>
          
          {/* Hidden div for barcode scanning */}
          <div id="barcode-reader" className="hidden" />
        </div>
      </div>
    </div>
  );
}