import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { createSupplier, listSuppliers, updateSupplier } from "../services/api.js";
import { FormModal } from "../components/FormModal.js";
import { shared } from "../styles/shared.js";

const EMPTY_FORM = {
  nombre: "",
  telefono: "",
  correo: "",
  direccion: "",
};

export function ProveedoresScreen({ token }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadSuppliers(term = search) {
    setLoading(true);

    try {
      const result = await listSuppliers(token, term);

      setSuppliers(result.proveedores);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers("");
  }, [token]);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(supplier) {
    setForm({
      nombre: supplier.nombre ?? "",
      telefono: supplier.telefono ?? "",
      correo: supplier.correo ?? "",
      direccion: supplier.direccion ?? "",
    });
    setEditingId(supplier.id);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateSupplier(token, editingId, form);
        setSuccess("Proveedor actualizado.");
      } else {
        await createSupplier(token, form);
        setSuccess("Proveedor registrado.");
      }

      setShowForm(false);
      await loadSuppliers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={shared.screen}>
      {error && !showForm ? <Text style={shared.error}>{error}</Text> : null}
      {success ? <Text style={shared.success}>{success}</Text> : null}

      <View style={shared.searchRow}>
        <TextInput
          onChangeText={setSearch}
          onSubmitEditing={() => loadSuppliers()}
          placeholder="Buscar proveedor"
          style={shared.searchInput}
          value={search}
        />

        <TouchableOpacity onPress={() => loadSuppliers()} style={shared.searchButton}>
          <Text style={shared.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : suppliers.length === 0 ? (
        <Text style={shared.empty}>No hay proveedores registrados.</Text>
      ) : (
        <FlatList
          contentContainerStyle={shared.listContent}
          data={suppliers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={shared.card}>
              <Text style={shared.cardTitle}>{item.nombre}</Text>

              <Text style={shared.cardMeta}>
                {item.telefono || "Sin teléfono"} · {item.correo || "Sin correo"}
              </Text>

              <TouchableOpacity onPress={() => openEditForm(item)} style={shared.editButton}>
                <Text style={shared.editButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={openNewForm} style={shared.fab}>
        <Text style={shared.fabText}>+</Text>
      </TouchableOpacity>

      <FormModal
        onClose={() => setShowForm(false)}
        title={editingId ? "Editar proveedor" : "Nuevo proveedor"}
        visible={showForm}
      >
            {error ? <Text style={shared.error}>{error}</Text> : null}

            <View style={shared.field}>
              <Text style={shared.label}>Nombre *</Text>

              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, nombre: value }))}
                placeholder="Nombre del proveedor"
                style={shared.input}
                value={form.nombre}
              />
            </View>

            <View style={shared.field}>
              <Text style={shared.label}>Teléfono</Text>

              <TextInput
                keyboardType="phone-pad"
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, telefono: value }))
                }
                placeholder="0000-0000"
                style={shared.input}
                value={form.telefono}
              />
            </View>

            <View style={shared.field}>
              <Text style={shared.label}>Correo</Text>

              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(value) => setForm((current) => ({ ...current, correo: value }))}
                placeholder="correo@ejemplo.com"
                style={shared.input}
                value={form.correo}
              />
            </View>

            <View style={shared.field}>
              <Text style={shared.label}>Dirección</Text>

              <TextInput
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, direccion: value }))
                }
                placeholder="Dirección del proveedor"
                style={shared.input}
                value={form.direccion}
              />
            </View>

            <View style={shared.formActions}>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                style={shared.secondaryButton}
              >
                <Text style={shared.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={saving}
                onPress={handleSave}
                style={shared.primaryButton}
              >
                <Text style={shared.primaryButtonText}>
                  {saving ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
      </FormModal>
    </View>
  );
}
