import React, { useState } from "react";

const CameraStream = ({ rtspUrl, showCanvas = false, onCanvasClick }) => {
  const imgRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const mjpegUrl = `http://localhost:3000/stream?url=${encodeURIComponent(rtspUrl)}`;

  // Update dimensions when container or image changes
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && imgRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
        
        if (canvasRef.current) {
          canvasRef.current.width = containerRef.current.clientWidth;
          canvasRef.current.height = containerRef.current.clientHeight;
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [imgRef.current]);

  const handleClick = (e) => {
    if (!onCanvasClick || !imgRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate natural coordinates based on image dimensions
    const naturalX = (x / rect.width) * imgRef.current.naturalWidth;
    const naturalY = (y / rect.height) * imgRef.current.naturalHeight;

    // Draw the point on canvas
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    onCanvasClick({
      screenX: x,
      screenY: y,
      naturalX: naturalX,
      naturalY: naturalY
    });
  };

  return (
    <div 
      ref={containerRef}
      className="camera-container" 
      style={{ 
        position: "relative",
        width: "100%",
        maxWidth: "640px",
        margin: "0 auto"
      }}
    >
      <img
        ref={imgRef}
        src={mjpegUrl}
        alt="Camera feed"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          background: "#000",
        }}
      />

      {showCanvas && (
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            cursor: "crosshair",
            pointerEvents: 'auto'
          }}
        />
      )}
    </div>
  );
};

export default CameraStream;
