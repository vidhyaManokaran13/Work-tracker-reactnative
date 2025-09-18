import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { auth, db } from "./firebase";
import {
  doc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

import HomeScreen from "./screens/HomeScreen";
import SignInScreen from "./screens/SignInScreen";
import SignUpScreen from "./screens/SignUpScreen";
import HistoryScreen from "./screens/HistoryScreen";
import { TimerProvider, TimerContext } from "./context/TimerContext";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Navigation ref for logout
export const navigationRef = createNavigationContainerRef();

// ✅ SVG ICON COMPONENTS
const DashboardIcon = ({ size = 22, color = "#111827" }) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
  </Svg>
);

const HistoryIcon = ({ size = 22, color = "#111827" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12a9 9 0 1 0 3-7M3 3v6h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 7v5l4 2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ResetIcon = ({ size = 22, color = "#dc2626" }) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M21 12a9 9 0 1 1-3-6.7L21 8m0-5v5h-5" />
  </Svg>
);

const LogoutIcon = ({ size = 22, color = "#dc2626" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
);

// Dashboard Header
function DashboardHeader({ userName }) {
  return (
    <View style={styles.headerContainer}>
      <Svg width="40" height="40" viewBox="0 0 70 70" fill="none">
        <Rect width="70" height="70" rx="20" fill="url(#gradHistory)" />
        <Path
          d="M35 20a14 14 0 100 28 14 14 0 000-28zm1 7v6l4 3"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Defs>
          <LinearGradient id="gradHistory" x1="0" y1="0" x2="70" y2="70">
            <Stop stopColor="#2563eb" />
            <Stop offset="1" stopColor="#007BFF" />
          </LinearGradient>
        </Defs>
      </Svg>
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.headerTitle}>Work Tracker</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {userName || "..."}
        </Text>
      </View>
    </View>
  );
}

// History Header
function HistoryHeader() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="40" height="40" viewBox="0 0 70 70" fill="none">
        <Rect width="70" height="70" rx="20" fill="url(#gradHistory)" />
        <Path
          d="M35 20a14 14 0 100 28 14 14 0 000-28zm1 7v6l4 3"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Defs>
          <LinearGradient id="gradHistory" x1="0" y1="0" x2="70" y2="70">
            <Stop stopColor="#2563eb" />
            <Stop offset="1" stopColor="#007BFF" />
          </LinearGradient>
        </Defs>
      </Svg>
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.headerTitle}>Work History</Text>
        <Text style={styles.headerSubtitle}>
          View your time tracking records
        </Text>
      </View>
    </View>
  );
}

// Custom Drawer
function CustomDrawerContent(props) {
  const { state, navigation } = props;
  const currentRoute = state.routeNames[state.index];
  const { setTotalTime, setSessions } = useContext(TimerContext);

  // Reset Today logic
  const handleResetToday = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert("Confirm Reset", "Delete all of today's working hours?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Reset",
        style: "destructive",
        onPress: async () => {
          try {
            const sessionsRef = collection(db, "users", user.uid, "sessions");
            const snap = await getDocs(sessionsRef);
            const today = new Date().toDateString();

            const deletePromises = snap.docs.map(async (d) => {
              const data = d.data();
              if (
                data.startTime &&
                data.startTime.toDate().toDateString() === today
              ) {
                await deleteDoc(doc(db, "users", user.uid, "sessions", d.id));
              }
            });

            await Promise.all(deletePromises);

            setTotalTime(0);
            setSessions(0);

            Alert.alert("Reset Done", "Today's working hours deleted.");
          } catch (err) {
            console.log("Error resetting sessions:", err);
            Alert.alert("Error", "Could not reset today's hours.");
          }
        },
      },
    ]);
  };

  // Logout logic
  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            navigationRef.reset({ index: 0, routes: [{ name: "SignIn" }] });
          } catch (err) {
            console.log("Error logging out:", err);
          }
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, justifyContent: "space-between" }}
    >
      <View>
        <Text style={styles.menuHeader}>Menu</Text>

        {/* ✅ Only show subtitle when on Dashboard */}
        {currentRoute === "Home" && (
          <Text style={styles.menuSub}>Track your work sessions easily</Text>
        )}

        {currentRoute !== "Home" && (
          <DrawerItem
            label="Dashboard"
            icon={() => <DashboardIcon />}
            onPress={() => navigation.navigate("Home")}
          />
        )}

        <DrawerItem
          label={currentRoute === "History" ? "History" : "View History"}
          icon={() => <HistoryIcon />}
          onPress={() => navigation.navigate("History")}
        />

       <DrawerItem
  label={() => (
    <Text style={{ color: "#fbbf24", fontWeight: "600" }}>Reset Today's Hours</Text>
  )}
  icon={() => <ResetIcon color="#fbbf24" />}
  onPress={handleResetToday}
/>

<DrawerItem
  label={() => (
    <Text style={{ color: "#dc2626", fontWeight: "600" }}>Logout</Text>
  )}
  icon={() => <LogoutIcon color="#dc2626" />}
  onPress={handleLogout}
/>

      </View>
    </DrawerContentScrollView>
  );
}

// Drawer Navigator
function AppDrawer({ userName }) {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#000",
        drawerActiveTintColor: "#2563eb",
        drawerInactiveTintColor: "#374151",
        drawerStyle: { backgroundColor: "#fff", width: 260 },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <DashboardHeader userName={userName} />,
          drawerLabel: "Dashboard",
        }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerTitle: () => <HistoryHeader />,
          drawerLabel: "History",
        }}
      />
    </Drawer.Navigator>
  );
}

// Main App
export default function App() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
      if (userDoc.exists()) {
        setUserName(userDoc.data().fullName || "");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <TimerProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="SignUp"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="AppDrawer">
            {(props) => <AppDrawer {...props} userName={userName} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </TimerProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6b7280" },
  menuHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    marginLeft: 16,
    color: "#111827",
  },
  menuSub: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 16,
    marginBottom: 8,
  },
});
