import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createCategory,
  createProduct,
  getProductComponents,
  listCategories,
  listProducts,
  setProductComponents,
  updateProduct,
} from "../services/api.js";
import { FormModal } from "../components/FormModal.js";
import { shared } from "../styles/shared.js";

const EMPTY_FORM = {
  nombre: "",
  codigoBarra: "",
  categoriaId: "",
  costo: "",
  precio: "",
  cambiaPrecioTurno: false,
  precioTurno2: "",
  precioTurno3: "",
  stockInicial: "",
  stockMinimo: "",
};

const AVATAR_COLORS = ["#0b1f17", "#1f7a4d", "#8a6d1c", "#334155", "#7a3b1f"];

function formatNumber(value) {
  return new Intl.NumberFormat("es-HN", { maximumFractionDigits: 3 }).format(value ?? 0);
}

function avatarColorFor(name) {
  const code = (name || "?").charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function ProductosScreen({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategoryField, setShowCategoryField] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState([]);
  const [componentSearch, setComponentSearch] = useState("");
  const [componentResults, setComponentResults] = useState([]);
  const [searchingComponents, setSearchingComponents] = useState(false);
  const [loadingComponents, setLoadingComponents] = useState(false);

  async function loadProducts(term = search) {
    setLoading(true);

    try {
      const result = await listProducts(token, term, 1);

      setProducts(result.productos);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    listCategories(token)
      .then((result) => setCategories(result.categorias))
      .catch((requestError) => setError(requestError.message));

    loadProducts("");
  }, [token]);

  useEffect(() => {
    if (!showForm || !isComposite || componentSearch.trim().length < 2) {
      setComponentResults([]);
      setSearchingComponents(false);
      return undefined;
    }

    let active = true;
    setSearchingComponents(true);

    const timer = setTimeout(() => {
      listProducts(token, componentSearch.trim(), 1, 10)
        .then((result) => {
          if (!active) return;
          setComponentResults(
            result.productos.filter(
              (product) =>
                product.id !== editingId &&
                !components.some((component) => component.productoId === product.id),
            ),
          );
        })
        .catch((requestError) => active && setError(requestError.message))
        .finally(() => active && setSearchingComponents(false));
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [componentSearch, components, editingId, isComposite, showForm, token]);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowCategoryField(false);
    setShowCategoryPicker(false);
    setIsComposite(false);
    setComponents([]);
    setComponentSearch("");
    setComponentResults([]);
    setShowForm(true);
  }

  async function openEditForm(product) {
    const presentation = product.presentacionPrincipal;
    const shiftTwoPrice = presentation?.preciosTurno?.find(
      (shiftPrice) => shiftPrice.turno === 2,
    );
    const shiftThreePrice = presentation?.preciosTurno?.find(
      (shiftPrice) => shiftPrice.turno === 3,
    );

    setForm({
      nombre: product.nombre ?? "",
      codigoBarra: presentation?.codigoBarra ?? "",
      categoriaId: product.categoria?.id ? String(product.categoria.id) : "",
      costo: String(product.costo ?? ""),
      precio: String(presentation?.precio ?? ""),
      cambiaPrecioTurno: product.modoPrecio === "POR_HORARIO",
      precioTurno2: shiftTwoPrice ? String(shiftTwoPrice.precio) : "",
      precioTurno3: shiftThreePrice ? String(shiftThreePrice.precio) : "",
      stockInicial: String(product.stock ?? ""),
      stockMinimo: String(product.stockMinimo ?? ""),
    });
    setEditingId(product.id);
    setError("");
    setSuccess("");
    setShowCategoryField(false);
    setShowCategoryPicker(false);
    setIsComposite(false);
    setComponents([]);
    setComponentSearch("");
    setComponentResults([]);
    setShowForm(true);

    setLoadingComponents(true);
    try {
      const result = await getProductComponents(token, product.id);
      const existing = result.componentes ?? [];
      setIsComposite(existing.length > 0);
      setComponents(
        existing.map((item) => ({
          productoId: item.producto.id,
          nombre: item.producto.nombre,
          tipo: item.producto.unidadInventario === "GRAMO" ? "PESO" : "UNIDAD",
          cantidad: String(item.cantidad),
        })),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingComponents(false);
    }
  }

  function addComponent(product) {
    setComponents((current) => [
      ...current,
      {
        productoId: product.id,
        nombre: product.nombre,
        tipo: product.presentacionPrincipal?.tipo ?? "UNIDAD",
        cantidad: "",
      },
    ]);
    setComponentSearch("");
    setComponentResults([]);
  }

  function updateComponentQuantity(productoId, cantidad) {
    setComponents((current) =>
      current.map((component) =>
        component.productoId === productoId ? { ...component, cantidad } : component,
      ),
    );
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      return;
    }

    try {
      const result = await createCategory(token, newCategoryName.trim());

      setCategories((current) => [...current, result.categoria]);
      setForm((current) => ({ ...current, categoriaId: String(result.categoria.id) }));
      setNewCategoryName("");
      setShowCategoryField(false);
      setShowCategoryPicker(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const selectedCategory = categories.find(
    (category) => String(category.id) === form.categoriaId,
  );

  async function handleSave() {
    if (!form.nombre.trim() || !form.precio) {
      setError("El nombre y el precio de venta son obligatorios.");
      return;
    }

    if (
      form.cambiaPrecioTurno &&
      (!form.precioTurno2 || Number(form.precioTurno2) <= 0 ||
        !form.precioTurno3 || Number(form.precioTurno3) <= 0)
    ) {
      setError("Escribe un precio válido para los turnos 2 y 3.");
      return;
    }

    if (isComposite && components.length === 0) {
      setError("Agrega al menos un componente al producto.");
      return;
    }

    if (
      isComposite &&
      components.some(
        (component) => !component.cantidad || Number(component.cantidad) <= 0,
      )
    ) {
      setError("Escribe una cantidad válida para cada componente.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let productId = editingId;
      if (editingId) {
        await updateProduct(token, editingId, form);
        setSuccess("Producto actualizado.");
      } else {
        const result = await createProduct(token, { ...form, tipoVenta: "UNIDAD" });
        productId = result.producto.id;
        setSuccess("Producto registrado.");
      }

      await setProductComponents(
        token,
        productId,
        isComposite
          ? components.map(({ productoId, cantidad }) => ({
              productoId,
              cantidad: Number(cantidad),
            }))
          : [],
      );

      setShowForm(false);
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={shared.screen}>
      {error ? <Text style={shared.error}>{error}</Text> : null}
      {success ? <Text style={shared.success}>{success}</Text> : null}

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Feather color="#8a8577" name="search" size={17} style={styles.searchIcon} />

          <TextInput
            onChangeText={setSearch}
            onSubmitEditing={() => loadProducts()}
            placeholder="Buscar por nombre, código o SKU"
            placeholderTextColor="#9a958a"
            style={styles.searchInput}
            value={search}
          />
        </View>

        <Pressable
          android_ripple={{ color: "#134d31" }}
          hitSlop={8}
          onPress={() => loadProducts()}
          style={({ pressed }) => [shared.searchButton, pressed && styles.pressedDim]}
        >
          <Text style={shared.searchButtonText}>Buscar</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#0b1f17" style={{ marginTop: 30 }} />
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather color="#b7b0a0" name="package" size={30} />

          <Text style={styles.emptyTitle}>
            {search.trim() ? "Sin resultados" : "Todavía no hay productos"}
          </Text>

          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? "Prueba con otro nombre, código o SKU."
              : "Pulsa el botón + para registrar el primero."}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={shared.listContent}
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={shared.card}>
              <View style={styles.row}>
                <View
                  style={[styles.avatar, { backgroundColor: avatarColorFor(item.nombre) }]}
                >
                  <Text style={styles.avatarText}>
                    {(item.nombre || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text numberOfLines={1} style={styles.productName}>
                    {item.nombre}
                  </Text>

                  <View style={styles.metaRow}>
                    <Feather color="#8a8577" name="tag" size={11} />

                    <Text numberOfLines={1} style={styles.metaText}>
                      {item.categoria?.nombre ?? "Sin categoría"}
                    </Text>

                    <Text style={styles.metaDot}>·</Text>

                    <Feather color="#8a8577" name="box" size={11} />

                    <Text style={styles.metaText}>
                      {formatNumber(item.stock)} disponibles
                    </Text>
                  </View>
                </View>

                <View style={styles.priceBlock}>
                  <Text style={styles.price}>
                    L {Number(item.presentacionPrincipal?.precio ?? 0).toFixed(2)}
                  </Text>
                  <Text style={styles.priceMode}>
                    {item.modoPrecio === "POR_HORARIO" ? "Por turno" : "Todo el día"}
                  </Text>
                </View>
              </View>

              <Pressable
                android_ripple={{ color: "#e2ddd0" }}
                hitSlop={6}
                onPress={() => openEditForm(item)}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressedDim]}
              >
                <Feather color="#1c1c1c" name="edit-2" size={13} />

                <Text style={shared.editButtonText}>Editar</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable
        android_ripple={{ color: "#134d31", radius: 28 }}
        hitSlop={8}
        onPress={openNewForm}
        style={({ pressed }) => [shared.fab, pressed && styles.pressedDim]}
      >
        <Feather color="#fff" name="plus" size={26} />
      </Pressable>

      <FormModal
        onClose={() => setShowForm(false)}
        title={editingId ? "Editar producto" : "Nuevo producto"}
        visible={showForm}
      >
        <View style={shared.field}>
          <Text style={shared.label}>Nombre *</Text>

          <TextInput
            onChangeText={(value) => setForm((current) => ({ ...current, nombre: value }))}
            placeholder="Ejemplo: Agua purificada 600 ml"
            style={shared.input}
            value={form.nombre}
          />
        </View>

        <View style={shared.field}>
          <Text style={shared.label}>Código de barras</Text>

          <TextInput
            onChangeText={(value) =>
              setForm((current) => ({ ...current, codigoBarra: value }))
            }
            placeholder="Escanea o escribe el código"
            style={shared.input}
            value={form.codigoBarra}
          />
        </View>

        <View style={shared.field}>
          <View style={styles.categoryLabelRow}>
            <Text style={shared.label}>Categoría</Text>

            <Pressable
              hitSlop={8}
              onPress={() => {
                setShowCategoryPicker(false);
                setShowCategoryField((current) => !current);
              }}
              style={styles.addCategoryButton}
            >
              <Feather color="#176B45" name="plus" size={14} />
              <Text style={styles.addCategoryText}>Nueva categoría</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              setShowCategoryField(false);
              setShowCategoryPicker((current) => !current);
            }}
            style={({ pressed }) => [styles.categorySelect, pressed && styles.pressedDim]}
          >
            <View style={styles.categorySelectIcon}>
              <Feather color="#176B45" name="tag" size={16} />
            </View>

            <Text
              numberOfLines={1}
              style={[styles.categorySelectText, !selectedCategory && styles.categoryPlaceholder]}
            >
              {selectedCategory?.nombre ?? "Seleccionar categoría"}
            </Text>

            <Feather
              color="#667069"
              name={showCategoryPicker ? "chevron-up" : "chevron-down"}
              size={18}
            />
          </Pressable>

          {showCategoryPicker ? (
            <View style={styles.categoryMenu}>
              {categories.length === 0 ? (
                <Text style={styles.categoryEmpty}>No hay categorías registradas.</Text>
              ) : (
                categories.map((category, index) => {
                  const selected = form.categoriaId === String(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        setForm((current) => ({
                          ...current,
                          categoriaId: String(category.id),
                        }));
                        setShowCategoryPicker(false);
                      }}
                      style={[
                        styles.categoryOption,
                        index < categories.length - 1 && styles.categoryOptionBorder,
                        selected && styles.categoryOptionSelected,
                      ]}
                    >
                      <Text style={[styles.categoryOptionText, selected && styles.categoryOptionTextSelected]}>
                        {category.nombre}
                      </Text>
                      {selected ? <Feather color="#176B45" name="check" size={17} /> : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}
        </View>

        {showCategoryField ? (
          <View style={[shared.row, styles.newCategoryForm]}>
            <TextInput
              onChangeText={setNewCategoryName}
              placeholder="Nombre de la categoría"
              style={[shared.input, shared.rowField]}
              value={newCategoryName}
            />

            <Pressable
              android_ripple={{ color: "#e2ddd0" }}
              onPress={handleCreateCategory}
              style={({ pressed }) => [shared.secondaryButton, pressed && styles.pressedDim]}
            >
              <Text style={shared.secondaryButtonText}>Guardar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={shared.row}>
          <View style={[shared.field, shared.rowField]}>
            <Text style={shared.label}>Costo</Text>

            <TextInput
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              onChangeText={(value) => setForm((current) => ({ ...current, costo: value }))}
              placeholder="0.00"
              style={shared.input}
              value={form.costo}
            />
          </View>

          <View style={[shared.field, shared.rowField]}>
            <Text style={shared.label}>Precio de venta *</Text>

            <TextInput
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              onChangeText={(value) => setForm((current) => ({ ...current, precio: value }))}
              placeholder="0.00"
              style={shared.input}
              value={form.precio}
            />
          </View>
        </View>

        <View style={styles.shiftSection}>
          <View style={styles.shiftHeading}>
            <View style={styles.shiftHeadingIcon}>
              <Feather color="#176B45" name="clock" size={17} />
            </View>
            <View style={styles.shiftHeadingText}>
              <Text style={styles.shiftTitle}>Precio según la hora</Text>
              <Text style={styles.shiftSubtitle}>Elige cómo se cobrará este producto.</Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              setForm((current) => ({
                ...current,
                cambiaPrecioTurno: false,
                precioTurno2: "",
                precioTurno3: "",
              }))
            }
            style={[
              styles.shiftOption,
              !form.cambiaPrecioTurno && styles.shiftOptionActive,
            ]}
          >
            <View style={[styles.radio, !form.cambiaPrecioTurno && styles.radioActive]}>
              {!form.cambiaPrecioTurno ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.shiftOptionText}>
              <Text style={styles.shiftOptionTitle}>Mismo precio todo el día</Text>
              <Text style={styles.shiftOptionHint}>Siempre usará el precio normal.</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              setForm((current) => ({ ...current, cambiaPrecioTurno: true }))
            }
            style={[
              styles.shiftOption,
              form.cambiaPrecioTurno && styles.shiftOptionActive,
            ]}
          >
            <View style={[styles.radio, form.cambiaPrecioTurno && styles.radioActive]}>
              {form.cambiaPrecioTurno ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.shiftOptionText}>
              <Text style={styles.shiftOptionTitle}>Cambia según el turno</Text>
              <Text style={styles.shiftOptionHint}>El precio normal se usa de 8 a. m. a 10 p. m.</Text>
            </View>
          </Pressable>

          {form.cambiaPrecioTurno ? (
            <View style={styles.shiftPrices}>
              <View style={shared.field}>
                <Text style={shared.label}>Turno 2 · 10 p. m. a 2 a. m. *</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, precioTurno2: value }))
                  }
                  placeholder="0.00"
                  returnKeyType="next"
                  style={shared.input}
                  value={form.precioTurno2}
                />
              </View>

              <View style={[shared.field, styles.lastShiftField]}>
                <Text style={shared.label}>Turno 3 · 2 a. m. a 8 a. m. *</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, precioTurno3: value }))
                  }
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder="0.00"
                  returnKeyType="done"
                  style={shared.input}
                  value={form.precioTurno3}
                />
              </View>
            </View>
          ) : null}
        </View>

        <View style={shared.row}>
          <View style={[shared.field, shared.rowField]}>
            <Text style={shared.label}>
              {editingId ? "Existencia actual" : "Existencia inicial"}
            </Text>

            <TextInput
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, stockInicial: value }))
              }
              placeholder="0"
              style={shared.input}
              value={form.stockInicial}
            />
          </View>

          <View style={[shared.field, shared.rowField]}>
            <Text style={shared.label}>Avisar cuando queden</Text>

            <TextInput
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, stockMinimo: value }))
              }
              placeholder="0"
              style={shared.input}
              value={form.stockMinimo}
            />
          </View>
        </View>

        <View style={styles.compositeSection}>
          <Pressable
            onPress={() => {
              setIsComposite((current) => !current);
              setComponentSearch("");
              setComponentResults([]);
            }}
            style={[styles.compositeToggle, isComposite && styles.compositeToggleActive]}
          >
            <View style={[styles.checkBox, isComposite && styles.checkBoxActive]}>
              {isComposite ? <Feather color="#fff" name="check" size={14} /> : null}
            </View>
            <View style={styles.compositeToggleText}>
              <Text style={styles.compositeTitle}>Producto compuesto</Text>
              <Text style={styles.compositeHint}>
                Al venderlo, descontará cantidades de otros productos.
              </Text>
            </View>
          </Pressable>

          {loadingComponents ? (
            <ActivityIndicator color="#176B45" style={styles.componentLoader} />
          ) : isComposite ? (
            <View style={styles.componentBuilder}>
              {components.length ? (
                <View style={styles.selectedComponents}>
                  <Text style={styles.componentGroupLabel}>Componentes agregados</Text>
                  {components.map((component) => (
                    <View key={component.productoId} style={styles.componentCard}>
                      <View style={styles.componentInfo}>
                        <Text numberOfLines={1} style={styles.componentName}>
                          {component.nombre}
                        </Text>
                        <Text style={styles.componentUnit}>
                          Cantidad por cada unidad vendida
                        </Text>
                      </View>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={(value) =>
                          updateComponentQuantity(component.productoId, value)
                        }
                        placeholder="0"
                        style={styles.componentQuantity}
                        value={component.cantidad}
                      />
                      <Text style={styles.componentUnitShort}>
                        {component.tipo === "PESO" ? "lb" : "und"}
                      </Text>
                      <Pressable
                        hitSlop={8}
                        onPress={() =>
                          setComponents((current) =>
                            current.filter(
                              (item) => item.productoId !== component.productoId,
                            ),
                          )
                        }
                        style={styles.removeComponent}
                      >
                        <Feather color="#9A3F36" name="trash-2" size={17} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noComponents}>
                  <Feather color="#7B857E" name="layers" size={20} />
                  <Text style={styles.noComponentsText}>
                    Busca abajo los productos que componen este artículo.
                  </Text>
                </View>
              )}

              <Text style={styles.componentGroupLabel}>Agregar componente</Text>
              <View style={styles.componentSearchWrap}>
                <Feather color="#7B857E" name="search" size={16} />
                <TextInput
                  onChangeText={setComponentSearch}
                  placeholder="Buscar producto por nombre"
                  placeholderTextColor="#929A94"
                  style={styles.componentSearchInput}
                  value={componentSearch}
                />
                {searchingComponents ? (
                  <ActivityIndicator color="#176B45" size="small" />
                ) : null}
              </View>

              {componentResults.length ? (
                <View style={styles.componentResults}>
                  {componentResults.map((product, index) => (
                    <Pressable
                      key={product.id}
                      onPress={() => addComponent(product)}
                      style={[
                        styles.componentResult,
                        index < componentResults.length - 1 &&
                          styles.componentResultBorder,
                      ]}
                    >
                      <View style={styles.resultIcon}>
                        <Feather color="#176B45" name="package" size={15} />
                      </View>
                      <View style={styles.componentInfo}>
                        <Text numberOfLines={1} style={styles.componentName}>
                          {product.nombre}
                        </Text>
                        <Text style={styles.componentUnit}>
                          {formatNumber(product.stock)} disponibles
                        </Text>
                      </View>
                      <Feather color="#176B45" name="plus-circle" size={20} />
                    </Pressable>
                  ))}
                </View>
              ) : componentSearch.trim().length >= 2 && !searchingComponents ? (
                <Text style={styles.noResults}>No hay productos disponibles para agregar.</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={shared.formActions}>
          <Pressable
            android_ripple={{ color: "#e2ddd0" }}
            onPress={() => setShowForm(false)}
            style={({ pressed }) => [shared.secondaryButton, pressed && styles.pressedDim]}
          >
            <Text style={shared.secondaryButtonText}>Cancelar</Text>
          </Pressable>

          <Pressable
            android_ripple={{ color: "#134d31" }}
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }) => [
              shared.primaryButton,
              (pressed || saving) && styles.pressedDim,
            ]}
          >
            <Text style={shared.primaryButtonText}>
              {saving ? "Guardando..." : "Guardar"}
            </Text>
          </Pressable>
        </View>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  pressedDim: {
    opacity: 0.7,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d3c4",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1c1c1c",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#1c1c1c",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    color: "#6b6b6b",
    fontSize: 12,
    flexShrink: 1,
  },
  metaDot: {
    color: "#c7c1b3",
    marginHorizontal: 1,
  },
  price: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1f7a4d",
  },
  priceBlock: { alignItems: "flex-end", marginLeft: 8 },
  priceMode: { color: "#667069", fontSize: 10, fontWeight: "600", marginTop: 2 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d9d3c4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 10,
  },
  categoryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  addCategoryText: {
    color: "#176B45",
    fontSize: 12,
    fontWeight: "700",
  },
  categorySelect: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  categorySelectIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8F4ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  categorySelectText: {
    flex: 1,
    minWidth: 0,
    color: "#17211B",
    fontSize: 15,
    fontWeight: "600",
  },
  categoryPlaceholder: { color: "#7B857E", fontWeight: "500" },
  categoryMenu: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  categoryOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  categoryOptionBorder: { borderBottomWidth: 1, borderBottomColor: "#EEF1EE" },
  categoryOptionSelected: { backgroundColor: "#E8F4ED" },
  categoryOptionText: { color: "#3E4942", fontSize: 14, fontWeight: "600" },
  categoryOptionTextSelected: { color: "#176B45", fontWeight: "800" },
  categoryEmpty: { color: "#667069", fontSize: 13, padding: 15, textAlign: "center" },
  newCategoryForm: {
    backgroundColor: "#F0F2EF",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  shiftSection: {
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 16,
    backgroundColor: "#F7F9F7",
    padding: 12,
    marginBottom: 14,
  },
  shiftHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  shiftHeadingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E8F4ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  shiftHeadingText: { flex: 1, minWidth: 0 },
  shiftTitle: { color: "#17211B", fontSize: 15, fontWeight: "800" },
  shiftSubtitle: { color: "#667069", fontSize: 12, marginTop: 2 },
  shiftOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 7,
  },
  shiftOptionActive: { borderColor: "#176B45", backgroundColor: "#E8F4ED" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#9AA39D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioActive: { borderColor: "#176B45" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#176B45" },
  shiftOptionText: { flex: 1, minWidth: 0 },
  shiftOptionTitle: { color: "#17211B", fontSize: 14, fontWeight: "700" },
  shiftOptionHint: { color: "#667069", fontSize: 11, lineHeight: 16, marginTop: 2 },
  shiftPrices: {
    borderTopWidth: 1,
    borderTopColor: "#DDE3DE",
    marginTop: 12,
    paddingTop: 12,
  },
  lastShiftField: { marginBottom: 0 },
  compositeSection: {
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 16,
    backgroundColor: "#F7F9F7",
    padding: 12,
    marginBottom: 14,
  },
  compositeToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    padding: 12,
  },
  compositeToggleActive: { borderColor: "#176B45", backgroundColor: "#E8F4ED" },
  checkBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#9AA39D",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkBoxActive: { borderColor: "#176B45", backgroundColor: "#176B45" },
  compositeToggleText: { flex: 1, minWidth: 0 },
  compositeTitle: { color: "#17211B", fontSize: 14, fontWeight: "800" },
  compositeHint: { color: "#667069", fontSize: 11, lineHeight: 16, marginTop: 2 },
  componentLoader: { marginVertical: 18 },
  componentBuilder: { paddingTop: 14 },
  selectedComponents: { marginBottom: 14 },
  componentGroupLabel: {
    color: "#3E4942",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },
  componentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 10,
    marginBottom: 7,
  },
  componentInfo: { flex: 1, minWidth: 0 },
  componentName: { color: "#17211B", fontSize: 13, fontWeight: "700" },
  componentUnit: { color: "#7B857E", fontSize: 10, marginTop: 2 },
  componentQuantity: {
    width: 58,
    borderWidth: 1,
    borderColor: "#D5DBD6",
    borderRadius: 9,
    backgroundColor: "#FAFBFA",
    color: "#17211B",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 7,
    marginLeft: 8,
  },
  componentUnitShort: { color: "#667069", fontSize: 11, width: 28, marginLeft: 5 },
  removeComponent: { padding: 5 },
  noComponents: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CDD4CE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  noComponentsText: { flex: 1, color: "#667069", fontSize: 11, lineHeight: 16, marginLeft: 8 },
  componentSearchWrap: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D5DBD6",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  componentSearchInput: { flex: 1, color: "#17211B", fontSize: 14, paddingVertical: 11, marginLeft: 8 },
  componentResults: {
    borderWidth: 1,
    borderColor: "#DDE3DE",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginTop: 7,
    overflow: "hidden",
  },
  componentResult: { flexDirection: "row", alignItems: "center", padding: 10 },
  componentResultBorder: { borderBottomWidth: 1, borderBottomColor: "#EEF1EE" },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8F4ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  noResults: { color: "#7B857E", fontSize: 11, textAlign: "center", paddingTop: 10 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 40,
    padding: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d9d3c4",
    borderRadius: 14,
  },
  emptyTitle: {
    color: "#3a3a3a",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 4,
  },
  emptySubtitle: {
    color: "#8a8577",
    fontSize: 13,
    textAlign: "center",
  },
});
