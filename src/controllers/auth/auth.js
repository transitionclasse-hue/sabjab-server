import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../api/client"; 

export default function OtpScreen({ route, navigation }) {
  const { phone } = route?.params || {};
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleRequestEmailOtp = async () => {
    setLoading(true);
    try {
      await client.post("/customer/request-otp", { phone, email });
      Alert.alert("Success", "Check your email for the code.");
      inputRef.current?.focus();
    } catch (e) { 
      const msg = e.response?.data?.message || e.message;
      Alert.alert("Connection Problem", msg); 
    } finally { setLoading(false); }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Authenticate</Text>
            <Text style={styles.subtitle}>+91 {phone}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="email@work.com" placeholderTextColor="#555" />
                <TouchableOpacity onPress={handleRequestEmailOtp}>
                  {loading ? <ActivityIndicator size="small" color="#FFB300" /> : <Text style={styles.getBtn}>Get Code</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.otpSection}>
              <Text style={styles.label}>PASSCODE / OTP</Text>
              <View style={styles.otpContainer}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={[styles.otpBox, { borderColor: otp.length === i ? '#FFB300' : '#333' }]}>
                    <Text style={styles.otpText}>{otp[i] || ""}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}><Text style={{ color: '#666' }}>Try SMS  |  Help</Text></View>
          <TextInput ref={inputRef} value={otp} onChangeText={setOtp} maxLength={4} keyboardType="number-pad" style={{ opacity: 0, height: 0 }} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 25 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#666', fontSize: 16, marginTop: 5 },
  inputGroup: { marginTop: 40 },
  label: { color: '#666', fontSize: 11, fontWeight: '800', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', height: 60, borderRadius: 15, paddingHorizontal: 15 },
  input: { flex: 1, color: '#FFF' },
  getBtn: { color: '#FFB300', fontWeight: '700' },
  otpSection: { marginTop: 30 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: { width: '22%', aspectRatio: 1, borderRadius: 15, borderWidth: 1, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  otpText: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  footer: { alignItems: 'center', paddingBottom: 20 }
});
