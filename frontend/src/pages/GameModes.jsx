import React, { useEffect, useState, useContext } from 'react';
import './GameModes.css';
import SystemContext from '../SystemContext';

function GameModes() {
  const [shapes, setShapes] = useState([]);
  const { selectGameMode, gameModeSelected } = useContext(SystemContext);

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

  const handleGameSelect = (game) => {
    if (gameModeSelected === game) {
      selectGameMode('');
    } else {
      selectGameMode(game);
    }
  };

  return (
    <div className="game-modes-container">
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
      <h1 className="title">Game Modes</h1>
      <p>Select a game mode to get started!</p>
      <div className="game-options">
        {/* Pathway Game */}
        <div className="game-card">
          <img
            id="Pathway-image"
            src={`${process.env.PUBLIC_URL}/Pathway.png`}
            alt="Pathway Game"
            className={`game-image ${
              gameModeSelected === 'Pathway' ? 'flash' : ''
            }`}
          />
          <h3>Pathway</h3>
          <p>Guide the child from the green node to the red node.</p>
          <button
            className={`game-select-button ${
              gameModeSelected === 'Pathway' ? 'selected' : ''
            }`}
            onClick={() => handleGameSelect('Pathway')}
          >
            {gameModeSelected === 'Pathway' ? 'Unselect Pathway' : 'Select Pathway'}
          </button>
        </div>

        {/* Up Next Game */}
        <div className="game-card">
          <img
            id="UpNext-image"
            src={`${process.env.PUBLIC_URL}/UpNext.png`}
            alt="Up Next Game"
            className={`game-image ${
              gameModeSelected === 'UpNext' ? 'flash' : ''
            }`}
          />
          <h3>Up Next</h3>
          <p>Traverse sequential red nodes that change after each turn.</p>
          <button
            className={`game-select-button ${
              gameModeSelected === 'UpNext' ? 'selected' : ''
            }`}
            onClick={() => handleGameSelect('UpNext')}
          >
            {gameModeSelected === 'UpNext' ? 'Unselect Up Next' : 'Select Up Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameModes;
