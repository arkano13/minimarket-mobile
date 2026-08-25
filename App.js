import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from "react-native";

import { CatalogoScreen } from "./src/screens/CatalogoScreen.js";
import { LoginScreen } from "./src/screens/LoginScreen.js";
import { getCurrentUser, logout } from "./src/services/api.js";
import { clearToken, loadToken, saveToken } from "./src/services/authStorage.js";
import { colors } from "./src/styles/theme.js";

export default function App() {
  const [restoringSession, setRestoringSession] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const storedToken = await loadToken();
        if (!storedToken) return;

        const result = await getCurrentUser(storedToken);
        if (active) {
          setToken(storedToken);
          setUser(result.usuario);
        }
      } catch {
        await clearToken();
      } finally {
        if (active) setRestoringSession(false);
      }
    }

    restoreSession();
    return () => { active = false; };
  }, []);

  async function handleLoggedIn(newToken, newUser) {
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function handleLogout() {
    try {
      await logout(token);
    } catch {
      // La sesión local se cierra aunque el servidor no responda.
    } finally {
      await clearToken();
      setToken(null);
      setUser(null);
    }
  }

  if (restoringSession) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Preparando tu catálogo...</Text>
      </View>
    );
  }

  if (!token) return <LoginScreen onLoggedIn={handleLoggedIn} />;

  return (
    <>
      <StatusBar backgroundColor={colors.surface} barStyle="dark-content" />
      <CatalogoScreen onLogout={handleLogout} token={token} user={user} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: { color: colors.textMuted, marginTop: 12, fontWeight: "600" },
});
