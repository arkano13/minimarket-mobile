import Constants from "expo-constants";

// Cambia esto por la URL real de tu backend en Railway,
// o edítalo en app.json -> expo.extra.apiUrl
const API_URL = `${Constants.expoConfig?.extra?.apiUrl ?? "http://127.0.0.1:3001"}/api`;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(body?.error ?? "No se pudo completar la solicitud.");
  }

  return body;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export function login(usuario, contrasena) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usuario, contrasena }),
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", { headers: authHeaders(token) });
}

export function logout(token) {
  return request("/auth/logout", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function listCategories(token) {
  return request("/productos/categorias", { headers: authHeaders(token) });
}

export function createCategory(token, nombre) {
  return request("/productos/categorias", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ nombre }),
  });
}

export function listProducts(token, search = "", page = 1, perPage) {
  const params = new URLSearchParams();

  if (search) {
    params.set("buscar", search);
  }

  params.set("page", page);

  if (perPage) {
    params.set("perPage", perPage);
  }

  return request(`/productos?${params.toString()}`, { headers: authHeaders(token) });
}

export function createProduct(token, product) {
  return request("/productos", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(product),
  });
}

export function updateProduct(token, productId, product) {
  return request(`/productos/${productId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(product),
  });
}

export function getProductComponents(token, productId) {
  return request(`/productos/${productId}/componentes`, {
    headers: authHeaders(token),
  });
}

export function setProductComponents(token, productId, componentes) {
  return request(`/productos/${productId}/componentes`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ componentes }),
  });
}

export function listInventoryMovements(token, productId = "", page = 1) {
  const params = new URLSearchParams();

  if (productId) {
    params.set("productoId", productId);
  }

  params.set("page", page);

  return request(`/inventario/movimientos?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export function createInventoryMovement(token, movement) {
  return request("/inventario/movimientos", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(movement),
  });
}

export function listSuppliers(token, search = "") {
  const query = search ? `?buscar=${encodeURIComponent(search)}` : "";

  return request(`/proveedores${query}`, { headers: authHeaders(token) });
}

export function createSupplier(token, data) {
  return request("/proveedores", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateSupplier(token, supplierId, data) {
  return request(`/proveedores/${supplierId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function listPurchases(token, search = "", proveedorId = "") {
  const params = new URLSearchParams();

  if (search) {
    params.set("buscar", search);
  }

  if (proveedorId) {
    params.set("proveedorId", proveedorId);
  }

  const query = params.size ? `?${params.toString()}` : "";

  return request(`/compras${query}`, { headers: authHeaders(token) });
}

export function getPurchase(token, purchaseId) {
  return request(`/compras/${purchaseId}`, { headers: authHeaders(token) });
}

export function searchPurchaseSuppliers(token, search = "") {
  const query = search ? `?buscar=${encodeURIComponent(search)}` : "";

  return request(`/compras/proveedores${query}`, { headers: authHeaders(token) });
}

export function searchPurchaseProducts(token, search = "") {
  const query = search ? `?buscar=${encodeURIComponent(search)}` : "";

  return request(`/compras/productos${query}`, { headers: authHeaders(token) });
}

export function createPurchase(token, data) {
  return request("/compras", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function cancelPurchase(token, purchaseId) {
  return request(`/compras/${purchaseId}/anular`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function searchSaleProducts(token, search = "", clientId = "") {
  const params = new URLSearchParams();

  if (search) {
    params.set("buscar", search);
  }

  if (clientId) {
    params.set("clienteId", clientId);
  }

  const query = params.size ? `?${params.toString()}` : "";

  return request(`/ventas/productos${query}`, { headers: authHeaders(token) });
}

export function searchSaleClients(token, search = "") {
  const query = search ? `?buscar=${encodeURIComponent(search)}` : "";

  return request(`/ventas/clientes${query}`, { headers: authHeaders(token) });
}

export function repriceCart(token, presentacionIds, clienteId) {
  return request("/ventas/reprecio", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      presentacionIds,
      clienteId: clienteId ?? null,
    }),
  });
}

export function createSale(token, sale) {
  return request("/ventas", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(sale),
  });
}

export function getCurrentCashShift(token) {
  return request("/caja/actual", { headers: authHeaders(token) });
}

export function openCashShift(token, data) {
  return request("/caja/abrir", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function createCashMovement(token, data) {
  return request("/caja/movimientos", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function closeCashShift(token, data) {
  return request("/caja/cerrar", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}
