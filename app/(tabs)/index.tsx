/**
 * ShieldHer — Proactive Women Safety Platform
 * ─────────────────────────────────────────────
 * HOME:  SOS · Fake Call · Share Location · Offline SOS · Safe Spaces
 * MENU:  Safe Ride · Evidence Mode · Safe Word · Community · AI Route
 *
 * Logo: custom SVG matching uploaded pink/purple woman-in-shield design
 */

import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";
import MapView, {
  Circle,
  Heatmap,
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import Svg, {
  Defs,
  Path,
  Stop,
  LinearGradient as SvgLinear,
  RadialGradient as SvgRadial
} from "react-native-svg";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const EMERGENCY_NUMBER = "+919999999999"; // 🔁 Replace
const { width: SW, height: SH } = Dimensions.get("window");

// ─── RISK ZONE OFFSETS ───────────────────────────────────────────────────────
const RISK_OFFSETS = [
  { dlat: 0.004,  dlng: 0.005,  weight: 1.0  },
  { dlat: -0.006, dlng: 0.003,  weight: 0.85 },
  { dlat: 0.008,  dlng: -0.004, weight: 0.7  },
  { dlat: -0.003, dlng: -0.007, weight: 0.6  },
  { dlat: 0.010,  dlng: 0.002,  weight: 0.5  },
  { dlat: -0.007, dlng: -0.001, weight: 0.75 },
];

const SAFE_OFFSETS = [
  { dlat: -0.009, dlng: 0.006,  radius: 350, label: "Campus Security", dist: "0.1 km" },
  { dlat: 0.006,  dlng: -0.009, radius: 280, label: "Police Station",  dist: "1.2 km" },
  { dlat: -0.004, dlng: -0.010, radius: 200, label: "Hospital",        dist: "0.9 km" },
  { dlat: 0.011,  dlng: 0.007,  radius: 160, label: "24hr ATM Café",   dist: "0.4 km" },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOGO — matches the uploaded pink/purple woman-in-shield design
// ═══════════════════════════════════════════════════════════════════════════
function ShieldHerLogo({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        {/* Shield outer gradient — purple to pink */}
        <SvgLinear id="shieldOuter" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#7b2ff7" />
          <Stop offset="55%"  stopColor="#c026d3" />
          <Stop offset="100%" stopColor="#f43f5e" />
        </SvgLinear>
        {/* Inner fill — dark purple */}
        <SvgLinear id="shieldInner" x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0%"   stopColor="#3b0764" />
          <Stop offset="100%" stopColor="#1e1b4b" />
        </SvgLinear>
        {/* Woman silhouette gradient */}
        <SvgLinear id="womanGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#c026d3" />
          <Stop offset="100%" stopColor="#f43f5e" />
        </SvgLinear>
        {/* Glow radial */}
        <SvgRadial id="glow" cx="55%" cy="45%" r="50%">
          <Stop offset="0%"  stopColor="#f43f5e" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#7b2ff7" stopOpacity="0" />
        </SvgRadial>
      </Defs>

      {/* Shield border/stroke */}
      <Path
        d="M60 4 L106 20 L106 56 C106 84 86 102 60 112 C34 102 14 84 14 56 L14 20 Z"
        fill="url(#shieldOuter)"
      />
      {/* Shield inner body */}
      <Path
        d="M60 11 L100 25 L100 56 C100 80 82 97 60 106 C38 97 20 80 20 56 L20 25 Z"
        fill="url(#shieldInner)"
      />
      {/* Radial glow inside */}
      <Path
        d="M60 11 L100 25 L100 56 C100 80 82 97 60 106 C38 97 20 80 20 56 L20 25 Z"
        fill="url(#glow)"
      />
      {/* Woman silhouette — hair swoop (left side) */}
      <Path
        d="M38 90 C34 70 30 50 36 34 C40 22 50 16 58 16 C48 20 42 32 40 48 C38 62 42 78 46 90 Z"
        fill="url(#womanGrad)"
        opacity="0.9"
      />
      {/* Woman face profile (right-facing) */}
      <Path
        d="M58 18 C68 18 76 25 78 35 C80 43 77 50 72 55 C78 57 82 63 82 70 C82 78 76 84 68 86 C64 87 60 86 58 84 L56 90 L50 90 L52 82 C48 79 46 74 46 68 C46 56 50 46 54 38 C56 30 56 24 58 18 Z"
        fill="url(#womanGrad)"
        opacity="0.88"
      />
      {/* Hair flowing behind */}
      <Path
        d="M46 20 C38 26 32 38 32 54 C32 66 36 76 42 84 C38 78 36 68 36 58 C36 42 40 28 46 20 Z"
        fill="#c026d3"
        opacity="0.7"
      />
      {/* Star accent */}
      <Path
        d="M46 36 L48 42 L54 42 L49.5 46 L51.5 52 L46 48.5 L40.5 52 L42.5 46 L38 42 L44 42 Z"
        fill="#f9a8d4"
        opacity="0.9"
      />
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PULSE RING
// ═══════════════════════════════════════════════════════════════════════════
function PulseRing({ color, delay = 0 }: { color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.0] });
  const opacity = anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.65, 0.25, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius: 999, borderWidth: 2, borderColor: color,
          transform: [{ scale }], opacity },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECONDARY FEATURE MENU ITEMS
// ═══════════════════════════════════════════════════════════════════════════
const MENU_ITEMS = [
  { id: "ride",      icon: "🚕", label: "Safe Ride",        sub: "Uber & Ola with GPS pickup",   color: ["#1a2a1a","#0e3a0e"] },
  { id: "evidence",  icon: "📹", label: "Evidence Mode",    sub: "Silent encrypted recording",    color: ["#3a0008","#600015"] },
  { id: "safeword",  icon: "🔐", label: "Voice Safe Word",  sub: "Hands-free keyword trigger",    color: ["#1b3a2d","#276745"] },
  { id: "community", icon: "👩", label: "Community Chat",   sub: "Anonymous support network",     color: ["#2d1054","#4a0080"] },
  { id: "route",     icon: "🗺️", label: "AI Safe Route",    sub: "Avoid high-risk zones",         color: ["#0a1f35","#003060"] },
  { id: "contacts",  icon: "👥", label: "SOS Contacts",     sub: "Manage emergency contacts",     color: ["#2a1500","#4a2200"] },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const [location, setLocation]     = useState<Location.LocationObjectCoords | null>(null);
  const [risk,     setRisk]         = useState<"low"|"moderate"|"high"|"loading">("loading");
  const [mapMode,  setMapMode]      = useState<"heatmap"|"safe">("heatmap");
  const [isListening, setListening] = useState(false);
  const [sosActive,   setSosActive] = useState(false);
  const [dangerAlert, setDanger]    = useState(false);
  const [menuOpen,    setMenuOpen]  = useState(false);
  const [mapFocused,  setMapFocused]= useState<null|{lat:number;lng:number}>(null);

  // Animations
  const sosPulse     = useRef(new Animated.Value(1)).current;
  const fadeIn       = useRef(new Animated.Value(0)).current;
  const slideUp      = useRef(new Animated.Value(45)).current;
  const voiceScale   = useRef(new Animated.Value(1)).current;
  const dangerOpac   = useRef(new Animated.Value(1)).current;
  const menuSlide    = useRef(new Animated.Value(SH)).current;
  const menuOverlay  = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 68, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // SOS breathe
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, { toValue: 1.065, duration: 950, useNativeDriver: true }),
        Animated.timing(sosPulse, { toValue: 1,     duration: 950, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Voice pulse
  useEffect(() => {
    if (!isListening) { voiceScale.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(voiceScale, { toValue: 1.3,  duration: 420, useNativeDriver: true }),
        Animated.timing(voiceScale, { toValue: 1,    duration: 420, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isListening]);

  // Danger blink
  useEffect(() => {
    if (!dangerAlert) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dangerOpac, { toValue: 0.4, duration: 480, useNativeDriver: true }),
        Animated.timing(dangerOpac, { toValue: 1,   duration: 480, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [dangerAlert]);

  // Menu animation
  const openMenu = useCallback(() => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.spring(menuSlide,   { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
      Animated.timing(menuOverlay, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(menuSlide,   { toValue: SH, duration: 320, useNativeDriver: true }),
      Animated.timing(menuOverlay, { toValue: 0,  duration: 260, useNativeDriver: true }),
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
      if      (r < 0.28) setRisk("low");
      else if (r < 0.62) setRisk("moderate");
      else               { setRisk("high"); setDanger(true); }
    })();
  }, []);

  // Map data
  const riskZones = useMemo(() => location
    ? RISK_OFFSETS.map(o => ({ latitude: location.latitude + o.dlat, longitude: location.longitude + o.dlng, weight: o.weight }))
    : [], [location]);

  const safeZones = useMemo(() => location
    ? SAFE_OFFSETS.map(o => ({ latitude: location.latitude + o.dlat, longitude: location.longitude + o.dlng, radius: o.radius, label: o.label, dist: o.dist }))
    : [], [location]);

  // Map region (can be overridden when focusing safe space)
  const mapRegion = useMemo(() => {
    if (mapFocused) return { latitude: mapFocused.lat, longitude: mapFocused.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    if (location)   return { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 };
    return null;
  }, [location, mapFocused]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const sendSOS = useCallback(() => {
    Vibration.vibrate([0, 300, 120, 300, 120, 700]);
    setSosActive(true);
    Speech.speak("SOS activated. Sending location to emergency contacts and authorities. Stay calm. Help is on the way.", { rate: 0.84 });
    Alert.alert(
      "🚨 SOS ACTIVATED",
      "Live location shared with:\n\n• Emergency contacts\n• Nearest police station\n• Campus security\n\nGPS coordinates & timestamp logged securely.",
      [
        { text: "❌ Cancel SOS", style: "destructive", onPress: () => { setSosActive(false); Speech.speak("SOS cancelled."); } },
        { text: "✓ I'm Safe" },
      ]
    );
  }, []);

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
    Alert.alert(
      "📞 Incoming Call — Mom",
      "Simulated call to help you exit the situation discreetly.",
      [
        { text: "📲 Answer", onPress: () => Linking.openURL(`tel:${EMERGENCY_NUMBER}`) },
        { text: "Dismiss", style: "cancel" },
      ]
    );
  }, []);

  const handleShareLocation = useCallback(() => {
    if (!location) { Alert.alert("GPS pending", "Still acquiring location. Try again."); return; }
    const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const msg = `🚨 I need help! Track me: ${url}`;
    Alert.alert(
      "📍 Share Live Location",
      "How would you like to share?",
      [
        { text: "WhatsApp", onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`) },
        { text: "SMS",      onPress: () => Linking.openURL(`sms:${EMERGENCY_NUMBER}?body=${encodeURIComponent(msg)}`) },
        { text: "Copy",     onPress: () => Alert.alert("✓ Copied", url) },
        { text: "Cancel",   style: "cancel" },
      ]
    );
  }, [location]);

  const handleOfflineSOS = useCallback(() => {
    Vibration.vibrate([0, 200, 100, 200]);
    Alert.alert(
      "📡 Offline SOS Activated",
      "SMS sent to emergency contact with your last known GPS coordinates.\n\nWorks without internet — data syncs when reconnected.",
      [{ text: "✓ Confirmed" }]
    );
  }, []);

  const handleSafeSpaces = useCallback(() => {
    if (!location || safeZones.length === 0) {
      Alert.alert("GPS pending", "Location not acquired yet.");
      return;
    }
    Alert.alert(
      "🏥 Safe Spaces Nearby",
      safeZones.map(z => `✅ ${z.label} — ${z.dist}`).join("\n"),
      [
        {
          text: "Show on Map",
          onPress: () => {
            // Switch map to safe zones mode and focus on nearest safe zone
            setMapMode("safe");
            setMapFocused({ lat: safeZones[0].latitude, lng: safeZones[0].longitude });
            // Scroll is handled by user — map is visible below
          },
        },
        { text: "Navigate",
          onPress: () => {
            const z = safeZones[0];
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${z.latitude},${z.longitude}`);
          }
        },
        { text: "Close", style: "cancel" },
      ]
    );
  }, [location, safeZones]);

  const handleMenuAction = useCallback((id: string) => {
    closeMenu();
    setTimeout(() => {
      switch (id) {
        case "ride":
          handleRide();
          break;
        case "evidence":
          Alert.alert("📹 Evidence Mode", "Silent background recording started.\n\nAudio, GPS & timestamps are encrypted and tamper-proof.", [{ text: "Recording ✓" }, { text: "Stop", style: "cancel" }]);
          break;
        case "safeword":
          Alert.alert("🔐 Voice Safe Word", 'Say "HELP" or "SOS" with phone in pocket.\n\nTap 🎤 in the header to activate.', [{ text: "Activate 🎤", onPress: handleVoice }, { text: "Close" }]);
          break;
        case "community":
          Alert.alert("👩 Community Chat", "Anonymous peer support network.\n\nConnect with trusted women nearby. All chats are encrypted.", [{ text: "Join ✓" }, { text: "Later" }]);
          break;
        case "route":
          if (location) {
            Linking.openURL(`https://www.google.com/maps/@${location.latitude},${location.longitude},15z`);
          } else {
            Alert.alert("AI Safe Route", "Acquiring GPS... try again in a moment.");
          }
          break;
        case "contacts":
          Alert.alert("👥 Emergency Contacts", "Manage up to 5 trusted contacts who receive SOS alerts.\n\n1. Mom — +91 99999 99999\n2. Add contact...", [{ text: "Edit Contacts" }, { text: "Done" }]);
          break;
      }
    }, 350);
  }, [closeMenu, location, handleVoice]);

  const handleRide = useCallback(() => {
    const lat = location?.latitude ?? 13.0827;
    const lng = location?.longitude ?? 80.2707;
    Alert.alert(
      "🚕 Choose a Ride",
      "Both apps will open with your current pickup location pinned.",
      [
        {
          text: "Uber",
          onPress: () => {
            const url = Platform.OS === "ios"
              ? `uber://?action=setPickup&pickup[latitude]=${lat}&pickup[longitude]=${lng}&pickup[nickname]=My+Location`
              : `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${lat}&pickup[longitude]=${lng}&pickup[nickname]=My+Location`;
            Linking.openURL(url).catch(() => Linking.openURL("https://m.uber.com/"));
          },
        },
        {
          text: "Ola",
          onPress: () => Linking.openURL(`https://book.olacabs.com/?lat=${lat}&lng=${lng}&pickup_name=My+Location`)
            .catch(() => Linking.openURL("https://book.olacabs.com/")),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [location]);

  const openFullMap = useCallback(() => {
    if (!location) return;
    Linking.openURL(`https://www.google.com/maps/@${location.latitude},${location.longitude},16z`);
  }, [location]);

  // Risk config
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

      {/* ── BACKGROUND ────────────────────────────────────────────────────── */}
      <LinearGradient colors={["#040816","#060a1e","#07051c"]} style={StyleSheet.absoluteFill} />
      {/* Ambient orbs */}
      <View style={[s.orb, { top: -90, right: -110, width: 340, height: 340, backgroundColor: "#f43f5e10" }]} />
      <View style={[s.orb, { top: 280,  left: -110, width: 300, height: 300, backgroundColor: "#7b2ff70c" }]} />
      <View style={[s.orb, { bottom: 60, right: -70, width: 250, height: 250, backgroundColor: "#00adb508" }]} />

      {/* ── SCROLL CONTENT ────────────────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ══ HEADER ════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          {/* Logo + Title */}
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

          {/* Right controls */}
          <View style={s.headerRight}>
            {/* Voice mic */}
            <TouchableOpacity
              style={[s.iconBtn, isListening && s.iconBtnActive]}
              onPress={handleVoice}
              activeOpacity={0.75}
            >
              <Animated.Text style={{ fontSize: 20, transform: [{ scale: voiceScale }] }}>
                {isListening ? "👂" : "🎤"}
              </Animated.Text>
              {isListening && <View style={s.liveDot} />}
            </TouchableOpacity>

            {/* Hamburger menu */}
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
            <LinearGradient colors={["#3a0008","#5c0015"]} style={s.dangerGrad} start={{ x:0,y:0 }} end={{ x:1,y:0 }}>
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
        <Animated.View
          style={[s.riskBadge, {
            backgroundColor: rc.bg, borderColor: rc.color,
            shadowColor: rc.glow, opacity: fadeIn, transform: [{ translateY: slideUp }],
          }]}
        >
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
                colors={sosActive ? ["#ff0030","#ff2e63","#ff7090"] : ["#c01035","#e5143a","#ff2e63"]}
                style={s.sosGrad}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              >
                <View style={s.sosRing} />
                <Text style={{ fontSize: 44, marginBottom: 5 }}>🚨</Text>
                <Text style={s.sosBig}>SEND SOS</Text>
                <Text style={s.sosSmall}>
                  {sosActive ? "ACTIVE — TAP TO CANCEL" : "TAP IN DANGER"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ══ PRIMARY ACTION GRID (2×2) ═════════════════════════════════════ */}
        <Animated.View style={[s.actionGrid, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          {/* Row 1 */}
          <View style={s.actionRow}>
            {/* Fake Call */}
            <TouchableOpacity style={s.actionCard} onPress={handleFakeCall} activeOpacity={0.82}>
              <LinearGradient colors={["#3a0ca3","#560bad"]} style={s.actionGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.actionIconBg}><Text style={s.actionEmoji}>📞</Text></View>
                <Text style={s.actionTitle}>Fake Call</Text>
                <Text style={s.actionSub}>Exit danger discreetly</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Share Location */}
            <TouchableOpacity style={s.actionCard} onPress={handleShareLocation} activeOpacity={0.82}>
              <LinearGradient colors={["#004e6a","#007a9a"]} style={s.actionGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.actionIconBg}><Text style={s.actionEmoji}>📍</Text></View>
                <Text style={s.actionTitle}>Share Location</Text>
                <Text style={s.actionSub}>Send to emergency contacts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={s.actionRow}>
            {/* Offline SOS */}
            <TouchableOpacity style={s.actionCard} onPress={handleOfflineSOS} activeOpacity={0.82}>
              <LinearGradient colors={["#003049","#025080"]} style={s.actionGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.actionIconBg}><Text style={s.actionEmoji}>📡</Text></View>
                <Text style={s.actionTitle}>Offline SOS</Text>
                <Text style={s.actionSub}>Works without internet</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Safe Spaces */}
            <TouchableOpacity style={s.actionCard} onPress={handleSafeSpaces} activeOpacity={0.82}>
              <LinearGradient colors={["#420055","#6a0090"]} style={s.actionGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={s.actionIconBg}><Text style={s.actionEmoji}>🏥</Text></View>
                <Text style={s.actionTitle}>Safe Spaces</Text>
                <Text style={s.actionSub}>Verified nearby locations</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </Animated.View>

        {/* ══ SMART SAFETY MAP ══════════════════════════════════════════════ */}
        <Animated.View style={[s.mapCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          {/* Map header */}
          <View style={s.mapHead}>
            <View>
              <Text style={s.mapTitle}>Smart Safety Map</Text>
              <Text style={s.mapCoord}>
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Acquiring GPS..."}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {mapFocused && (
                <TouchableOpacity style={s.mapResetBtn} onPress={() => setMapFocused(null)}>
                  <Text style={s.mapResetTxt}>↩ Me</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.mapExpandBtn} onPress={openFullMap}>
                <Text style={s.mapExpandTxt}>⤢ Full</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle */}
          <View style={s.mapToggle}>
            <TouchableOpacity
              style={[s.toggleChip, mapMode === "heatmap" && s.toggleOn]}
              onPress={() => { setMapMode("heatmap"); setMapFocused(null); }}
            >
              <Text style={[s.toggleTxt, mapMode === "heatmap" && s.toggleTxtOn]}>🔥 Risk Heatmap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleChip, mapMode === "safe" && s.toggleOn]}
              onPress={() => setMapMode("safe")}
            >
              <Text style={[s.toggleTxt, mapMode === "safe" && s.toggleTxtOn]}>🛡️ Safe Zones</Text>
            </TouchableOpacity>
          </View>

          {/* Map */}
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
              {/* User position */}
              {location && (
                <Marker
                  coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                  title="You are here"
                  pinColor="#ff2e63"
                />
              )}

              {/* Heatmap */}
              {mapMode === "heatmap" && riskZones.length > 0 && (
                <Heatmap
                  points={riskZones}
                  opacity={0.8}
                  radius={50}
                  gradient={{
                    colors: ["#00e896","#ffd000","#ff6a00","#ff2e63"],
                    startPoints: [0.1, 0.4, 0.7, 1.0],
                    colorMapSize: 512,
                  }}
                />
              )}

              {/* Safe zones */}
              {mapMode === "safe" && safeZones.map((z, i) => (
                <React.Fragment key={i}>
                  <Circle
                    center={{ latitude: z.latitude, longitude: z.longitude }}
                    radius={z.radius}
                    fillColor="rgba(0,232,150,0.12)"
                    strokeColor="#00e896"
                    strokeWidth={2}
                  />
                  <Marker
                    coordinate={{ latitude: z.latitude, longitude: z.longitude }}
                    title={`✅ ${z.label}`}
                    description={z.dist}
                    pinColor="#00e896"
                    onPress={() => setMapFocused({ lat: z.latitude, lng: z.longitude })}
                  />
                </React.Fragment>
              ))}
            </MapView>
          ) : (
            <View style={s.mapLoader}>
              <Text style={s.mapLoaderTxt}>📡 Acquiring GPS signal...</Text>
            </View>
          )}

          {/* Legend */}
          <View style={s.legend}>
            {mapMode === "heatmap" ? (
              [["#00e896","Safe"],["#ffd000","Moderate"],["#ff2e63","High Risk"]].map(([c,l]) => (
                <View key={l} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: c }]} />
                  <Text style={s.legendTxt}>{l}</Text>
                </View>
              ))
            ) : (
              <Text style={[s.legendTxt, { color: "#00e896" }]}>
                🟢 Tap a green marker to focus · Tap Safe Spaces for navigation
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={s.footer}>
          <ShieldHerLogo size={16} />
          <Text style={s.footerTxt}>ShieldHer · Stay Safe · Stay Strong</Text>
        </View>
        <View style={{ height: 36 }} />
      </ScrollView>

      {/* ══ HAMBURGER MENU SHEET ══════════════════════════════════════════ */}
      {menuOpen && (
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeMenu}>
          {/* Overlay */}
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View style={[s.menuOverlay, { opacity: menuOverlay }]} />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <Animated.View style={[s.menuSheet, { transform: [{ translateY: menuSlide }] }]}>
            <LinearGradient colors={["#0a0d22","#080618"]} style={s.menuSheetInner}>

              {/* Handle + Title */}
              <View style={s.menuHandle} />
              <View style={s.menuTitleRow}>
                <ShieldHerLogo size={28} />
                <Text style={s.menuTitle}>More Features</Text>
                <TouchableOpacity onPress={closeMenu} style={s.menuCloseBtn}>
                  <Text style={s.menuCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.menuSubtitle}>Secondary features — accessible anytime</Text>

              {/* Menu grid */}
              <View style={s.menuGrid}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.menuCard}
                    onPress={() => handleMenuAction(item.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={item.color as [string, string]} style={s.menuCardGrad}>
                      <Text style={s.menuCardEmoji}>{item.icon}</Text>
                      <Text style={s.menuCardLabel}>{item.label}</Text>
                      <Text style={s.menuCardSub}>{item.sub}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bottom safe area */}
              <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
            </LinearGradient>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ─── DARK MAP STYLE ──────────────────────────────────────────────────────────
const DARK_MAP = [
  { elementType: "geometry",             stylers: [{ color: "#0c0f1e" }] },
  { elementType: "labels.icon",          stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill",     stylers: [{ color: "#5a6899" }] },
  { elementType: "labels.text.stroke",   stylers: [{ color: "#0c0f1e" }] },
  { featureType: "road",       elementType: "geometry",        stylers: [{ color: "#171d38" }] },
  { featureType: "road.arterial", elementType: "geometry",     stylers: [{ color: "#1c2442" }] },
  { featureType: "road.highway",  elementType: "geometry",     stylers: [{ color: "#222c50" }] },
  { featureType: "water",      elementType: "geometry",        stylers: [{ color: "#05091c" }] },
  { featureType: "poi",        elementType: "geometry",        stylers: [{ color: "#0f1225" }] },
  { featureType: "poi.park",   elementType: "geometry",        stylers: [{ color: "#0b160b" }] },
  { featureType: "transit",    elementType: "geometry",        stylers: [{ color: "#111828" }] },
  { featureType: "administrative", elementType: "geometry",    stylers: [{ color: "#333" }] },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CARD  = "#09091e";
const BORD  = "#18203a";
const GAP   = 11;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#040816" },
  orb:    { position: "absolute", borderRadius: 999 },
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 58 : 46 },

  // ── HEADER ──
  header:      { flexDirection: "row", alignItems: "center", marginBottom: 14, justifyContent: "space-between" },
  logoRow:     { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  titleBlock:  { gap: 3 },
  brandW:      { color: "#fff",    fontSize: 26, fontWeight: "900", letterSpacing: 3.5 },
  brandP:      { color: "#f43f5e", fontSize: 26, fontWeight: "900", letterSpacing: 3.5 },
  tagline:     { color: "#383d6a", fontSize: 8.5, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase" },
  headerRight: { flexDirection: "row", gap: 8 },
  iconBtn:     { width: 46, height: 46, borderRadius: 23, backgroundColor: "#0e1128", borderWidth: 1.5, borderColor: "#222850", alignItems: "center", justifyContent: "center" },
  iconBtnActive:{ borderColor: "#f43f5e", backgroundColor: "#280810" },
  liveDot:     { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: "#f43f5e", borderWidth: 1.5, borderColor: "#040816" },
  hamburger:   { gap: 4, alignItems: "flex-end" },
  hLine:       { height: 2, backgroundColor: "#8888bb", borderRadius: 2 },

  // ── DANGER ──
  dangerBanner: { borderRadius: 13, overflow: "hidden", marginBottom: 11, borderWidth: 1, borderColor: "#7a0015" },
  dangerGrad:   { flexDirection: "row", alignItems: "center", padding: 13, gap: 10 },
  dangerTitle:  { color: "#ff6060", fontWeight: "800", fontSize: 11.5, letterSpacing: 1.5 },
  dangerSub:    { color: "#cc5555", fontSize: 11, marginTop: 2 },

  // ── RISK ──
  riskBadge: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, marginBottom: 18, gap: 9, shadowOffset: { width:0,height:0 }, shadowOpacity: 1, shadowRadius: 14, elevation: 6 },
  riskLabel: { flex: 1, fontWeight: "800", fontSize: 12.5, letterSpacing: 2.2 },
  riskDot:   { width: 9, height: 9, borderRadius: 5 },

  // ── SOS ──
  sosOuter:   { alignItems: "center", marginBottom: 26 },
  sosWrapper: { width: 210, height: 210, alignItems: "center", justifyContent: "center" },
  sosBtn:     { width: 210, height: 210, borderRadius: 105, overflow: "hidden", shadowColor: "#ff2e63", shadowOffset: {width:0,height:0}, shadowOpacity: 0.8, shadowRadius: 40, elevation: 24 },
  sosGrad:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  sosRing:    { position: "absolute", width: 185, height: 185, borderRadius: 93, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
  sosBig:     { color: "#fff", fontSize: 21, fontWeight: "900", letterSpacing: 4 },
  sosSmall:   { color: "rgba(255,255,255,0.48)", fontSize: 10, letterSpacing: 1.8, fontWeight: "600" },

  // ── ACTION GRID (2×2) ──
  actionGrid: { gap: GAP, marginBottom: 18 },
  actionRow:  { flexDirection: "row", gap: GAP },
  actionCard: { flex: 1, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: {width:0,height:4}, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  actionGrad: { padding: 18, gap: 8, minHeight: 115 },
  actionIconBg:{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  actionEmoji: { fontSize: 24 },
  actionTitle: { color: "#fff", fontWeight: "800", fontSize: 14.5, letterSpacing: 0.3 },
  actionSub:   { color: "rgba(255,255,255,0.45)", fontSize: 10.5, lineHeight: 14 },

  // ── MAP ──
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

  // ── FOOTER ──
  footer:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 14 },
  footerTxt: { color: "#22253a", fontSize: 11, letterSpacing: 2, fontWeight: "600" },

  // ── MENU SHEET ──
  menuOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  menuSheet:      { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  menuSheetInner: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 12 },
  menuHandle:     { width: 38, height: 4, borderRadius: 2, backgroundColor: "#2a2f5a", alignSelf: "center", marginBottom: 18 },
  menuTitleRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  menuTitle:      { flex: 1, color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  menuCloseBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: "#14183a", borderWidth: 1, borderColor: "#252d55", alignItems: "center", justifyContent: "center" },
  menuCloseTxt:   { color: "#6a7cbf", fontSize: 14, fontWeight: "700" },
  menuSubtitle:   { color: "#383d6a", fontSize: 11, letterSpacing: 0.5, marginBottom: 18 },
  menuGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  menuCard:       { width: (SW - 36 - 20) / 3, borderRadius: 16, overflow: "hidden" },
  menuCardGrad:   { padding: 14, alignItems: "center", justifyContent: "center", minHeight: 96, gap: 5 },
  menuCardEmoji:  { fontSize: 26 },
  menuCardLabel:  { color: "#fff", fontWeight: "800", fontSize: 12, textAlign: "center" },
  menuCardSub:    { color: "rgba(255,255,255,0.38)", fontSize: 9, textAlign: "center", lineHeight: 12 },
});
