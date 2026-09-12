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
  createPurchase,
  listPurchases,
  searchPurchaseProducts,
  searchPurchaseSuppliers,
} from "../services/api.js";
import { FormModal } from "../components/FormModal.js";
import { shared } from "../styles/shared.js";

function formatMoney(value) {
  return new Intl.NumberFormat("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-HN", { dateStyle: "short" }).format(new Date(value));
}

export function ComprasScreen({ token }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierResults, setSupplierResults] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [items, setItems] = useState([]);

  const total = items.reduce((sum, item) => sum + Number(item.costoTotal || 0), 0);

  async function loadPurchases() {
    setLoading(true);

    try {
      const result = await listPurchases(token);

      setPurchases(result.compras);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchases();
  }, [token]);

  useEffect(() => {
    if (!supplierSearch.trim() || selectedSupplier) {
      setSupplierResults([]);
      return undefined;
    }

    let active = true;

    const timer = setTimeout(async () => {
      try {
        const result = await searchPurchaseSuppliers(token, supplierSearch.trim());

        if (active) {
          setSupplierResults(result.proveedores);
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
  }, [supplierSearch, selectedSupplier, token]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return undefined;
    }

    let active = true;

    const timer = setTimeout(async () => {
      try {
        const result = await searchPurchaseProducts(token, productSearch.trim());

        if (active) {
          setProductResults(result.productos);
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
    setSelectedSupplier(null);
    setSupplierSearch("");
    setSupplierResults([]);
    setProductSearch("");
    setProductResults([]);
    setItems([]);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function addItem(product) {
    setItems((current) => {
      const existing = current.find((item) => item.presentacionId === product.presentacionId);

      if (existing) {
        return current.map((item) =>
          item.presentacionId === product.presentacionId
            ? { ...item, cantidad: String(Number(item.cantidad) + 1) }
            : item,
        );
      }

      return [...current, { ...product, cantidad: "1", costoTotal: "" }];
    });

    setProductSearch("");
    setProductResults([]);
  }

  function updateItem(presentationId, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.presentacionId === presentationId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeItem(presentationId) {
    setItems((current) => current.filter((item) => item.presentacionId !== presentationId));
  }

  async function handleSave() {
    if (!selectedSupplier) {
      setError("Selecciona un proveedor.");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    if (items.some((item) => !item.cantidad || Number(item.cantidad) <= 0)) {
      setError("Revisa la cantidad de cada producto.");
      return;
    }

    if (items.some((item) => !item.costoTotal || Number(item.costoTotal) <= 0)) {
      setError("Escribe el costo total de cada producto.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createPurchase(token, {
        proveedorId: selectedSupplier.id,
        productos: items.map((item) => ({
          presentacionId: item.presentacionId,
          cantidad: Number(item.cantidad),
          costoTotal: Number(item.costoTotal),
        })),
      });

      setShowForm(false);
      setSuccess("Compra registrada.");
      await loadPurchases();
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
      ) : purchases.length === 0 ? (
        <Text style={shared.empty}>No hay compras registradas.</Text>
      ) : (
        <FlatList
          contentContainerStyle={shared.listContent}
          data={purchases}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={shared.card}>
              <View style={shared.cardTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={shared.cardTitle}>{item.proveedor?.nombre ?? "Proveedor"}</Text>

                  <Text style={shared.cardMeta}>{formatDate(item.creadoEn)}</Text>
                </View>

                <Text style={shared.cardValue}>L {formatMoney(item.total)}</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={openForm} style={shared.fab}>
        <Text style={shared.fabText}>+</Text>
      </TouchableOpacity>

      <FormModal onClose={() => setShowForm(false)} title="Nueva compra" visible={showForm}>
            {error ? <Text style={shared.error}>{error}</Text> : null}

            <View style={shared.field}>
              <Text style={shared.label}>Proveedor *</Text>

              {selectedSupplier ? (
                <View style={shared.row}>
                  <Text style={[shared.input, shared.rowField]}>{selectedSupplier.nombre}</Text>

                  <TouchableOpacity
                    onPress={() => setSelectedSupplier(null)}
                    style={shared.secondaryButton}
                  >
                    <Text style={shared.secondaryButtonText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TextInput
                    onChangeText={setSupplierSearch}
                    placeholder="Buscar proveedor"
                    style={shared.input}
                    value={supplierSearch}
                  />

                  {supplierResults.map((supplier) => (
                    <TouchableOpacity
                      key={supplier.id}
                      onPress={() => {
                        setSelectedSupplier(supplier);
                        setSupplierResults([]);
                      }}
                      style={shared.card}
                    >
                      <Text style={shared.cardTitle}>{supplier.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>

            <View style={shared.field}>
              <Text style={shared.label}>Agregar producto</Text>

              <TextInput
                onChangeText={setProductSearch}
                placeholder="Buscar producto"
                style={shared.input}
                value={productSearch}
              />

              {productResults.map((product) => (
                <TouchableOpacity
                  key={product.presentacionId}
                  onPress={() => addItem(product)}
                  style={shared.card}
                >
                  <Text style={shared.cardTitle}>{product.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {items.map((item) => (
              <View key={item.presentacionId} style={shared.card}>
                <View style={shared.cardTitleRow}>
                  <Text style={shared.cardTitle}>{item.nombre}</Text>

                  <TouchableOpacity onPress={() => removeItem(item.presentacionId)}>
                    <Text style={shared.removeText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={shared.row}>
                  <View style={shared.rowField}>
                    <Text style={shared.label}>Cantidad</Text>

                    <TextInput
                      keyboardType="numeric"
                      onChangeText={(value) => updateItem(item.presentacionId, "cantidad", value)}
                      style={shared.input}
                      value={item.cantidad}
                    />
                  </View>

                  <View style={shared.rowField}>
                    <Text style={shared.label}>Costo total</Text>

                    <TextInput
                      keyboardType="numeric"
                      onChangeText={(value) =>
                        updateItem(item.presentacionId, "costoTotal", value)
                      }
                      style={shared.input}
                      value={item.costoTotal}
                    />
                  </View>
                </View>

                {item.costoTotal && Number(item.cantidad) > 0 ? (
                  <Text style={shared.cardMeta}>
                    L {formatMoney(Number(item.costoTotal) / Number(item.cantidad))} por unidad
                  </Text>
                ) : null}
              </View>
            ))}

            {items.length > 0 ? (
              <Text style={[shared.cardValue, { textAlign: "right", marginBottom: 10 }]}>
                Total: L {formatMoney(total)}
              </Text>
            ) : null}

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
                  {saving ? "Guardando..." : "Guardar compra"}
                </Text>
              </TouchableOpacity>
            </View>
      </FormModal>
    </View>
  );
}