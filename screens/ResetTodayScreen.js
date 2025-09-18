import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { TimerContext } from "../context/TimerContext";

export default function ResetTodayScreen({ navigation }) {
  const { setTotalTime, setSessions } = useContext(TimerContext);

  const handleResetToday = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      "Confirm Reset",
      "Are you sure you want to delete all of today's working hours?",
      [
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
                if (data.startTime && data.startTime.toDate().toDateString() === today) {
                  await deleteDoc(doc(db, "users", user.uid, "sessions", d.id));
                }
              });

              await Promise.all(deletePromises);

              // Reset TimerContext
              setTotalTime(0);
              setSessions(0);

              // Navigate back to Home
              navigation.navigate("Home");

              Alert.alert("Reset Done", "Today's working hours have been deleted.");
            } catch (err) {
              console.log("Error resetting sessions:", err);
              Alert.alert("Error", "Could not reset today's hours.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Today's Hours</Text>
      <Text style={styles.subtitle}>
        This will permanently delete all sessions recorded today.
      </Text>

      <TouchableOpacity style={styles.resetButton} onPress={handleResetToday}>
        <Text style={styles.resetButtonText}>Reset Today</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "#e6f515ff" },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 20, textAlign: "center" },
  resetButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
