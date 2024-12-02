import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [isSystemOn, setIsSystemOn] = useState(false);
  const [areLEDsOn, setAreLEDsOn] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [gameModeSelected, setGameModeSelected] = useState('');

  useEffect(() => {
    axios
      .get('/api/board') 
      .then((response) => {
        const {
          isSystemOn,
          areLEDsOn,
          deviceCount,
          gameModeSelected,
        } = response.data;
        setIsSystemOn(isSystemOn);
        setAreLEDsOn(areLEDsOn);
        setDeviceCount(deviceCount);
        setGameModeSelected(gameModeSelected);
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

  const toggleLEDs = () => {
    if (!isSystemOn) {
      console.log('System must be on to control LEDs.');
      return;
    }
    const newLEDState = !areLEDsOn;
    setAreLEDsOn(newLEDState);
    updateBoardState({ areLEDsOn: newLEDState });
  };

  const selectGameMode = (mode) => {
    setGameModeSelected(mode);
    updateBoardState({ gameModeSelected: mode });
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
  
  // Example usage:
  const toggleLEDsOnESP32 = () => {
    sendCommandToESP32(areLEDsOn ? 'LED_OFF' : 'LED_ON');
  };

  return (
    <SystemContext.Provider
      value={{
        isSystemOn,
        toggleSystem,
        areLEDsOn,
        toggleLEDs,
        deviceCount,
        setDeviceCount,
        gameModeSelected,
        selectGameMode,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export default SystemContext;