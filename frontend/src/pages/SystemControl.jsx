import React, { useEffect, useState, useContext } from 'react';
import './SystemControl.css';
import SystemContext from '../SystemContext';

function SystemControl() {
  const {
    isSystemOn,
    toggleSystem,
    deviceCount,
    // [NEW or MODIFIED CODE for LED slider logic]
    ledBrightness,
    updateLedBrightness,
    areLEDsOn
  } = useContext(SystemContext);

  const [shapes, setShapes] = useState([]);

  useEffect(() => {
    const generatedShapes = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      left: Math.random() * 90,
      size: Math.random() * 30 + 20,
      color: `rgba(${Math.floor(Math.random() * 255)},
                          ${Math.floor(Math.random() * 255)},
                          ${Math.floor(Math.random() * 255)}, 0.7)`,
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 2,
    }));
    setShapes(generatedShapes);
  }, []);

  const handleSliderChange = (e) => {
    updateLedBrightness(e.target.value);
  };

  return (
    <div className="system-control-container">
      {/* Falling Shapes Background */}
      <div className="animated-background">
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className={`shape ${shape.shape}`}
            style={{
              left: `${shape.left}%`,
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              backgroundColor:
                shape.shape === 'triangle' ? 'transparent' : shape.color,
              animationDuration: `${shape.duration}s`,
              animationDelay: `${shape.delay}s`,
            }}
          >
            {shape.shape === 'triangle' && (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${shape.size / 2}px solid transparent`,
                  borderRight: `${shape.size / 2}px solid transparent`,
                  borderBottom: `${shape.size}px solid ${shape.color}`,
                }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Dashboard */}
      <div className="dashboard">
        <h1 className="title">System Control</h1>
        <div className="status-section">
          <div className="status-item">
            <h3>System Status:</h3>
            <p
              className={`status-indicator ${
                isSystemOn ? 'connected' : 'disconnected'
              }`}
            >
              {isSystemOn ? 'Connected' : 'Disconnected'}
            </p>
            <button className="control-button" onClick={toggleSystem}>
              {isSystemOn ? 'Turn Off System' : 'Turn On System'}
            </button>
          </div>

          <div className="status-item">
            <h3>Connected Devices:</h3>
            <p className="plank-count">{deviceCount}</p>
          </div>

          {/* */}

          {/* LED Brightness Slider */}
          <div className="status-item">
            <h3>LED Brightness:</h3>
            <input
              type="range"
              min="0"
              max="100"
              value={ledBrightness}
              onChange={handleSliderChange}
              disabled={!isSystemOn}
            />
            <span>{ledBrightness}</span>
          </div>

          {/* LED */}
          <div className="status-item">
            <h3>LED State:</h3>
            <p
              className={`status-indicator ${
                areLEDsOn ? 'connected' : 'disconnected'
              }`}
            >
              {areLEDsOn ? 'ON' : 'OFF'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemControl;