import React, { useState } from 'react';
import { View, Button, Alert, Linking, TextInput, StyleSheet, Text } from 'react-native';
import { TEXT_COLORS } from '../globalStyle/GlobalStyles';

const WhatsAppExample = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const sendWhatsApp = () => {
    const fullPhoneNumber = `+91${phoneNumber.trim()}`;

    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    const url = `https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", "WhatsApp is not installed on this device");
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(() => Alert.alert("Error", "An unexpected error occurred"));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number (+91):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 10-digit phone number"
        placeholderTextColor={TEXT_COLORS.primary}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="numeric"
        maxLength={10}
        underlineColorAndroid="transparent"
      />
      <Text style={styles.label}>Message:</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Enter your message"
        placeholderTextColor={TEXT_COLORS.primary}
        value={message}
        onChangeText={setMessage}
        underlineColorAndroid="transparent"
        multiline
      />
      <Button title="Send WhatsApp Message" onPress={sendWhatsApp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    padding: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
    color: TEXT_COLORS.primary
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    color: TEXT_COLORS.primary

  },
});

export default WhatsAppExample;
