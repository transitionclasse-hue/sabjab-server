import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  TouchableWithoutFeedback, Keyboard, Animated, Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../api/client"; 
import { useAuth } from "../../context/AuthContext";
import { useThemeGlobal } from "../../../App";
import COLORS from "../../theme/colors";

export default function OtpScreen({ route, navigation }) {
  const { phone } = route?.params || {}; 
  const { login } = useAuth();
  const { isDark } = useThemeGlobal();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const THEME = {
    bg: isDark ? "#0D0D0D" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1A1A1A",
    subText: isDark ? "#666666" : "#888888",
    inputBg: isDark ? "#1C1C1E" : "#F7F9FC",
    primary: COLORS.secondary,
  };

  const handleRequestEmailOtp = async () => {
    setLoading(true);
    try {
      await client.post("/customer/request-otp", { phone, email });
      Alert.alert("Success", "Code sent!");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally { setLoading(false); }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.safe, { backgroundColor: THEME.bg }]}>
        {/* behavior="none" prevents the UI from jumping over your inputs */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "none"} style={styles.container}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: THEME.text }]}>Authenticate</Text>
            <Text style={[styles.subtitle, { color: THEME.subText }]}>+91 {phone}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, { backgroundColor: THEME.inputBg }]}>
              <TextInput 
                value={email} 
                onChangeText={setEmail} 
                style={[styles.input, { color: THEME.text }]} 
                placeholder="email@example.com"
              />
              <TouchableOpacity onPress={handleRequestEmailOtp}>
                <Text style={{ color: THEME.primary, fontWeight: '700' }}>Get Code</Text>
              </TouchableOpacity>
            </View>

            {/* Added Z-Index to ensure this area is always clickable */}
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => inputRef.current?.focus()} 
              style={styles.otpSection}
            >
              <Text style={styles.label}>PASSCODE / OTP</Text>
              <View style={styles.otpContainer}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={[styles.otpBox, { backgroundColor: THEME.inputBg, borderColor: otp.length === i ? THEME.primary : '#EEE' }]}>
                    <Text style={[styles.otpText, { color: THEME.text }]}>{otp[i] || ""}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => Linking.openURL("whatsapp://send?phone=918839693471")} style={styles.helpBtn}>
              <Text style={{ color: THEME.text, fontWeight: '600' }}>Try SMS  |  Help</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={(t) => { setOtp(t); if (t.length === 4) handleVerify(t); }}
            maxLength={4}
            keyboardType="number-pad"
            style={{ position: 'absolute', opacity: 0, height: 0 }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24 },
  header: { marginTop: 20 },
  title: { fontSize: 32, fontWeight: '900' },
  subtitle: { fontSize: 16, marginTop: 5 },
  form: { marginTop: 40 },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 12, paddingHorizontal: 15 },
  input: { flex: 1, fontSize: 16 },
  otpSection: { marginTop: 30, zIndex: 10 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: { width: '22%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  otpText: { fontSize: 24, fontWeight: '800' },
  footer: { marginTop: 'auto', paddingBottom: 20, alignItems: 'center' }
});
