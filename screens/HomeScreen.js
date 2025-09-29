//it fetch local location corecty humand readble form no api need only package fetched


import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { TimerContext } from "../context/TimerContext";
import Svg, { Path, Circle } from "react-native-svg";
import Geolocation from "@react-native-community/geolocation";

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [location, setLocation] = useState("Fetching...");
  const [ipAddress, setIpAddress] = useState("Fetching...");
  const [loadingAddress, setLoadingAddress] = useState(false);

  const { totalTime, setTotalTime, sessions, setSessions } =
    useContext(TimerContext);

  const intervalRef = useRef(null);

  // it will aske location permition 
  async function requestLocationPermission() {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Work Tracker Location Permission",
            message:
              "Work Tracker needs access to your location to track work sessions.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  // Fetch location and address of code 
  const fetchLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocation("Permission denied");
      return;
    }

    setLoadingAddress(true);

    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // it get the latitude and longtitude 
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        // Fetch the address from geolocation
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "User-Agent": "ReactNativeApp",
                "Accept-Language": "en",
              },
            }
          );
          const data = await response.json();
          if (data.display_name) setLocation(data.display_name);
        } catch (err) {
          console.log("Reverse geocoding error:", err);
        } finally {
          setLoadingAddress(false);
        }
      },
      (error) => {
        console.log("Location error:", error);
        setLocation("Unavailable");
        setLoadingAddress(false);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
    );
  };

  // Fetch IP address fetching 
  const fetchIpAddress = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setIpAddress(data.ip);
    } catch {
      setIpAddress("Unavailable");
    }
  };

  // fetch the username and location from the auth and firestore
  useEffect(() => {
    const fetchUserAndSessions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserName(userDoc.data().fullName);

        const q = query(
          collection(db, "users", user.uid, "sessions"),
          orderBy("startTime", "asc")
        );
        const sessionsSnap = await getDocs(q);

        let total = 0;
        let count = 0;
        const today = new Date();
        sessionsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const start = data.startTime?.toDate();
          if (
            start &&
            start.getDate() === today.getDate() &&
            start.getMonth() === today.getMonth() &&
            start.getFullYear() === today.getFullYear()
          ) {
            total += data.duration || 0;
            count += 1;
          }
        });

        setTotalTime(total);
        setSessions(count);
        global.lastDay = today.toDateString();
      } catch (err) {
        console.log("Error fetching user/sessions:", err);
      }
    };

    fetchUserAndSessions();
    fetchIpAddress();
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedStart = await AsyncStorage.getItem("currentSessionStart");
      if (storedStart) {
        const start = new Date(storedStart);
        setStartTime(start);
        setIsRunning(true);
      }
    } catch (err) {
      console.log("Failed to restore session:", err);
    }
  };

  // Timer logic for count the time
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime.getTime());
      }, 1000);
    } else clearInterval(intervalRef.current);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, startTime]);

  // after midnight the timer will reset 0 
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const today = new Date().toDateString();
      if (global.lastDay && global.lastDay !== today) {
        setTotalTime(0);
        setSessions(0);
        setElapsed(0);
        setStartTime(null);
        setIsRunning(false);
        AsyncStorage.removeItem("currentSessionStart");
        global.lastDay = today;
      }
    }, 60000);

    return () => clearInterval(checkMidnight);
  }, []);

  const formatTime = (timeMs) => {
    const totalSec = Math.floor(timeMs / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleStartStop = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (isRunning) {
      // stop session it will stop the session and save the data to firestore 
      const sessionDuration = Date.now() - startTime.getTime();
      const endTime = new Date();

      setIsRunning(false);
      setTotalTime((prev) => prev + sessionDuration);
      setElapsed(0);
      setSessions((prev) => prev + 1);
      setStartTime(null);
      await AsyncStorage.removeItem("currentSessionStart");

      try {
        await addDoc(collection(db, "users", user.uid, "sessions"), {
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          duration: sessionDuration,
          ipAddress,
          location,
          createdAt: Timestamp.now(),
        });
      } catch (err) {
        console.log("Error saving session:", err);
        Alert.alert("Error", "Failed to save session. Please try again.");
      }
    } else {
      // start the session it will start the session and save the start time to asyncstorage
      const now = new Date();
      setStartTime(now);
      setIsRunning(true);
      await AsyncStorage.setItem("currentSessionStart", now.toISOString());

      // Fetch location once at start the time 
      fetchLocation();
      fetchIpAddress();
    }
  };

  const displayTime = isRunning ? totalTime + elapsed : totalTime;

  return (
    <ScrollView style={styles.container}>
      {/* Current Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <Path d="M12 6V12L16 14" stroke="#2563eb" strokeWidth="2" />
          </Svg>
          <Text style={styles.cardTitle}> Current Status</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          {isRunning
            ? "You are currently clocked in"
            : "Ready to start your work day"}
        </Text>

        <Text style={styles.timer}>{formatTime(displayTime)}</Text>
        <Text style={styles.totalText}>
          Total time worked today {isRunning ? "(including current session)" : ""}
        </Text>
        <Text style={styles.sessionsText}>
          {sessions} session(s) completed today
        </Text>

        <TouchableOpacity
          style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
          onPress={handleStartStop}
        >
          {isRunning ? (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              <Path d="M9 9H15V15H9z" fill="white" />
            </Svg>
          ) : (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              <Path d="M10 8L16 12L10 16V8Z" fill="white" />
            </Svg>
          )}
          <Text style={styles.buttonText}>{isRunning ? "Stop Work" : "Start Work"}</Text>
        </TouchableOpacity>
      </View>

      {/* Current Session Details */}
      {isRunning && startTime && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Session Details</Text>

          {/* Work Started */}
          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                <Path d="M12 6V12L16 14" stroke="#2563eb" strokeWidth="2" />
              </Svg>
              <Text style={styles.detailLabel}>Work Started At</Text>
            </View>
            <Text style={styles.detailValue}>
              {startTime.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 21C12 21 5 13.6 5 9.5C5 6 8.1 3 12 3C15.9 3 19 6 19 9.5C19 13.6 12 21 12 21Z"
                  stroke="green"
                  strokeWidth="2"
                />
                <Circle cx="12" cy="9.5" r="2.5" fill="green" />
              </Svg>
              <Text style={styles.detailLabel}>Location</Text>
            </View>
            {loadingAddress ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.detailValue}>{location}</Text>
            )}
          </View>

          {/* IP Address */}
          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2Z"
                  stroke="orange"
                  strokeWidth="2"
                />
                <Path
                  d="M2 12H22M12 2C14.5 6.5 14.5 17.5 12 22C9.5 17.5 9.5 6.5 12 2Z"
                  stroke="orange"
                  strokeWidth="2"
                />
              </Svg>
              <Text style={styles.detailLabel}>IP Address</Text>
            </View>
            <Text style={styles.detailValue}>{ipAddress}</Text>
          </View>
        </View>
      )}

      {/* Today’s Overview */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today’s Overview</Text>
        <View style={styles.overviewContainer}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewCol}>
              <Text style={[styles.overviewValue, { color: "#2563eb" }]}>
                {formatTime(displayTime)}
              </Text>
              <Text style={styles.overviewLabel}>Today’s Total</Text>
            </View>

            <View style={styles.overviewCol}>
              <Text
                style={[
                  styles.overviewValue,
                  { color: location.includes("Unavailable") ? "red" : "green" },
                ]}
              >
                {location.includes("Unavailable") ? "✘" : "✔"}
              </Text>
              <Text style={styles.overviewLabel}>Location</Text>
            </View>
          </View>

          <View style={styles.overviewRow}>
            <View style={styles.overviewCol}>
              <Text
                style={[
                  styles.overviewValue,
                  { color: isRunning ? "orange" : "orange" },
                ]}
              >
                {isRunning ? "Active" : "Inactive"}
              </Text>
              <Text style={styles.overviewLabel}>Status</Text>
            </View>

            <View style={styles.overviewCol}>
              <Text style={styles.overviewValue}>{sessions}</Text>
              <Text style={styles.overviewLabel}>Total Sessions</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E7EEFA", padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  appTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", marginLeft: 12 },
  subtitle: { fontSize: 16, color: "#6b7280", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginVertical: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  timer: { fontSize: 36, fontWeight: "bold", color: "#2563eb", textAlign: "center" },
  totalText: { fontSize: 14, color: "#374151", textAlign: "center", marginTop: 4 },
  sessionsText: { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 12 },
  button: { flexDirection: "row", justifyContent: "center", alignItems: "center", borderRadius: 8, paddingVertical: 12, marginTop: 10 },
  startButton: { backgroundColor: "#2563eb" },
  stopButton: { backgroundColor: "#dc2626" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#111827" },
  detailBlock: { marginVertical: 8 },
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailLabel: { fontSize: 14, fontWeight: "bold", color: "#111827", marginLeft: 8 },
  detailValue: { fontSize: 13, color: "#6b7280", marginLeft: 26, marginTop: 2 },
  overviewContainer: { marginTop: 8 },
  overviewRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  overviewCol: { flex: 0.48, alignItems: "center" },
  overviewValue: { fontSize: 20, fontWeight: "bold" },
  overviewLabel: { fontSize: 14, color: "#6b7280" },
  logo: { backgroundColor: "#2563eb", borderRadius: 20, padding: 10, marginBottom: 10 },
});


