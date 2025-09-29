
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const sessionsRef = collection(db, "users", user.uid, "sessions");
    const q = query(sessionsRef, orderBy("startTime", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSessions(data);
      setFiltered(data);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ms) => {
    const totalSec = Math.floor((ms || 0) / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  const formatIndianTime = (date) => {
    return date?.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const today = new Date();
  const todaySessions = sessions.filter((s) => {
    if (!s.startTime?.toDate) return false;
    const start = s.startTime.toDate();
    return (
      start.getDate() === today.getDate() &&
      start.getMonth() === today.getMonth() &&
      start.getFullYear() === today.getFullYear()
    );
  });

  const statsSessions = search.trim() ? filtered : todaySessions;

  const totalSessions = statsSessions.length;
  const totalTime = statsSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const avgTime = totalSessions > 0 ? totalTime / totalSessions : 0;

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(sessions);
      return;
    }
    const lower = text.toLowerCase();
    const results = sessions.filter((s) => {
      const start = s.startTime?.toDate?.();
      const dateStr = start
        ? start
            .toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            .toLowerCase()
        : "";
      const loc = s.location?.toLowerCase() || "";
      const ip = s.ipAddress?.toLowerCase() || "";
      return dateStr.includes(lower) || loc.includes(lower) || ip.includes(lower);
    });
    setFiltered(results);
  };

  const clearSearch = () => {
    setSearch("");
    setFiltered(sessions);
  };

  const renderItem = ({ item }) => {
    const start = item.startTime?.toDate?.();
    const end = item.endTime?.toDate?.();
    const duration = item.duration || 0;

    const dateDisplay = start
      ? start.toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Unknown date";

    const timeDisplay =
      start && end
        ? `${formatIndianTime(start)} - ${formatIndianTime(end)}`
        : start
        ? `${formatIndianTime(start)} - -`
        : "-";

    return (
      <View style={styles.entryBlock}>
        {/* Date */}
        <View style={styles.entryRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M8 2V5M16 2V5M3 9H21M4 7H20V21H4V7Z"
              stroke="#2563eb"
              strokeWidth="2"
            />
          </Svg>
          <Text style={styles.entryDate}>{dateDisplay}</Text>
        </View>

        {/* Time + Duration (grouped) */}
        <View style={styles.entryRow}>
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            style={{ marginTop: 2 }}
          >
            <Path
              d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
              stroke="#10b981"
              strokeWidth="2"
            />
            <Path d="M12 6V12L16 14" stroke="#10b981" strokeWidth="2" />
          </Svg>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.entryText}>{timeDisplay}</Text>
            <Text style={[styles.entryText, { marginTop: 2 }]}>
              Duration: {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Location + value */}
        <View style={[styles.entryRow, { marginTop: 8 }]}>
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            style={{ marginTop: 2 }}
          >
            <Path
              d="M12 21C12 21 5 13.6 5 9.5C5 6 8.1 3 12 3C15.9 3 19 6 19 9.5C19 13.6 12 21 12 21Z"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <Circle cx="12" cy="9.5" r="2.5" fill="#f59e0b" />
          </Svg>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.entryLabel}>Location</Text>
            <Text style={styles.entryValue}>{item.location || "Loading..."}</Text>
          </View>
        </View>

        {/* IP Address + value */}
        {item.ipAddress ? (
          <View style={[styles.entryRow, { marginTop: 8 }]}>
            <Svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginTop: 2 }}
            >
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
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.entryLabel}>IP Address</Text>
              <Text style={styles.entryValue}>{item.ipAddress}</Text>
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.entryFooter}>
          <Text style={styles.footerDuration}>{formatTime(duration)}</Text>
          <Text style={styles.footerLabel}>Total Time</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{totalSessions}</Text>
          <Text style={styles.statsLabel}>
            {search.trim() ? "Matched Sessions" : "Today’s Sessions"}
          </Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: "#fff" }]}>
          <Text style={[styles.statsNumber, { color: "#059669" }]}>
            {formatTime(totalTime)}
          </Text>
          <Text style={styles.statsLabel}>
            {search.trim() ? "Matched Time" : "Today’s Time"}
          </Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: "#fff" }]}>
          <Text style={[styles.statsNumber, { color: "#d97706" }]}>
            {formatTime(avgTime)}
          </Text>
          <Text style={styles.statsLabel}>
            {search.trim() ? "Avg. Matched Session" : "Avg. Session"}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchCard}>
        <View style={styles.searchHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                stroke="#6b7280"
                strokeWidth="2"
              />
              <Path d="M21 21L16.65 16.65" stroke="black" strokeWidth="2" />
            </Svg>
            <Text style={styles.searchTitle}>Search History</Text>
          </View>
          {search ? (
            <TouchableOpacity onPress={clearSearch}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6 6L18 18M6 18L18 6"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.searchSubtitle}>
          Search by date, location, or IP address
        </Text>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search your work history..."
            value={search}
            onChangeText={handleSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Time Entries */}
      <View style={styles.bigBackgroundCard}>
        <View style={styles.entriesHeader}>
          <Text style={styles.entriesHeaderText}>Time Entries</Text>
          <Text style={styles.entriesCount}>
            {search.trim()
              ? `${filtered.length} results`
              : `${filtered.length} of ${sessions.length} entries`}
          </Text>
        </View>
        {filtered.map((item, i) => (
          <View key={item.id}>
            {renderItem({ item })}
            {i < filtered.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      data={[]} // only header we use this 
      ListHeaderComponent={renderHeader}
      contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
    />
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: 12,
     
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },
  statsNumber: { fontSize: 20, fontWeight: "700", color: "#2563eb" },
  statsLabel: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  searchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  searchHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 6,
  },
  searchSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  searchBox: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  bigBackgroundCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entriesHeaderText: { fontSize: 16, fontWeight: "700", color: "#111827" },
  entriesCount: { fontSize: 12, color: "#6b7280" },

 entryBlock: {
  backgroundColor: "#fafafa", // sesstion cared background we use gray for differentiation
  borderRadius: 10,
  padding: 12,
  marginBottom: 12,
  elevation: 2, // shadow for the card
  shadowColor: "#000", 
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
},

  entryRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  entryDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "black",
    marginLeft: 6,
  },
  entryText: { color: "#374151", fontSize: 13 },
  entryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  entryValue: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  entryFooter: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  footerDuration: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  footerLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
});
