import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [isSystemOn, setIsSystemOn] = useState(false);

  // [NEW or MODIFIED CODE for LED slider logic]
  // We keep areLEDsOn in the state so we can track DB updates,
  // but we no longer toggle it manually via a button.
  const [areLEDsOn, setAreLEDsOn] = useState(false);

  const [deviceCount, setDeviceCount] = useState(0);
  const [gameModeSelected, setGameModeSelected] = useState('');
  const [ledBrightness, setLedBrightness] = useState(0);

  useEffect(() => {
    axios
      .get('/api/board')
      .then((response) => {
        const {
          isSystemOn,
          areLEDsOn,
          deviceCount,
          gameModeSelected,
          ledBrightness
        } = response.data;

        setIsSystemOn(isSystemOn);
        setAreLEDsOn(areLEDsOn); // [NEW or MODIFIED CODE for LED slider logic]
        setDeviceCount(deviceCount);
        setGameModeSelected(gameModeSelected);

        if (ledBrightness !== undefined) {
          setLedBrightness(ledBrightness);
        }
      })
      .catch((error) => {
        console.error('Error fetching board state:', error);
      });
  }, []);

  const updateBoardState = (updatedState) => {
    axios
      .post('/api/board/update', updatedState)
      .then((response) => {
        console.log('Board state updated successfully:', response.data);
        // If response contains updated areLEDsOn or ledBrightness, update local states
        if (response.data.areLEDsOn !== undefined) {
          setAreLEDsOn(response.data.areLEDsOn);
        }
        if (response.data.ledBrightness !== undefined) {
          setLedBrightness(response.data.ledBrightness);
        }
      })
      .catch((error) => {
        console.error('Error updating board state:', error);
      });
  };

  const toggleSystem = () => {
    const newSystemState = !isSystemOn;
    setIsSystemOn(newSystemState);
    updateBoardState({ isSystemOn: newSystemState });
  };

  const selectGameMode = (mode) => {
    setGameModeSelected(mode);
    updateBoardState({ gameModeSelected: mode });
  };

  // [NEW or MODIFIED CODE for LED slider logic]
  // Whenever ledBrightness changes, we also set areLEDsOn = (brightnessValue > 0).
  const updateLedBrightness = (newBrightness) => {
    const brightnessValue = Number(newBrightness);
    setLedBrightness(brightnessValue);

    const newLEDsOn = brightnessValue > 0; // If brightness > 0 => true, else false
    setAreLEDsOn(newLEDsOn);

    // Send both fields to DB
    updateBoardState({
      ledBrightness: brightnessValue,
      areLEDsOn: newLEDsOn
    });
  };

  const sendCommandToESP32 = (command) => {
    axios
      .post('http://localhost:5000/api/board/esp', { command })
      .then((response) => {
        console.log('Command sent to ESP32:', response.data);
      })
      .catch((error) => {
        console.error('Error sending command to ESP32:', error);
      });
  };

  return (
    <SystemContext.Provider
      value={{
        isSystemOn,
        toggleSystem,
        deviceCount,
        setDeviceCount,
        gameModeSelected,
        selectGameMode,
        // [NEW or MODIFIED CODE for LED slider logic]
        ledBrightness,
        areLEDsOn,
        updateLedBrightness
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export default SystemContext;