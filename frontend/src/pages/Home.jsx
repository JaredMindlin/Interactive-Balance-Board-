import React, { useEffect, useState, useContext } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import SystemContext from '../SystemContext';

function Home() {
  const {
    isSystemOn,
    toggleSystem,
    gameModeSelected,
    selectGameMode,
  } = useContext(SystemContext);
  const [shapes, setShapes] = useState([]);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

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

  const handleStartGame = () => {
    if (isSystemOn) {
      if (gameModeSelected) {
        navigate('/game-modes');
        setNotification(`Starting ${gameModeSelected} game...`);
      } 
    } 
    else {
      setNotification('Please turn on the system first!');
    }
  };

  const handleSystemControl = () => {
    navigate('/system-control');
    setNotification('Navigating to System Control...');
  };

  return (
    <div className="home-container">
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
      <h1 className="title">Welcome to Montessori++</h1>

      {notification && <p className="notification">{notification}</p>}

      <div className="button-group">
        <button className="home-button" onClick={handleStartGame}>
          Start Game
        </button>
        <button
          className={`home-button ${isSystemOn ? 'active' : ''}`}
          onClick={toggleSystem}
        >
          {isSystemOn ? 'Turn Off System' : 'Turn On System'}
        </button>
        <button className="home-button" onClick={handleSystemControl}>
          System Control
        </button>
      </div>
    </div>
  );
}

export default Home;
