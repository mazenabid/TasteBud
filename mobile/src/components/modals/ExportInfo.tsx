import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

interface ExportInfoProps {
  visible: boolean;
  onClose: () => void;
}

export function ExportInfo({ visible, onClose }: ExportInfoProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose} 
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.card }]}
          onStartShouldSetResponder={() => true}
        >
          <Ionicons
            name="mail"
            size={48}
            color={theme.primary}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            Export Requested
          </Text>
          <Text style={[styles.modalText, { color: theme.textSecondary }]}>
            Your monthly report is being prepared. You will receive an email
            shortly.
          </Text>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>OK</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    width: "80%",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
});