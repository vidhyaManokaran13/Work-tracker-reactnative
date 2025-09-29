import React, { createContext, useState } from "react";

export const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [totalTime, setTotalTime] = useState(0);     
  const [sessions, setSessions] = useState(0);        
  const [startTime, setStartTime] = useState(null);  
  const [isRunning, setIsRunning] = useState(false);  

  return (
    <TimerContext.Provider
      value={{
        totalTime,
        setTotalTime,
        sessions,
        setSessions,
        startTime,
        setStartTime,
        isRunning,
        setIsRunning,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
