import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createInventoryMovement,
  listInventoryMovements,
  listProducts,
} from "../services/api.js";
import { FormModal } from "../components/FormModal.js";
import { shared } from "../styles/shared.js";

const MOVEMENT_TYPES = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SALIDA", label: "Salida" },
  { value: "AJUSTE", label: "Ajuste" },
];

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InventarioScreen({ token }) {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementType, setMovementType] = useState("ENTRADA");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  async function loadMovements() {
    setLoading(true);

    try {
      const result = await listInventoryMovements(token);

      setMovements(result.movimientos);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovements();
  }, [token]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProducts([]);
      return undefined;
    }

    let active = true;

    const timer = setTimeout(async () => {
      try {
        const result = await listProducts(token, productSearch.trim(), 1, 10);

        if (active) {
          setProducts(result.productos);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productSearch, token]);

  function openForm() {
    setSelectedProduct(null);
    setProductSearch("");
    setProducts([]);
    setMovementType("ENTRADA");
    setQuantity("");
    setReason("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!selectedProduct) {
      setError("Selecciona un producto.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Escribe una cantidad válida.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createInventoryMovement(token, {
        productoId: selectedProduct.id,
        tipo: movementType,
        cantidad: quantity,
        motivo: reason,
      });

      setShowForm(false);
      setSuccess("Movimiento registrado.");
      await loadMovements();
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : movements.length === 0 ? (
        <Text style={shared.empty}>No hay movimientos registrados.</Text>
      ) : (
        <FlatList
          contentContainerStyle={shared.listContent}
          data={movements}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={shared.card}>
              <View style={shared.cardTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={shared.cardTitle}>{item.producto?.nombre ?? "Producto"}</Text>

                  <Text style={shared.cardMeta}>
                    {item.tipo} · {formatDate(item.creadoEn)}
                  </Text>

                  {item.motivo ? <Text style={shared.cardMeta}>{item.motivo}</Text> : null}
                </View>

                <Text style={shared.cardValue}>{item.cantidad}</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={openForm} style={shared.fab}>
        <Text style={shared.fabText}>+</Text>
      </TouchableOpacity>

      <FormModal onClose={() => setShowForm(false)} title="Registrar movimiento" visible={showForm}>
            {error ? <Text style={shared.error}>{error}</Text> : null}

            <View style={shared.field}>
              <Text style={shared.label}>Producto *</Text>

              {selectedProduct ? (
                <View style={shared.row}>
                  <Text style={[shared.input, shared.rowField]}>{selectedProduct.nombre}</Text>

                  <TouchableOpacity
                    onPress={() => setSelectedProduct(null)}
                    style={shared.secondaryButton}
                  >
                    <Text style={shared.secondaryButtonText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TextInput
                    onChangeText={setProductSearch}
                    placeholder="Buscar producto"
                    style={shared.input}
                    value={productSearch}
                  />

                  {products.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => {
                        setSelectedProduct(product);
                        setProducts([]);
                      }}
                      style={shared.card}
                    >
                      <Text style={shared.cardTitle}>{product.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>

            <Text style={shared.label}>Tipo de movimiento</Text>

            <View style={shared.chipRow}>
              {MOVEMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setMovementType(type.value)}
                  style={[shared.chip, movementType === type.value && shared.chipActive]}
                >
                  <Text style={shared.chipText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={shared.field}>
              <Text style={shared.label}>Cantidad *</Text>

              <TextInput
                keyboardType="numeric"
                onChangeText={setQuantity}
                placeholder="0"
                style={shared.input}
                value={quantity}
              />
            </View>

            <View style={shared.field}>
              <Text style={shared.label}>Motivo</Text>

              <TextInput
                onChangeText={setReason}
                placeholder="Ejemplo: mercancía dañada"
                style={shared.input}
                value={reason}
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
