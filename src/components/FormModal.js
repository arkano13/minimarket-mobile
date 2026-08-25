import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { shared } from "../styles/shared.js";

export function FormModal({ visible, title, onClose, children }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
          <View style={shared.modalOverlay}>
            <View style={shared.modalCard}>
              <View style={shared.modalHandle} />

              <View style={shared.modalHeader}>
                <Text style={shared.modalTitle}>{title}</Text>

                <TouchableOpacity onPress={onClose} style={shared.modalCloseButton}>
                  <Text style={shared.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                  <View collapsable={false}>
                    {children}

                    <View style={{ height: 8 }} />
                  </View>
              </ScrollView>
            </View>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
