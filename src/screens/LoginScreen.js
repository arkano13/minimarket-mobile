import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";

import { login } from "../services/api.js";
import { colors, radius, shadow } from "../styles/theme.js";

export function LoginScreen({ onLoggedIn }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    if (!usuario.trim() || !contrasena) {
      setError("Escribe tu usuario y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(usuario.trim(), contrasena);

      onLoggedIn(result.token, result.usuario);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, "#2B8159"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.header}
      >
        <View style={styles.logo}>
          <Feather color={colors.surface} name="shopping-bag" size={28} />
        </View>
        <Text style={styles.headerTitle}>Minimarket 24/7</Text>

        <Text style={styles.headerSubtitle}>Control de catálogo e inventario</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>ACCESO AL SISTEMA</Text>

        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.helper}>Ingresa con el usuario asignado para comenzar.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Usuario</Text>

          <TextInput
            autoCapitalize="none"
            onChangeText={setUsuario}
            placeholder="Escribe tu usuario"
            style={styles.input}
            value={usuario}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>

          <TextInput
            autoCapitalize="none"
            onChangeText={setContrasena}
            placeholder="Escribe tu contraseña"
            secureTextEntry
            style={styles.input}
            value={contrasena}
          />
        </View>

        <TouchableOpacity
          disabled={loading}
          onPress={handleLogin}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    backgroundColor: colors.primaryDark,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingVertical: 30,
    alignItems: "center",
  },
  logo: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#c9d6cd",
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    padding: 24,
    ...shadow,
  },
  eyebrow: {
    color: "#1f7a4d",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1c1c1c",
    marginTop: 4,
  },
  helper: {
    color: "#6b6b6b",
    marginTop: 4,
    marginBottom: 16,
  },
  error: {
    color: "#b3261e",
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: "#3a3a3a",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d3c4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#0b1f17",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
