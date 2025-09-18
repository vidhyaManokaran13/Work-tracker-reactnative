// context/TimerContext.js
import React, { createContext, useState } from "react";

export const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [totalTime, setTotalTime] = useState(0);      // total ms today
  const [sessions, setSessions] = useState(0);        // count of sessions
  const [startTime, setStartTime] = useState(null);   // current start time
  const [isRunning, setIsRunning] = useState(false);  // running flag

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
