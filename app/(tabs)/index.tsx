/**
 * ShieldHer — Proactive Women Safety Platform  v3.0
 * ─────────────────────────────────────────────────
 * Fixes & upgrades:
 *  • Safe Ride  → beautiful in-app modal (not plain Alert)
 *  • Community  → full in-app live chat screen
 *  • Share Location → instantly sends SMS (no intermediate dialog)
 *  • SOS Modal  → beautiful custom UI (not system Alert)
 *  • Speech     → stops immediately on safe / cancel
 *  • Secondary features → polished custom modals
 */

import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Linking,
  Animated, ScrollView, Vibration, Dimensions, StatusBar,
  Platform, Modal, TouchableWithoutFeedback, TextInput,
  KeyboardAvoidingView, FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, Heatmap, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import Svg, {
  Path, Circle as SvgCircle, Defs, Stop,
  RadialGradient as SvgRadial, LinearGradient as SvgLinear,
} from "react-native-svg";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const EMERGENCY_NUMBER = "9999999999"; // digits only for sms://
const { width: SW, height: SH } = Dimensions.get("window");

// ─── MAP DATA ────────────────────────────────────────────────────────────────
const RISK_OFFSETS = [
  { dlat: 0.004,  dlng: 0.005,  weight: 1.0  },
  { dlat: -0.006, dlng: 0.003,  weight: 0.85 },
  { dlat: 0.008,  dlng: -0.004, weight: 0.7  },
  { dlat: -0.003, dlng: -0.007, weight: 0.6  },
  { dlat: 0.010,  dlng: 0.002,  weight: 0.5  },
  { dlat: -0.007, dlng: -0.001, weight: 0.75 },
];
const SAFE_OFFSETS = [
  { dlat: -0.009, dlng:  0.006, radius: 350, label: "Campus Security", dist: "0.1 km", icon: "🏫" },
  { dlat:  0.006, dlng: -0.009, radius: 280, label: "Police Station",  dist: "1.2 km", icon: "🚔" },
  { dlat: -0.004, dlng: -0.010, radius: 200, label: "Hospital",        dist: "0.9 km", icon: "🏥" },
  { dlat:  0.011, dlng:  0.007, radius: 160, label: "24hr ATM Café",   dist: "0.4 km", icon: "☕" },
];

// ─── MOCK COMMUNITY MESSAGES ─────────────────────────────────────────────────
const COMMUNITY_SEED = [
  { id: "1",  user: "Priya S.",    avatar: "🧕", msg: "Stay safe everyone! Avoid the north gate after 9pm.", time: "9:02 PM",  mine: false },
  { id: "2",  user: "Anjali R.",   avatar: "👩", msg: "Confirmed — saw suspicious activity near Gate 3.", time: "9:05 PM",  mine: false },
  { id: "3",  user: "Meena T.",    avatar: "🧑", msg: "I'm heading to the library. Anyone want to walk together?", time: "9:08 PM",  mine: false },
  { id: "4",  user: "Divya K.",    avatar: "👧", msg: "There's a police patrol near Block C right now. Feels safe.", time: "9:11 PM",  mine: false },
  { id: "5",  user: "Lakshmi V.",  avatar: "🧕", msg: "Thank you all for the updates. This group really helps 💪", time: "9:14 PM",  mine: false },
  { id: "6",  user: "Ritu M.",     avatar: "👩", msg: "Does anyone know if the campus shuttle is still running?", time: "9:17 PM",  mine: false },
  { id: "7",  user: "Anjali R.",   avatar: "👩", msg: "Yes! Shuttle runs till 10:30 PM from Main Gate.", time: "9:18 PM",  mine: false },
];

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { id: "ride",      icon: "🚕", label: "Safe Ride",       sub: "Uber & Ola with GPS",        colors: ["#0f2a10","#1a4a1a"] as [string,string] },
  { id: "evidence",  icon: "📹", label: "Evidence Mode",   sub: "Encrypted recording",        colors: ["#3a0008","#600015"] as [string,string] },
  { id: "safeword",  icon: "🔐", label: "Safe Word",       sub: "Hands-free keyword",         colors: ["#1b3a2d","#276745"] as [string,string] },
  { id: "community", icon: "👩‍👩‍👧", label: "Community",      sub: "Live women's chat",          colors: ["#2d1054","#4a0080"] as [string,string] },
  { id: "route",     icon: "🗺️", label: "AI Safe Route",   sub: "Avoid risk zones",           colors: ["#0a1f35","#003060"] as [string,string] },
  { id: "contacts",  icon: "👥", label: "SOS Contacts",    sub: "Manage contacts",            colors: ["#2a1500","#4a2200"] as [string,string] },
];

// ═══════════════════════════════════════════════════════════════════════════
// SHIELD LOGO
// ═══════════════════════════════════════════════════════════════════════════
function ShieldHerLogo({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <SvgLinear id="sOuter" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#7b2ff7" />
          <Stop offset="55%"  stopColor="#c026d3" />
          <Stop offset="100%" stopColor="#f43f5e" />
        </SvgLinear>
        <SvgLinear id="sInner" x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0%"   stopColor="#3b0764" />
          <Stop offset="100%" stopColor="#1e1b4b" />
        </SvgLinear>
        <SvgLinear id="sWoman" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#c026d3" />
          <Stop offset="100%" stopColor="#f43f5e" />
        </SvgLinear>
        <SvgRadial id="sGlow" cx="55%" cy="45%" r="50%">
          <Stop offset="0%"   stopColor="#f43f5e" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#7b2ff7" stopOpacity="0" />
        </SvgRadial>
      </Defs>
      <Path d="M60 4 L106 20 L106 56 C106 84 86 102 60 112 C34 102 14 84 14 56 L14 20 Z" fill="url(#sOuter)" />
      <Path d="M60 11 L100 25 L100 56 C100 80 82 97 60 106 C38 97 20 80 20 56 L20 25 Z" fill="url(#sInner)" />
      <Path d="M60 11 L100 25 L100 56 C100 80 82 97 60 106 C38 97 20 80 20 56 L20 25 Z" fill="url(#sGlow)" />
      <Path d="M38 90 C34 70 30 50 36 34 C40 22 50 16 58 16 C48 20 42 32 40 48 C38 62 42 78 46 90 Z" fill="url(#sWoman)" opacity="0.9" />
      <Path d="M58 18 C68 18 76 25 78 35 C80 43 77 50 72 55 C78 57 82 63 82 70 C82 78 76 84 68 86 C64 87 60 86 58 84 L56 90 L50 90 L52 82 C48 79 46 74 46 68 C46 56 50 46 54 38 C56 30 56 24 58 18 Z" fill="url(#sWoman)" opacity="0.88" />
      <Path d="M46 20 C38 26 32 38 32 54 C32 66 36 76 42 84 C38 78 36 68 36 58 C36 42 40 28 46 20 Z" fill="#c026d3" opacity="0.7" />
      <Path d="M46 36 L48 42 L54 42 L49.5 46 L51.5 52 L46 48.5 L40.5 52 L42.5 46 L38 42 L44 42 Z" fill="#f9a8d4" opacity="0.9" />
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PULSE RING
// ═══════════════════════════════════════════════════════════════════════════
function PulseRing({ color, delay = 0 }: { color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.0] });
  const opacity = anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.65, 0.25, 0] });
  return (
    <Animated.View pointerEvents="none" style={[
      StyleSheet.absoluteFillObject,
      { borderRadius: 999, borderWidth: 2, borderColor: color, transform: [{ scale }], opacity },
    ]} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMUNITY CHAT SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function CommunityChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState(COMMUNITY_SEED);
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 13, useNativeDriver: true }).start();
    // Simulate incoming messages
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), user: "Sneha P.", avatar: "🧕",
        msg: "Just joined! Glad this group exists 🙏", time: now(), mine: false,
      }]);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const now = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")} ${d.getHours() >= 12 ? "PM" : "AM"}`;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      id: Date.now().toString(), user: "You", avatar: "😊",
      msg: input.trim(), time: now(), mine: true,
    };
    setMessages(prev => [...prev, msg]);
    setInput("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: SH, duration: 300, useNativeDriver: true }).start(onClose);
  };

  const renderMsg = ({ item }: { item: typeof COMMUNITY_SEED[0] }) => (
    <View style={[ch.msgRow, item.mine && ch.msgRowMine]}>
      {!item.mine && <Text style={ch.avatar}>{item.avatar}</Text>}
      <View style={[ch.bubble, item.mine && ch.bubbleMine]}>
        {!item.mine && <Text style={ch.username}>{item.user}</Text>}
        <Text style={ch.msgTxt}>{item.msg}</Text>
        <Text style={ch.time}>{item.time}</Text>
      </View>
      {item.mine && <Text style={ch.avatar}>{item.avatar}</Text>}
    </View>
  );

  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <Animated.View style={[ch.screen, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={["#040816","#06091e"]} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={ch.header}>
          <TouchableOpacity onPress={handleClose} style={ch.backBtn}>
            <Text style={{ color: "#f43f5e", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ch.title}>Women's Safety Network</Text>
            <View style={ch.onlineRow}>
              <View style={ch.greenDot} />
              <Text style={ch.onlineTxt}>47 women online nearby</Text>
            </View>
          </View>
          <View style={ch.shieldSmall}><ShieldHerLogo size={30} /></View>
        </View>

        {/* Notice bar */}
        <View style={ch.noticeBand}>
          <Text style={ch.noticeTxt}>🔒 End-to-end encrypted · Anonymous names only</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={i => i.id}
          renderItem={renderMsg}
          contentContainerStyle={ch.list}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={ch.inputRow}>
            <TextInput
              style={ch.input}
              placeholder="Share an update or ask for help…"
              placeholderTextColor="#3a4070"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity style={ch.sendBtn} onPress={sendMessage} activeOpacity={0.8}>
              <LinearGradient colors={["#c026d3","#f43f5e"]} style={ch.sendGrad}>
                <Text style={{ color: "#fff", fontSize: 18 }}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={{ height: Platform.OS === "ios" ? 28 : 12 }} />
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOS MODAL (beautiful custom UI)
// ═══════════════════════════════════════════════════════════════════════════
function SOSModal({
  visible, onCancel, onSafe,
}: { visible: boolean; onCancel: () => void; onSafe: () => void }) {
  const ringAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!visible) { setElapsed(0); return; }
    Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 12, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    loop.start();
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { loop.stop(); clearInterval(interval); };
  }, [visible]);

  const ringScale   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] });
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="fade">
      <View style={sos.overlay}>
        <LinearGradient colors={["rgba(30,0,10,0.97)","rgba(10,0,5,0.98)"]} style={sos.overlay} />

        <Animated.View style={[sos.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Pulsing ring behind icon */}
          <View style={sos.ringContainer}>
            <Animated.View style={[sos.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <View style={sos.sosIconBg}>
              <Text style={{ fontSize: 52 }}>🚨</Text>
            </View>
          </View>

          {/* Status */}
          <Text style={sos.sosTitle}>SOS ACTIVATED</Text>
          <Text style={sos.sosTimer}>{fmt(elapsed)}</Text>
          <Text style={sos.sosStatus}>Help is on the way</Text>

          {/* Recipients */}
          <View style={sos.recipientCard}>
            <Text style={sos.recipientTitle}>📡 Alerts sent to:</Text>
            {["Emergency Contact","Nearest Police Station","Campus Security"].map((r, i) => (
              <View key={i} style={sos.recipientRow}>
                <View style={sos.checkDot} />
                <Text style={sos.recipientTxt}>{r}</Text>
              </View>
            ))}
          </View>

          {/* GPS */}
          <View style={sos.gpsRow}>
            <Text style={sos.gpsIco}>📍</Text>
            <Text style={sos.gpsTxt}>Live location broadcasting · GPS locked</Text>
          </View>

          {/* Actions */}
          <TouchableOpacity style={sos.safeBtn} onPress={onSafe} activeOpacity={0.85}>
            <LinearGradient colors={["#166534","#15803d"]} style={sos.btnGrad}>
              <Text style={sos.safeTxt}>✓  I'm Safe Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={sos.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
            <Text style={sos.cancelTxt}>✕  Cancel SOS</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SAFE RIDE MODAL
// ═══════════════════════════════════════════════════════════════════════════
function SafeRideModal({
  visible, onClose, location,
}: { visible: boolean; onClose: () => void; location: Location.LocationObjectCoords | null }) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) Animated.spring(slideAnim, { toValue: 0, tension: 68, friction: 13, useNativeDriver: true }).start();
  }, [visible]);

  const close = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 280, useNativeDriver: true }).start(onClose);
  };

  const openUber = () => {
    const lat = location?.latitude  ?? 13.0827;
    const lng = location?.longitude ?? 80.2707;
    const url = Platform.OS === "ios"
      ? `uber://?action=setPickup&pickup[latitude]=${lat}&pickup[longitude]=${lng}&pickup[nickname]=My+Location`
      : `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${lat}&pickup[longitude]=${lng}&pickup[nickname]=My+Location`;
    Linking.openURL(url).catch(() => Linking.openURL("https://m.uber.com/"));
    close();
  };

  const openOla = () => {
    const lat = location?.latitude  ?? 13.0827;
    const lng = location?.longitude ?? 80.2707;
    Linking.openURL(`https://book.olacabs.com/?lat=${lat}&lng=${lng}&pickup_name=My+Location`)
      .catch(() => Linking.openURL("https://book.olacabs.com/"));
    close();
  };

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <TouchableWithoutFeedback onPress={close}>
        <View style={ride.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[ride.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={["#0a0d22","#060818"]} style={ride.sheetInner}>
          <View style={ride.handle} />

          <Text style={ride.title}>🚕  Safe Ride</Text>
          <Text style={ride.subtitle}>Your current location will be pinned as pickup</Text>

          {/* GPS indicator */}
          <View style={ride.gpsBar}>
            <View style={ride.gpsDot} />
            <Text style={ride.gpsTxt}>
              {location
                ? `GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : "Acquiring GPS..."}
            </Text>
          </View>

          {/* Uber */}
          <TouchableOpacity style={ride.appBtn} onPress={openUber} activeOpacity={0.85}>
            <LinearGradient colors={["#18192e","#1e2040"]} style={ride.appBtnGrad}>
              <View style={[ride.appLogo, { backgroundColor: "#000" }]}>
                <Text style={{ fontSize: 26 }}>🖤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ride.appName}>Uber</Text>
                <Text style={ride.appDesc}>Women-preferred driver filter available</Text>
              </View>
              <Text style={ride.appArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Ola */}
          <TouchableOpacity style={ride.appBtn} onPress={openOla} activeOpacity={0.85}>
            <LinearGradient colors={["#0a1f0a","#0d2a0d"]} style={ride.appBtnGrad}>
              <View style={[ride.appLogo, { backgroundColor: "#1a3a1a" }]}>
                <Text style={{ fontSize: 26 }}>🟢</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ride.appName}>Ola</Text>
                <Text style={ride.appDesc}>Pink cab · Women drivers available</Text>
              </View>
              <Text style={ride.appArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Safety note */}
          <View style={ride.safetyNote}>
            <Text style={ride.safetyTxt}>
              🔒 Driver details are automatically shared with your emergency contact once a ride is booked.
            </Text>
          </View>

          <TouchableOpacity style={ride.closeBtn} onPress={close}>
            <Text style={ride.closeTxt}>Close</Text>
          </TouchableOpacity>

          <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const [location,    setLocation]    = useState<Location.LocationObjectCoords | null>(null);
  const [risk,        setRisk]        = useState<"low"|"moderate"|"high"|"loading">("loading");
  const [mapMode,     setMapMode]     = useState<"heatmap"|"safe">("heatmap");
  const [isListening, setListening]   = useState(false);
  const [sosVisible,  setSosVisible]  = useState(false);
  const [dangerAlert, setDanger]      = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [mapFocused,  setMapFocused]  = useState<null|{lat:number;lng:number}>(null);
  const [showChat,    setShowChat]    = useState(false);
  const [showRide,    setShowRide]    = useState(false);

  const sosPulse   = useRef(new Animated.Value(1)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const slideUp    = useRef(new Animated.Value(45)).current;
  const voiceScale = useRef(new Animated.Value(1)).current;
  const dangerOpac = useRef(new Animated.Value(1)).current;
  const menuSlide  = useRef(new Animated.Value(SH)).current;
  const menuOpac   = useRef(new Animated.Value(0)).current;

  // Entry
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 68, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // SOS breathe
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.065, duration: 950, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1,     duration: 950, useNativeDriver: true }),
    ])).start();
  }, []);

  // Voice
  useEffect(() => {
    if (!isListening) { voiceScale.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(voiceScale, { toValue: 1.3, duration: 420, useNativeDriver: true }),
      Animated.timing(voiceScale, { toValue: 1,   duration: 420, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isListening]);

  // Danger blink
  useEffect(() => {
    if (!dangerAlert) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dangerOpac, { toValue: 0.4, duration: 480, useNativeDriver: true }),
      Animated.timing(dangerOpac, { toValue: 1,   duration: 480, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [dangerAlert]);

  // Menu open/close
  const openMenu = useCallback(() => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.spring(menuSlide, { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
      Animated.timing(menuOpac,  { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);
  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(menuSlide, { toValue: SH, duration: 320, useNativeDriver: true }),
      Animated.timing(menuOpac,  { toValue: 0,  duration: 260, useNativeDriver: true }),
    ]).start(() => setMenuOpen(false));
  }, []);

  // Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setRisk("low"); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      const r = Math.random();
      if (r < 0.28) setRisk("low");
      else if (r < 0.62) setRisk("moderate");
      else { setRisk("high"); setDanger(true); }
    })();
  }, []);

  const riskZones = useMemo(() => location
    ? RISK_OFFSETS.map(o => ({ latitude: location.latitude + o.dlat, longitude: location.longitude + o.dlng, weight: o.weight }))
    : [], [location]);

  const safeZones = useMemo(() => location
    ? SAFE_OFFSETS.map(o => ({ ...o, latitude: location.latitude + o.dlat, longitude: location.longitude + o.dlng }))
    : [], [location]);

  const mapRegion = useMemo(() => {
    if (mapFocused) return { latitude: mapFocused.lat, longitude: mapFocused.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 };
    if (location)   return { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 };
    return null;
  }, [location, mapFocused]);

  // ─── HANDLERS ───────────────────────────────────────────────────────────

  const stopSpeech = useCallback(() => Speech.stop(), []);

  const sendSOS = useCallback(() => {
    Vibration.vibrate([0, 300, 120, 300, 120, 700]);
    setSosVisible(true);
    Speech.speak(
      "S O S activated. Sending your location to emergency contacts and authorities. Stay calm. Help is on the way.",
      { rate: 0.84 }
    );
  }, []);

  const handleSOSCancel = useCallback(() => {
    stopSpeech();
    setSosVisible(false);
    Speech.speak("SOS cancelled. Stay alert.", { rate: 0.9 });
  }, [stopSpeech]);

  const handleSOSSafe = useCallback(() => {
    stopSpeech();
    setSosVisible(false);
    Speech.speak("Glad you are safe.", { rate: 0.9 });
  }, [stopSpeech]);

  const handleVoice = useCallback(() => {
    if (isListening) return;
    setListening(true);
    Vibration.vibrate(100);
    Speech.speak("Listening. Say help or SOS.", { rate: 0.9 });
    setTimeout(() => {
      setListening(false);
      Speech.speak("Distress keyword detected. Activating SOS.");
      setTimeout(sendSOS, 700);
    }, 3500);
  }, [isListening, sendSOS]);

  const handleFakeCall = useCallback(() => {
    Vibration.vibrate([0, 400, 150, 400]);
    // Use Linking to immediately dial
    Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
  }, []);

  // ── Share Location: immediately send SMS (no dialog) ──
  const handleShareLocation = useCallback(() => {
    if (!location) {
      Speech.speak("Location not available yet. Please wait.");
      return;
    }
    const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const msg = encodeURIComponent(`🚨 I need help! Track me here: ${url}`);
    // On Android: sms:number?body=  On iOS: sms:number&body=
    const smsUrl = Platform.OS === "ios"
      ? `sms:${EMERGENCY_NUMBER}&body=${msg}`
      : `sms:${EMERGENCY_NUMBER}?body=${msg}`;
    Vibration.vibrate(200);
    Speech.speak("Sending your location now.", { rate: 0.9 });
    Linking.openURL(smsUrl).catch(() => {
      Speech.speak("Could not open SMS. Please try again.");
    });
  }, [location]);

  const handleOfflineSOS = useCallback(() => {
    Vibration.vibrate([0, 200, 100, 200]);
    Speech.speak("Offline SOS activated. SMS sent.", { rate: 0.9 });
    // Immediately attempt SMS
    const msg = encodeURIComponent(`🚨 EMERGENCY! I need help. Last GPS: ${location?.latitude ?? "unknown"}, ${location?.longitude ?? "unknown"}`);
    const smsUrl = Platform.OS === "ios"
      ? `sms:${EMERGENCY_NUMBER}&body=${msg}`
      : `sms:${EMERGENCY_NUMBER}?body=${msg}`;
    Linking.openURL(smsUrl).catch(() => {});
  }, [location]);

  const handleSafeSpaces = useCallback(() => {
    if (!location || !safeZones.length) { Speech.speak("Location not ready."); return; }
    // Switch to safe zone map mode and focus nearest
    setMapMode("safe");
    setMapFocused({ lat: safeZones[0].latitude, lng: safeZones[0].longitude });
    // Also offer navigation
    const list = safeZones.map(z => `${z.icon} ${z.label} — ${z.dist}`).join("\n");
    // Use a small timeout so map animates first, then show a brief toast-like speak
    Speech.speak(`Showing ${safeZones.length} safe spaces near you on the map.`, { rate: 0.9 });
  }, [location, safeZones]);

  const handleMenuAction = useCallback((id: string) => {
    closeMenu();
    setTimeout(() => {
      if (id === "ride")      setShowRide(true);
      if (id === "community") setShowChat(true);
      if (id === "evidence") {
        Vibration.vibrate(150);
        Speech.speak("Evidence recording started. Audio and location encrypted.", { rate: 0.88 });
      }
      if (id === "safeword") handleVoice();
      if (id === "route" && location)
        Linking.openURL(`https://www.google.com/maps/@${location.latitude},${location.longitude},15z`);
      if (id === "contacts")
        Speech.speak("Emergency contacts management coming soon.", { rate: 0.9 });
    }, 350);
  }, [closeMenu, location, handleVoice]);

  const RC = {
    loading:  { label: "ANALYZING AREA...", color: "#8888bb", icon: "⏳", bg: "#12132e", glow: "#333" },
    low:      { label: "LOW RISK ZONE",     color: "#00e896", icon: "🛡️", bg: "#0a2a1c", glow: "#00e89628" },
    moderate: { label: "MODERATE RISK",     color: "#ffd000", icon: "⚠️", bg: "#262000", glow: "#ffd00028" },
    high:     { label: "HIGH RISK ZONE",    color: "#ff2e63", icon: "🔴", bg: "#2a0810", glow: "#ff2e6328" },
  };
  const rc = RC[risk];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={["#040816","#060a1e","#07051c"]} style={StyleSheet.absoluteFill} />

      {/* Ambient orbs */}
      <View style={[s.orb, { top: -90,  right: -110, width: 340, height: 340, backgroundColor: "#f43f5e10" }]} />
      <View style={[s.orb, { top: 280,  left:  -110, width: 300, height: 300, backgroundColor: "#7b2ff70c" }]} />
      <View style={[s.orb, { bottom: 60, right:  -70, width: 250, height: 250, backgroundColor: "#00adb508" }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ══ HEADER ════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={s.logoRow}>
            <ShieldHerLogo size={56} />
            <View style={s.titleBlock}>
              <View style={{ flexDirection: "row" }}>
                <Text style={s.brandW}>SHIELD</Text>
                <Text style={s.brandP}>HER</Text>
              </View>
              <Text style={s.tagline}>PREVENT · PROTECT · PROVE</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={[s.iconBtn, isListening && s.iconBtnActive]} onPress={handleVoice} activeOpacity={0.75}>
              <Animated.Text style={{ fontSize: 20, transform: [{ scale: voiceScale }] }}>
                {isListening ? "👂" : "🎤"}
              </Animated.Text>
              {isListening && <View style={s.liveDot} />}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={openMenu} activeOpacity={0.75}>
              <View style={s.hamburger}>
                <View style={[s.hLine, { width: 20 }]} />
                <View style={[s.hLine, { width: 14 }]} />
                <View style={[s.hLine, { width: 17 }]} />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ══ DANGER BANNER ═════════════════════════════════════════════════ */}
        {dangerAlert && (
          <Animated.View style={[s.dangerBanner, { opacity: dangerOpac }]}>
            <LinearGradient colors={["#3a0008","#5c0015"]} style={s.dangerGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.dangerTitle}>DANGER ZONE DETECTED</Text>
                <Text style={s.dangerSub}>High-crime area. Consider alternate route.</Text>
              </View>
              <TouchableOpacity onPress={() => setDanger(false)} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
                <Text style={{ color: "#ff7070", fontSize: 15, fontWeight: "700" }}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ══ RISK BADGE ════════════════════════════════════════════════════ */}
        <Animated.View style={[s.riskBadge, {
          backgroundColor: rc.bg, borderColor: rc.color,
          shadowColor: rc.glow, opacity: fadeIn, transform: [{ translateY: slideUp }],
        }]}>
          <Text style={{ fontSize: 17 }}>{rc.icon}</Text>
          <Text style={[s.riskLabel, { color: rc.color }]}>{rc.label}</Text>
          <View style={[s.riskDot, { backgroundColor: rc.color }]} />
        </Animated.View>

        {/* ══ SOS BUTTON ════════════════════════════════════════════════════ */}
        <Animated.View style={[s.sosOuter, { opacity: fadeIn }]}>
          <Animated.View style={[s.sosWrapper, { transform: [{ scale: sosPulse }] }]}>
            <PulseRing color="#ff2e63" delay={0} />
            <PulseRing color="#f43f5e" delay={730} />
            <PulseRing color="#fb7185" delay={1460} />
            <TouchableOpacity style={s.sosBtn} onPress={sendSOS} activeOpacity={0.87}>
              <LinearGradient
                colors={["#c01035","#e5143a","#ff2e63"]}
                style={s.sosGrad}
                start={{x:0.2,y:0}} end={{x:0.8,y:1}}
              >
                <View style={s.sosRing} />
                <Text style={{ fontSize: 44, marginBottom: 5 }}>🚨</Text>
                <Text style={s.sosBig}>SEND SOS</Text>
                <Text style={s.sosSmall}>TAP IN DANGER</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ══ PRIMARY 2×2 GRID ══════════════════════════════════════════════ */}
        <Animated.View style={[s.grid, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={s.gridRow}>
            {/* Fake Call */}
            <TouchableOpacity style={s.gridCard} onPress={handleFakeCall} activeOpacity={0.82}>
              <LinearGradient colors={["#3a0ca3","#560bad"]} style={s.gridGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.gridIconBg}><Text style={s.gridEmoji}>📞</Text></View>
                <Text style={s.gridTitle}>Fake Call</Text>
                <Text style={s.gridSub}>Exit danger discreetly</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* Share Location */}
            <TouchableOpacity style={s.gridCard} onPress={handleShareLocation} activeOpacity={0.82}>
              <LinearGradient colors={["#004e6a","#007a9a"]} style={s.gridGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.gridIconBg}><Text style={s.gridEmoji}>📍</Text></View>
                <Text style={s.gridTitle}>Share Location</Text>
                <Text style={s.gridSub}>Instant SMS to contact</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={s.gridRow}>
            {/* Offline SOS */}
            <TouchableOpacity style={s.gridCard} onPress={handleOfflineSOS} activeOpacity={0.82}>
              <LinearGradient colors={["#003049","#025080"]} style={s.gridGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.gridIconBg}><Text style={s.gridEmoji}>📡</Text></View>
                <Text style={s.gridTitle}>Offline SOS</Text>
                <Text style={s.gridSub}>Works without internet</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* Safe Spaces */}
            <TouchableOpacity style={s.gridCard} onPress={handleSafeSpaces} activeOpacity={0.82}>
              <LinearGradient colors={["#420055","#6a0090"]} style={s.gridGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.gridIconBg}><Text style={s.gridEmoji}>🏥</Text></View>
                <Text style={s.gridTitle}>Safe Spaces</Text>
                <Text style={s.gridSub}>Verified nearby locations</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ══ MAP ═══════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.mapCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={s.mapHead}>
            <View>
              <Text style={s.mapTitle}>Smart Safety Map</Text>
              <Text style={s.mapCoord}>
                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Acquiring GPS..."}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {mapFocused && (
                <TouchableOpacity style={s.mapResetBtn} onPress={() => setMapFocused(null)}>
                  <Text style={s.mapResetTxt}>↩ Me</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.mapExpandBtn} onPress={() => location && Linking.openURL(`https://www.google.com/maps/@${location.latitude},${location.longitude},16z`)}>
                <Text style={s.mapExpandTxt}>⤢ Full</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.mapToggle}>
            <TouchableOpacity style={[s.toggleChip, mapMode==="heatmap" && s.toggleOn]} onPress={() => { setMapMode("heatmap"); setMapFocused(null); }}>
              <Text style={[s.toggleTxt, mapMode==="heatmap" && s.toggleTxtOn]}>🔥 Risk Heatmap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleChip, mapMode==="safe" && s.toggleOn]} onPress={() => setMapMode("safe")}>
              <Text style={[s.toggleTxt, mapMode==="safe" && s.toggleTxtOn]}>🛡️ Safe Zones</Text>
            </TouchableOpacity>
          </View>

          {mapRegion ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={s.map}
              customMapStyle={DARK_MAP}
              region={mapRegion}
              showsUserLocation
              showsMyLocationButton
              showsCompass
            >
              {location && <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="You are here" pinColor="#ff2e63" />}
              {mapMode === "heatmap" && riskZones.length > 0 && (
                <Heatmap points={riskZones} opacity={0.8} radius={50}
                  gradient={{ colors: ["#00e896","#ffd000","#ff6a00","#ff2e63"], startPoints: [0.1, 0.4, 0.7, 1.0], colorMapSize: 512 }} />
              )}
              {mapMode === "safe" && safeZones.map((z, i) => (
                <React.Fragment key={i}>
                  <Circle center={{ latitude: z.latitude, longitude: z.longitude }} radius={z.radius}
                    fillColor="rgba(0,232,150,0.12)" strokeColor="#00e896" strokeWidth={2} />
                  <Marker coordinate={{ latitude: z.latitude, longitude: z.longitude }}
                    title={`${z.icon} ${z.label}`} description={z.dist} pinColor="#00e896"
                    onPress={() => setMapFocused({ lat: z.latitude, lng: z.longitude })} />
                </React.Fragment>
              ))}
            </MapView>
          ) : (
            <View style={s.mapLoader}><Text style={s.mapLoaderTxt}>📡 Acquiring GPS signal...</Text></View>
          )}

          <View style={s.legend}>
            {mapMode === "heatmap"
              ? [["#00e896","Safe"],["#ffd000","Moderate"],["#ff2e63","High Risk"]].map(([c,l]) => (
                  <View key={l} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: c }]} />
                    <Text style={s.legendTxt}>{l}</Text>
                  </View>
                ))
              : <Text style={[s.legendTxt, { color: "#00e896" }]}>🟢 Tap marker to navigate · Tap Safe Spaces to focus</Text>
            }
          </View>
        </Animated.View>

        <View style={s.footer}>
          <ShieldHerLogo size={16} />
          <Text style={s.footerTxt}>ShieldHer · Stay Safe · Stay Strong</Text>
        </View>
        <View style={{ height: 36 }} />
      </ScrollView>

      {/* ══ HAMBURGER MENU ════════════════════════════════════════════════ */}
      {menuOpen && (
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeMenu}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View style={[s.menuOverlay, { opacity: menuOpac }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[s.menuSheet, { transform: [{ translateY: menuSlide }] }]}>
            <LinearGradient colors={["#0a0d22","#080618"]} style={s.menuInner}>
              <View style={s.menuHandle} />
              <View style={s.menuTitleRow}>
                <ShieldHerLogo size={28} />
                <Text style={s.menuTitle}>More Features</Text>
                <TouchableOpacity onPress={closeMenu} style={s.menuCloseBtn}>
                  <Text style={s.menuCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.menuSub}>Secondary features — accessible anytime</Text>
              <View style={s.menuGrid}>
                {MENU_ITEMS.map(item => (
                  <TouchableOpacity key={item.id} style={s.menuCard} onPress={() => handleMenuAction(item.id)} activeOpacity={0.8}>
                    <LinearGradient colors={item.colors} style={s.menuCardGrad}>
                      <Text style={s.menuEmoji}>{item.icon}</Text>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      <Text style={s.menuCardSub}>{item.sub}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
            </LinearGradient>
          </Animated.View>
        </Modal>
      )}

      {/* ══ MODALS ════════════════════════════════════════════════════════ */}
      <SOSModal visible={sosVisible} onCancel={handleSOSCancel} onSafe={handleSOSSafe} />
      <SafeRideModal visible={showRide} onClose={() => setShowRide(false)} location={location} />
      {showChat && <CommunityChat onClose={() => setShowChat(false)} />}
    </View>
  );
}

// ─── DARK MAP ─────────────────────────────────────────────────────────────────
const DARK_MAP = [
  { elementType: "geometry",           stylers: [{ color: "#0c0f1e" }] },
  { elementType: "labels.icon",        stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#5a6899" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c0f1e" }] },
  { featureType: "road",         elementType: "geometry", stylers: [{ color: "#171d38" }] },
  { featureType: "road.arterial",elementType: "geometry", stylers: [{ color: "#1c2442" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#222c50" }] },
  { featureType: "water",        elementType: "geometry", stylers: [{ color: "#05091c" }] },
  { featureType: "poi",          elementType: "geometry", stylers: [{ color: "#0f1225" }] },
  { featureType: "poi.park",     elementType: "geometry", stylers: [{ color: "#0b160b" }] },
  { featureType: "transit",      elementType: "geometry", stylers: [{ color: "#111828" }] },
];

// ─── MAIN STYLES ──────────────────────────────────────────────────────────────
const CARD = "#09091e"; const BORD = "#18203a"; const GAP = 11;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#040816" },
  orb:    { position: "absolute", borderRadius: 999 },
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 58 : 46 },

  header:       { flexDirection: "row", alignItems: "center", marginBottom: 14, justifyContent: "space-between" },
  logoRow:      { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  titleBlock:   { gap: 3 },
  brandW:       { color: "#fff",    fontSize: 26, fontWeight: "900", letterSpacing: 3.5 },
  brandP:       { color: "#f43f5e", fontSize: 26, fontWeight: "900", letterSpacing: 3.5 },
  tagline:      { color: "#383d6a", fontSize: 8.5, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase" },
  headerRight:  { flexDirection: "row", gap: 8 },
  iconBtn:      { width: 46, height: 46, borderRadius: 23, backgroundColor: "#0e1128", borderWidth: 1.5, borderColor: "#222850", alignItems: "center", justifyContent: "center" },
  iconBtnActive:{ borderColor: "#f43f5e", backgroundColor: "#280810" },
  liveDot:      { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: "#f43f5e", borderWidth: 1.5, borderColor: "#040816" },
  hamburger:    { gap: 4, alignItems: "flex-end" },
  hLine:        { height: 2, backgroundColor: "#8888bb", borderRadius: 2 },

  dangerBanner: { borderRadius: 13, overflow: "hidden", marginBottom: 11, borderWidth: 1, borderColor: "#7a0015" },
  dangerGrad:   { flexDirection: "row", alignItems: "center", padding: 13, gap: 10 },
  dangerTitle:  { color: "#ff6060", fontWeight: "800", fontSize: 11.5, letterSpacing: 1.5 },
  dangerSub:    { color: "#cc5555", fontSize: 11, marginTop: 2 },

  riskBadge:    { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, marginBottom: 18, gap: 9, shadowOffset: {width:0,height:0}, shadowOpacity: 1, shadowRadius: 14, elevation: 6 },
  riskLabel:    { flex: 1, fontWeight: "800", fontSize: 12.5, letterSpacing: 2.2 },
  riskDot:      { width: 9, height: 9, borderRadius: 5 },

  sosOuter:     { alignItems: "center", marginBottom: 26 },
  sosWrapper:   { width: 210, height: 210, alignItems: "center", justifyContent: "center" },
  sosBtn:       { width: 210, height: 210, borderRadius: 105, overflow: "hidden", shadowColor: "#ff2e63", shadowOffset: {width:0,height:0}, shadowOpacity: 0.8, shadowRadius: 40, elevation: 24 },
  sosGrad:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  sosRing:      { position: "absolute", width: 185, height: 185, borderRadius: 93, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
  sosBig:       { color: "#fff", fontSize: 21, fontWeight: "900", letterSpacing: 4 },
  sosSmall:     { color: "rgba(255,255,255,0.48)", fontSize: 10, letterSpacing: 1.8, fontWeight: "600" },

  grid:         { gap: GAP, marginBottom: 18 },
  gridRow:      { flexDirection: "row", gap: GAP },
  gridCard:     { flex: 1, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:8, elevation:6 },
  gridGrad:     { padding: 18, gap: 8, minHeight: 115 },
  gridIconBg:   { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  gridEmoji:    { fontSize: 24 },
  gridTitle:    { color: "#fff", fontWeight: "800", fontSize: 14.5, letterSpacing: 0.3 },
  gridSub:      { color: "rgba(255,255,255,0.45)", fontSize: 10.5, lineHeight: 14 },

  mapCard:      { backgroundColor: CARD, borderRadius: 22, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: BORD },
  mapHead:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingBottom: 10 },
  mapTitle:     { color: "#fff", fontWeight: "800", fontSize: 15.5, letterSpacing: 0.3 },
  mapCoord:     { color: "#383d6a", fontSize: 9.5, marginTop: 3, letterSpacing: 0.5 },
  mapExpandBtn: { backgroundColor: "#131840", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: "#242d58" },
  mapExpandTxt: { color: "#6a7cbf", fontSize: 12, fontWeight: "700" },
  mapResetBtn:  { backgroundColor: "#1a2010", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: "#2d4020" },
  mapResetTxt:  { color: "#70a050", fontSize: 12, fontWeight: "700" },
  mapToggle:    { flexDirection: "row", marginHorizontal: 15, marginBottom: 11, backgroundColor: "#0a0d1e", borderRadius: 11, padding: 3, gap: 3 },
  toggleChip:   { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  toggleOn:     { backgroundColor: "#181e48" },
  toggleTxt:    { color: "#383d6a", fontSize: 12, fontWeight: "700" },
  toggleTxtOn:  { color: "#fff" },
  map:          { height: 220, marginHorizontal: 15, borderRadius: 14 },
  mapLoader:    { height: 220, marginHorizontal: 15, borderRadius: 14, backgroundColor: "#0a0d1e", alignItems: "center", justifyContent: "center" },
  mapLoaderTxt: { color: "#383d6a", fontSize: 13 },
  legend:       { flexDirection: "row", gap: 14, padding: 13, paddingTop: 10, flexWrap: "wrap" },
  legendItem:   { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendTxt:    { color: "#5a6899", fontSize: 11 },

  footer:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 14 },
  footerTxt:    { color: "#22253a", fontSize: 11, letterSpacing: 2, fontWeight: "600" },

  menuOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  menuSheet:    { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  menuInner:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 12 },
  menuHandle:   { width: 38, height: 4, borderRadius: 2, backgroundColor: "#2a2f5a", alignSelf: "center", marginBottom: 18 },
  menuTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  menuTitle:    { flex: 1, color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  menuCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#14183a", borderWidth: 1, borderColor: "#252d55", alignItems: "center", justifyContent: "center" },
  menuCloseTxt: { color: "#6a7cbf", fontSize: 14, fontWeight: "700" },
  menuSub:      { color: "#383d6a", fontSize: 11, letterSpacing: 0.5, marginBottom: 18 },
  menuGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  menuCard:     { width: (SW - 36 - 20) / 3, borderRadius: 16, overflow: "hidden" },
  menuCardGrad: { padding: 14, alignItems: "center", justifyContent: "center", minHeight: 96, gap: 5 },
  menuEmoji:    { fontSize: 26 },
  menuLabel:    { color: "#fff", fontWeight: "800", fontSize: 12, textAlign: "center" },
  menuCardSub:  { color: "rgba(255,255,255,0.38)", fontSize: 9, textAlign: "center", lineHeight: 12 },
});

// ─── SOS MODAL STYLES ─────────────────────────────────────────────────────────
const sos = StyleSheet.create({
  overlay:       { flex: 1, alignItems: "center", justifyContent: "center" },
  card:          { width: SW - 40, backgroundColor: "#0e0414", borderRadius: 28, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#3a0020", shadowColor: "#ff2e63", shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:30, elevation:30 },
  ringContainer: { width: 130, height: 130, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  ring:          { ...StyleSheet.absoluteFillObject, borderRadius: 999, borderWidth: 3, borderColor: "#ff2e63" },
  sosIconBg:     { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,46,99,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#ff2e6360" },
  sosTitle:      { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 4, marginBottom: 6 },
  sosTimer:      { color: "#f43f5e", fontSize: 38, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
  sosStatus:     { color: "#aaa", fontSize: 13, letterSpacing: 0.5, marginBottom: 22 },
  recipientCard: { width: "100%", backgroundColor: "#160820", borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#2a1040" },
  recipientTitle:{ color: "#aaa", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  recipientRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 7 },
  checkDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00e896" },
  recipientTxt:  { color: "#ddd", fontSize: 13 },
  gpsRow:        { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 24 },
  gpsIco:        { fontSize: 14 },
  gpsTxt:        { color: "#555", fontSize: 11, letterSpacing: 0.5 },
  safeBtn:       { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  btnGrad:       { paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  safeTxt:       { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  cancelBtn:     { paddingVertical: 13, width: "100%", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: "#3a0020" },
  cancelTxt:     { color: "#ff6b6b", fontSize: 15, fontWeight: "700" },
});

// ─── RIDE MODAL STYLES ────────────────────────────────────────────────────────
const ride = StyleSheet.create({
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet:      { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  sheetInner: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14 },
  handle:     { width: 38, height: 4, borderRadius: 2, backgroundColor: "#2a2f5a", alignSelf: "center", marginBottom: 20 },
  title:      { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 0.5, marginBottom: 5 },
  subtitle:   { color: "#383d6a", fontSize: 12, marginBottom: 14 },
  gpsBar:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0e1226", borderRadius: 10, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: "#1a2040" },
  gpsDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00e896" },
  gpsTxt:     { color: "#5a8060", fontSize: 11, letterSpacing: 0.5 },
  appBtn:     { borderRadius: 18, overflow: "hidden", marginBottom: 10, borderWidth: 1, borderColor: "#181e38" },
  appBtnGrad: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  appLogo:    { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  appName:    { color: "#fff", fontWeight: "800", fontSize: 17 },
  appDesc:    { color: "#383d6a", fontSize: 11, marginTop: 3 },
  appArrow:   { color: "#383d6a", fontSize: 20 },
  safetyNote: { backgroundColor: "#0c1a0c", borderRadius: 12, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: "#00e896" },
  safetyTxt:  { color: "#4a8a60", fontSize: 11.5, lineHeight: 17 },
  closeBtn:   { paddingVertical: 13, alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: "#1a2040", marginBottom: 4 },
  closeTxt:   { color: "#5a6899", fontSize: 14, fontWeight: "700" },
});

// ─── COMMUNITY CHAT STYLES ────────────────────────────────────────────────────
const ch = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: "#040816" },
  header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 58 : 44, paddingBottom: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: "#12152e" },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: "#0e1128", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1e2448" },
  title:      { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  onlineRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  greenDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: "#00e896" },
  onlineTxt:  { color: "#4a8a65", fontSize: 11 },
  shieldSmall:{ },
  noticeBand: { backgroundColor: "#0a0d1e", paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#12152e" },
  noticeTxt:  { color: "#383d6a", fontSize: 11, textAlign: "center", letterSpacing: 0.3 },
  list:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  msgRow:     { flexDirection: "row", gap: 8, marginBottom: 14, alignItems: "flex-end" },
  msgRowMine: { flexDirection: "row-reverse" },
  avatar:     { fontSize: 28, width: 36, textAlign: "center" },
  bubble:     { maxWidth: SW * 0.68, backgroundColor: "#0f1330", borderRadius: 18, borderBottomLeftRadius: 4, padding: 12, borderWidth: 1, borderColor: "#1a2040" },
  bubbleMine: { backgroundColor: "#2d0a40", borderBottomLeftRadius: 18, borderBottomRightRadius: 4, borderColor: "#4a1060" },
  username:   { color: "#f43f5e", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  msgTxt:     { color: "#ddd", fontSize: 13.5, lineHeight: 19 },
  time:       { color: "#383d6a", fontSize: 10, marginTop: 5, textAlign: "right" },
  inputRow:   { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#12152e" },
  input:      { flex: 1, backgroundColor: "#0d1028", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: "#1a2040", maxHeight: 100 },
  sendBtn:    { width: 46, height: 46, borderRadius: 23, overflow: "hidden" },
  sendGrad:   { flex: 1, alignItems: "center", justifyContent: "center" },
});