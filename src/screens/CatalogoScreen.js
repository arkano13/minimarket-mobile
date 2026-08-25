import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ComprasScreen } from "./ComprasScreen.js";
import { InventarioScreen } from "./InventarioScreen.js";
import { ProductosScreen } from "./ProductosScreen.js";
import { ProveedoresScreen } from "./ProveedoresScreen.js";
import { colors, radius, shadow } from "../styles/theme.js";

const SECTIONS = [
  { key: "PRODUCTOS", label: "Productos", title: "Mis productos", icon: "package" },
  { key: "INVENTARIO", label: "Inventario", title: "Movimientos", icon: "layers" },
  { key: "PROVEEDORES", label: "Proveedores", title: "Proveedores", icon: "truck" },
  { key: "COMPRAS", label: "Compras", title: "Compras", icon: "shopping-bag" },
];

export function CatalogoScreen({ token, user, onLogout }) {
  const [section, setSection] = useState("PRODUCTOS");
  const activeSection = SECTIONS.find((item) => item.key === section);
  const userName = user?.nombre ?? user?.usuario ?? "Usuario";

  function changeSection(nextSection) {
    if (nextSection === section) return;
    Haptics.selectionAsync().catch(() => {});
    setSection(nextSection);
  }

  function closeSession() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onLogout();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <Feather color={colors.surface} name="archive" size={20} />
        </View>

        <View style={styles.heading}>
          <Text style={styles.appName}>Minimarket 24/7</Text>
          <Text numberOfLines={1} style={styles.greeting}>Catálogo de {userName}</Text>
        </View>

        <TouchableOpacity
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
          hitSlop={8}
          onPress={closeSession}
          style={styles.logoutButton}
        >
          <Feather color={colors.textMuted} name="log-out" size={20} />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[colors.primaryDark, colors.primary, "#2B8159"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.pageHeading}
      >
        <View>
          <Text style={styles.eyebrow}>GESTIÓN DEL NEGOCIO</Text>
          <Text style={styles.pageTitle}>{activeSection.title}</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>En línea</Text>
        </View>
        <View pointerEvents="none" style={styles.heroCircleLarge} />
        <View pointerEvents="none" style={styles.heroCircleSmall} />
      </LinearGradient>

      <View style={styles.content}>
        {section === "PRODUCTOS" ? <ProductosScreen token={token} /> : null}
        {section === "INVENTARIO" ? <InventarioScreen token={token} /> : null}
        {section === "PROVEEDORES" ? <ProveedoresScreen token={token} /> : null}
        {section === "COMPRAS" ? <ComprasScreen token={token} /> : null}
      </View>

      <View style={styles.bottomBar}>
        {SECTIONS.map((item) => {
          const active = item.key === section;
          return (
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={item.key}
              onPress={() => changeSection(item.key)}
              style={styles.tab}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Feather
                  color={active ? colors.surface : colors.textMuted}
                  name={item.icon}
                  size={19}
                />
              </View>
              <Text numberOfLines={1} style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { flex: 1, minWidth: 0, marginLeft: 11 },
  appName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  greeting: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 104,
    overflow: "hidden",
  },
  eyebrow: { color: "#BFE7D0", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  pageTitle: { color: colors.surface, fontSize: 25, fontWeight: "900", marginTop: 4 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 2,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#8CE3AF" },
  statusText: { color: colors.surface, fontSize: 11, fontWeight: "700" },
  heroCircleLarge: { position: "absolute", width: 130, height: 130, borderRadius: 65, right: -54, top: -54, backgroundColor: "rgba(255,255,255,0.07)" },
  heroCircleSmall: { position: "absolute", width: 54, height: 54, borderRadius: 27, right: 76, bottom: -27, backgroundColor: "rgba(255,255,255,0.08)" },
  content: { flex: 1, backgroundColor: colors.background },
  bottomBar: {
    minHeight: 78,
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow,
  },
  tab: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: colors.primary },
  tabLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "600", marginTop: 4 },
  tabLabelActive: { color: colors.primaryDark, fontWeight: "800" },
});
