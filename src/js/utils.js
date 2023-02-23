export function crearUrl(url, params) {
  const urlObj = new URL(url);
  urlObj.search = new URLSearchParams(params).toString();
  return urlObj.href;
}

export function paramsToObject(params) {
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

export function removeHash(str) {
  return str.replace("#", "");
}

export function getUrlParams(url) {
  const decodedUrl = decodeURI(removeHash(url));
  const urlObj = new URL(decodedUrl);
  return paramsToObject(urlObj.searchParams);
}

export function guardarLocalStorage(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

export function limpiarLocalStorage() {
  localStorage.clear();
}

export function leerLocalStorage(clave, valorPorDefecto) {
  const valorStorage = JSON.parse(localStorage.getItem(clave));
  if (valorStorage === null) {
    return valorPorDefecto;
  } else {
    return valorStorage;
  }
}

export function apiToJson(rawResponse) {
  return rawResponse.json();
}

export async function mostrarToast(titulo, mensaje, color) {
  const $toast = document.createElement("ion-toast");
  $toast.header = titulo;
  $toast.message = mensaje;
  $toast.duration = 3000;
  $toast.color = color;

  document.body.appendChild($toast);
  $toast.present();
}

export function toastSuccess(mensaje) {
  mostrarToast("Exito", mensaje, "success");
}

export function toastError(mensaje) {
  mostrarToast("Error", mensaje, "danger");
}

export function validarDatosVacios(data) {
  let dataIt = Object.values(data);
  for (let elemento of dataIt) {
    if (
      elemento === null ||
      elemento === undefined ||
      elemento === "" ||
      elemento === NaN
    ) {
      return true;
    }
  }
  return false;
}

export function haversineDistance(a, b) {
  console.log("haversine", { a, b });
  const EARTH_RADIUS_IN_MEETERS = 6378137;
  const EARTH_RADIUS_IN_KILOMETERS = 6378;

  const R = EARTH_RADIUS_IN_MEETERS;
  const aLat = a.latitude || a.lat || a.latitud;
  const bLat = b.latitude || b.lat || b.latitud;
  const aLng = a.longitude || a.longitud || a.lng || a.lon;
  const bLng = b.longitude || b.longitud || b.lng || b.lon;
  const dLat = ((bLat - aLat) * Math.PI) / 180.0;
  const dLon = ((bLng - aLng) * Math.PI) / 180.0;
  const f =
    Math.pow(Math.sin(dLat / 2.0), 2) +
    Math.cos((aLat * Math.PI) / 180.0) *
      Math.cos((bLat * Math.PI) / 180.0) *
      Math.pow(Math.sin(dLon / 2.0), 2);
  const c = 2 * Math.atan2(Math.sqrt(f), Math.sqrt(1 - f));
  return R * c;
}
