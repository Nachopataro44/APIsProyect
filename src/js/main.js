import {
  crearUrl,
  paramsToObject,
  removeHash,
  getUrlParams,
  guardarLocalStorage,
  limpiarLocalStorage,
  leerLocalStorage,
  apiToJson,
  mostrarToast,
  toastSuccess,
  toastError,
  validarDatosVacios,
  haversineDistance,
} from "./utils";

import { Geolocation } from "@capacitor/geolocation";
import { Share } from "@capacitor/share";
import { loadingController } from "@ionic/core";

const baseUrl = "https://dwallet.develotion.com";
const $ = {};
const estadoGlobal = {};
let tokenUsuario;
let idUsuario;

function share() {
  let options = {
    Text: "Me gustó la aplicación",
    title: "Me gusto la app",
    dialogTitle: "Me gusto la app",
    url: "https://dwallet.develotion.com/site/",
  };
  Share.share(options);
}
iniciarApp();

//#region Funcionalidades
function iniciarApp() {
  guardarelementos();
  agregarEventos();
  ValidarBtnLogout();
  console.log("sesion actual", obtenerSesionUsuario());
}

function guardarelementos() {
  $.ionRouter = document.querySelector("ion-router");
  $.ionMenu = document.querySelector("ion-menu");
  $.modalNuevoPedido = document.querySelector("#modalNuevoPedido");
  $.itemLogout = document.querySelector("#LogoutItem");
  $.btnLogout = document.querySelector("#buttonLogout");

  $.SelectTipoDeMovimiento = document.querySelector("#selectTipoMovimiento");
  $.SelectMovimiento = document.querySelector("#selectMovimiento");
  $.DistanciaEscogida = document.querySelector("#inpDistancia");

  $.formRegistro = document.querySelector("#formRegistroUsuario");
  $.formLogin = document.querySelector("#formLoginUsuario");
  $.formMovimiento = document.querySelector("#formMovimiento");
  $.selectDepartamento = document.querySelector("#selectDepartamento");
}

function agregarEventos() {
  $.ionRouter.addEventListener("ionRouteDidChange", manejarRuta);

  $.ionMenu
    .querySelectorAll("ion-item")
    .forEach(($item) => $item.addEventListener("click", cerrarMenu));

  $.formRegistro.addEventListener("submit", manejarRegistoUsuario);
  $.formLogin.addEventListener("submit", manejarLoginUsuario);
  $.formMovimiento.addEventListener("submit", manejarMovimiento);
  $.selectDepartamento.addEventListener("ionChange", obtenerCiudades);
  $.btnLogout.addEventListener("click", logoutUsuario);

  $.DistanciaEscogida.addEventListener("ionChange", inicializarPageCajeros);
  $.SelectMovimiento.addEventListener("ionChange", escribirFormMovimientos);
  $.SelectTipoDeMovimiento.addEventListener("ionChange", obtenerMovimientos);

  document.querySelector("#ShareButton").addEventListener("click", share);
}

function LoginSuccess() {
  navegarPage("/");
  ValidarBtnLogout();
  toastSuccess("Bienvenido/a");
  obtenerMovimientos();
}

async function mostrarLoading(mensaje) {
  $.loading = await loadingController.create({
    message: mensaje,
  });

  $.loading.present();
}

function ocultarLoading() {
  $.loading.dismiss();
}
//#endregion

//#region navegacion

function ValidarBtnLogout() {
  if (obtenerSesionUsuario() !== null) {
    $.itemLogout.disabled = false;
  } else {
    $.btnLogout.disabled = true;
  }
}

function validarSesion(path) {
  const sesionUsuario = obtenerSesionUsuario();
  if (path !== "/login" && path !== "/registro") {
    if (sesionUsuario === null) {
      navegarPage("/login");
      return false;
    }
  } else {
    if (sesionUsuario !== null) {
      navegarPage("/");
      return false;
    }
  }
  return true;
}

function cerrarMenu() {
  $.ionMenu.close();
}

//#region nav entre paginas

function manejarRuta(event) {
  const pathTo = event.detail.to;
  console.log("ruta", pathTo);

  ocultarPaginas();
  const sesionValida = validarSesion(pathTo);

  if (sesionValida) {
    switch (pathTo) {
      case "/":
        activarPage("#page-home");
        inicializarPageHome();
        break;
      case "/login":
        activarPage("#page-login");
        break;
      case "/registro":
        activarPage("#page-registro");
        inicializarPageRegistro();
        break;
      case "/movimiento":
        activarPage("#page-movimiento");
        inicializarPageGasto();
        break;
      case "/ListarMovimientos":
        activarPage("#page-ListarMovimientos");
        inicializarPageListMovimientos();
        break;
      case "/eliminar-movimiento":
        iniciarEliminarProducto();
        break;
      case "/Cajeros":
        activarPage("#page-VerCajeros");
        inicializarPageCajeros();
        break;
    }
  }
}

function inicializarPageHome() {
  obtenerMovimientos();
}

function inicializarPageListMovimientos() {
  obtenerMovimientos();
}

function inicializarPageRegistro() {
  obtenerDepartamentos();
}

function inicializarPageGasto() {}

function activarPage(id) {
  document.querySelector(id).classList.add("page-active");
}

function navegarPage(id) {
  $.ionRouter.push(id);
}

function ocultarPaginas() {
  document.querySelectorAll("ion-page").forEach(function (page) {
    page.classList.remove("page-active");
  });
}

//#endregion

//#region escribir y obtener

function obtenerDepartamentos() {
  const headers = {
    "Content-Type": "application/json",
  };

  fetch(`${baseUrl}/departamentos.php`, {
    method: "GET",
    headers: headers,
  })
    .then(function (rawResponse) {
      return rawResponse.json();
    })
    .then(function (jsonResponse) {
      console.log(jsonResponse);
      jsonResponse.departamentos.forEach(function (element) {
        document.querySelector(
          "#selectDepartamento"
        ).innerHTML += `$<ion-select-option value="${element.id}">${element.nombre}</ion-select-option>`;
      });
    })
    .catch(function (error) {
      console.warn(error);
    });
}

function obtenerCiudades() {
  const departamentoSelected = document.querySelector(
    "#selectDepartamento"
  ).value;
  const selectCiudad = document.querySelector("#selectCiudad");

  selectCiudad.disabled = false;

  const headers = {
    "Content-Type": "application/json",
  };

  fetch(`${baseUrl}/ciudades.php?idDepartamento=${departamentoSelected}`, {
    method: "GET",
    headers: headers,
  })
    .then(function (rawResponse) {
      return rawResponse.json();
    })
    .then(function (jsonResponse) {
      console.log(jsonResponse);
      jsonResponse.ciudades.forEach(function (element) {
        selectCiudad.innerHTML += `$<ion-select-option value="${element.id}">${element.nombre}</ion-select-option>`;
      });
    })
    .catch(function (error) {
      console.warn(error);
    });
}

function escribirFormMovimientos() {
  const $rubro = document.querySelector("#selectRubro");
  const $Medio = document.querySelector("#selectMedio");
  document.querySelector(".itemMovimiento").disabled = "false";
  document.querySelector("#warnFormMovimiento").innerHTML = "";
  if ($.SelectMovimiento.value == "ingreso") {
    $rubro.innerHTML = "";
    $Medio.innerHTML = "";
    //$rubro.innerHTML = escribirRubroParaIngreso();
    $rubro.innerHTML = obtenerRubros("Ingreso");
    $Medio.innerHTML = escribirMedioParaIngreso();
  } else if ($.SelectMovimiento.value == "egreso") {
    $rubro.innerHTML = "";
    $Medio.innerHTML = "";
    $rubro.innerHTML = obtenerRubros("Egreso");
    $Medio.innerHTML = escribirMedioParaEgreso();
  }
}

function obtenerRubros(type) {
  let id;
  let endId;
  if (type == "Ingreso") {
    id = 7;
    endId = 12;
  } else if (type == "Egreso") {
    id = 0;
    endId = 6;
  }

  const image = "https://dwallet.develotion.com/imgs/";

  const headers = {
    "Content-Type": "application/json",
    apikey: obtenerSesionUsuario(),
  };

  fetch(`${baseUrl}/rubros.php`, {
    method: "GET",
    headers: headers,
  })
    .then(function (rawResponse) {
      return rawResponse.json();
    })
    .then(function (jsonResponse) {
      jsonResponse.rubros.forEach(function (element) {
        if (element.id >= id && element.id <= endId) {
          document.querySelector(
            "#selectRubro"
          ).innerHTML += `$<ion-select-option value="${element.id}">${element.nombre} <ion-img src="https://dwallet.develotion.com/imgs/${element.imagen}"></ion-img>`;
        }
      });
    })
    .catch(function (error) {
      console.warn(error);
    });
}

function escribirMedioParaIngreso() {
  return '<ion-select-option value="efectivo">Efectivo</ion-select-option><ion-select-option value="banco">Banco</ion-select-option>';
}

function escribirMedioParaEgreso() {
  return '<ion-select-option value="efectivo">Efectivo</ion-select-option><ion-select-option value="debito">Debito</ion-select-option><ion-select-option value="credito">Credito</ion-select-option>';
}

//#endregion

//#region Saldo

function obtenerSaldo(jsonResponse) {
  let Saldo = 0;
  let SaldoIngreso = 0;
  let SaldoGasto = 0;
  for (let movimiento of jsonResponse.movimientos) {
    if (movimiento.categoria >= 7) {
      Saldo += movimiento.total;
      SaldoIngreso += movimiento.total;
    } else if (movimiento.categoria <= 6) {
      Saldo -= movimiento.total;
      SaldoGasto += movimiento.total;
    }
  }
  document.querySelector("#saldoHome").innerHTML = "$ " + Saldo;
  document.querySelector("#saldoHomeGasto").innerHTML =
    "Gasto: $ " + SaldoGasto;
  document.querySelector("#saldoHomeIngreso").innerHTML =
    "ingreso: $ " + SaldoIngreso;
}

//#endregion

//#endregion

//#region registro

function manejarRegistoUsuario(event) {
  event.preventDefault();

  const datos = leerFormRegistro();

  registrarUsuario(datos);
}

function leerFormRegistro() {
  return {
    usuario: $.formRegistro.querySelector("#inpUsuario").value,
    password: $.formRegistro.querySelector("#inpPassword").value,
    idDepartamento: $.formRegistro.querySelector("#selectDepartamento").value,
    idCiudad: $.formRegistro.querySelector("#selectCiudad").value,
  };
}
function registrarUsuario(usuario) {
  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    usuario: usuario.usuario,
    password: usuario.password,
    idDepartamento: usuario.idDepartamento,
    idCiudad: usuario.idCiudad,
  };

  if (!validarDatosVacios(data)) {
    fetch(`${baseUrl}/usuarios.php`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((rawResponse) => rawResponse.json())
      .then(function (jsonResponse) {
        if (jsonResponse.codigo < 300) {
          console.log("jsonRespoone", jsonResponse);
          tokenUsuario = jsonResponse.apiKey;
          idUsuario = jsonResponse.id;
          LoginSuccess();
          guardarSesionUsuario();
        } else {
          throw jsonResponse.mensaje;
        }
      })
      .catch(function (mensaje) {
        toastError(mensaje);
      });
  } else {
    toastError("No pueden haber campos vacios");
    navegarPage("/registro");
  }
  $.formRegistro.reset();
}
//#endregion

//#region Login

function manejarLoginUsuario(event) {
  event.preventDefault();

  const datos = leerFormLogin();
  console.log("login", datos);

  loginUsuario(datos);
}

function leerFormLogin() {
  return {
    usuario: $.formLogin.querySelector("#inpEmail").value,
    password: $.formLogin.querySelector("#inpPass").value,
  };
}

function loginUsuario(usuario) {
  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    usuario: usuario.usuario,
    password: usuario.password,
  };
  console.log("data", data);
  console.log("headers", headers);
  if (!validarDatosVacios(data)) {
    fetch(`${baseUrl}/login.php`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    })
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (jsonResponse) {
        console.log(jsonResponse);
        if (jsonResponse.codigo < 300) {
          tokenUsuario = jsonResponse.apiKey;
          idUsuario = jsonResponse.id;
          guardarSesionUsuario();
          LoginSuccess();
        } else {
          throw jsonResponse.mensaje;
        }
      })
      .catch(function (mensaje) {
        toastError(mensaje);
      });
  } else {
    toastError("no pueden haber campos vacios");
  }
  $.formLogin.reset();
}
//#endregion

//#region Logout
function logoutUsuario() {
  limpiarLocalStorage();
  tokenUsuario = null;
  idUsuario = null;
  navegarPage("/login");
  console.log("session after logout", obtenerSesionUsuario());
}
//#endregion

//#region GuardarSessiones
function guardarSesionUsuario() {
  console.log("estamos en guardar sesion usuario");
  guardarLocalStorage("tokenUsuario", tokenUsuario);
  guardarLocalStorage("idUsuario", idUsuario);
}

function obtenerSesionUsuario() {
  return leerLocalStorage("tokenUsuario", null);
}
function obtenerIdUsuario() {
  return leerLocalStorage("idUsuario", null);
}
//#endregion

//#region obtenerCajeros

function obtenerCajeros() {
  const headers = {
    "Content-Type": "application/json",
  };

  fetch(`${baseUrl}/cajeros.php`, {
    method: "GET",
    headers: headers,
  })
    .then(apiToJson)
    .then(escribirCajeros)
    .catch(function (error) {
      toastError(error);
      console.log(error);
    });
}

async function obtenerPosicionUsuario() {
  const posicion = await Geolocation.getCurrentPosition();
  estadoGlobal.posicionUsuario = posicion.coords;
  return posicion.coords;
}

async function inicializarPageCajeros() {
  const posicionUsuario = await obtenerPosicionUsuario();
  obtenerCajeros();

  const latLng = [posicionUsuario.latitude, posicionUsuario.longitude];
  cargarMapa(latLng);
  agregarMarcador(latLng);
  agregarPresicion(latLng, $.DistanciaEscogida.value);
}

function cargarMapa(latLng) {
  console.log("mapa", latLng);

  if ($.map !== undefined) {
    $.map.remove();
  }

  $.map = L.map("cajerosMapa").setView(latLng, 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo($.map);
}

function agregarMarcador(latLng, popup) {
  let marker;

  marker = L.marker(latLng).addTo($.map);

  if (popup !== undefined) {
    marker.bindPopup(popup);
  }
}

function agregarPresicion(latLng, accuracy) {
  L.circle(latLng, {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.2,
    radius: accuracy,
  }).addTo($.map);
}

function escribirCajeros(jsonResponse) {
  console.log("sucursales mapa", jsonResponse);

  const cajeros = jsonResponse.cajeros;

  cajeros.forEach(function (element) {
    const pintCajero = {
      lat: element.latitud,
      lng: element.longitud,
    };
    const pointUsuario = {
      lat: estadoGlobal.posicionUsuario.latitude,
      lng: estadoGlobal.posicionUsuario.longitude,
    };
    if (
      parseInt(haversineDistance(pintCajero, pointUsuario)) <
      $.DistanciaEscogida.value
    ) {
      const latLng = [element.latitud, element.longitud];

      const distancia = parseInt(haversineDistance(pintCajero, pointUsuario));
      const disponible = cajeroDisponible(element.disponible);
      const pos = contienePos(element.pos);
      const pesos = contienePesos(element.tienePesos);
      const dolares = contieneDolares(element.tieneDolares);
      const popUpHtml = /*html*/ `
        <strong>${element.idCajero}</strong><br>
        <span>${distancia}</span></br>
        <span>${pos}</span></br>
        <span>${disponible}</span></br>
        <span>${pesos}</span></br>
        <span>${dolares}</span></br>
      `;

      agregarMarcador(latLng, popUpHtml);
    }
  });
}

function contienePos(pos) {
  if (pos == 1) return "Este cajero contiene pos";
  else return "Este cajero no contiene pos";
}
function cajeroDisponible(cajero) {
  if (cajero == 1) return "Este cajero esta disponible";
  else return "Este cajero no esta disponible";
}
function contienePesos(pesos) {
  if (pesos == 1) return "Este cajero tiene pesos";
  else return "Este cajero no tiene pesos";
}

function contieneDolares(dolares) {
  if (dolares == 1) return "Este cajero tiene dolares";
  else return "Este cajero no tiene dolares";
}
//#endregion

//#region Movimientos

//#region obtenerMovimientos

function obtenerMovimientos() {
  const headers = {
    "Content-Type": "application/json",
    apikey: obtenerSesionUsuario(),
  };
  fetch(`${baseUrl}/movimientos.php?idUsuario=${obtenerIdUsuario()}`, {
    method: "GET",
    headers: headers,
  })
    .then((rawResponse) => rawResponse.json())
    .then(function (jsonResponse) {
      escribirMovimientos(jsonResponse);
      obtenerSaldo(jsonResponse);
    })
    .catch(function (error) {
      console.warn(error);
    });
}

function escribirMovimientos(jsonResponse) {
  const $listado = document.querySelector("#ListaDeMovimientos");
  const tipoDeMovimiento = $.SelectTipoDeMovimiento.value;
  let movimientosHTML = "";

  console.log(jsonResponse);
  for (let movimiento of jsonResponse.movimientos) {
    if (
      filtrarMovimientos(tipoDeMovimiento, movimiento) == tipoDeMovimiento ||
      tipoDeMovimiento == undefined
    ) {
      $listado.innerHTML = "";
      movimientosHTML += `<ion-item>
         <ion-card>
           <ion-card-header>
             <ion-card-subtitle>${movimiento.concepto}</ion-card-subtitle>
           </ion-card-header>
     
           <ion-card-content>
             fecha: ${movimiento.fecha}<br>
             $ ${movimiento.total}
           </ion-card-content>
     
           <ion-button fill="clear" class="EliminarMovimiento" href="/eliminar-movimiento?id=${movimiento.id}">
             Eliminar movimiento
           </ion-button>
         </ion-card>
       </ion-item>`;
    }
  }

  $listado.innerHTML = movimientosHTML;
}

function filtrarMovimientos(tipoDeMov, movimiento) {
  if (tipoDeMov == 1) {
    return 1;
  } else if (tipoDeMov == 2 && movimiento.categoria < 0) {
    return 2;
  } else if (tipoDeMov == 3 && movimiento.categoria >= 0) {
    return 3;
  }
}

//#endregion

//#region agregarMovimiento

function manejarMovimiento(event) {
  event.preventDefault();

  const datos = leerFormMovimiento();

  registrarMovimiento(datos);
}

function leerFormMovimiento() {
  return {
    idUsuario: obtenerIdUsuario(),
    concepto: $.formMovimiento.querySelector("#inpConcepto").value,
    categoria: $.formMovimiento.querySelector("#selectRubro").value,
    total: parseFloat($.formMovimiento.querySelector("#inpTotal").value),
    medio: $.formMovimiento.querySelector("#selectMedio").value,
    fecha: $.formMovimiento.querySelector("#inpFecha").value,
  };
}
function registrarMovimiento(movimiento) {
  const headers = {
    "Content-Type": "application/json",
    apikey: obtenerSesionUsuario(),
  };

  const data = {
    idUsuario: movimiento.idUsuario,
    concepto: movimiento.concepto,
    categoria: movimiento.categoria,
    total: movimiento.total,
    medio: movimiento.medio,
    fecha: movimiento.fecha,
  };

  console.log(data);

  if (!validarDatosVacios(data)) {
    fetch(`${baseUrl}/movimientos.php`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    })
      .then((rawResponse) => rawResponse.json())
      .then(function (jsonResponse) {
        toastSuccess(jsonResponse.mensaje);
        navegarPage("/ListarMovimientos");
      })
      .catch((error) => toastError(error));
  } else {
    toastError("No pueden haber campos vacios");
    navegarPage("/movimiento");
  }
  $.formMovimiento.reset();
}

//#endregion

//#region eliminarMovimiento

function iniciarEliminarProducto() {
  const params = getUrlParams(window.location.href);
  console.log(params);

  if (params.id !== undefined) {
    estadoGlobal.idMovimiento = params.id;
    eliminarProducto(params.id);
  } else {
    toastError("El id del movimiento es invalido");
    navegarPage("/ListarMovimientos");
  }
}

function eliminarProducto(id) {
  const headers = {
    "Content-Type": "application/json",
    apikey: obtenerSesionUsuario(),
  };
  const data = {
    idMovimiento: id,
  };

  console.log(`${baseUrl}/movimientos.php`);

  fetch(`${baseUrl}/movimientos.php`, {
    method: "DELETE",
    headers: headers,
    body: JSON.stringify(data),
  })
    .then((rawResponse) => rawResponse.json())
    .then(function (jsonResponse) {
      toastSuccess(jsonResponse.mensaje);
      obtenerMovimientos();
      navegarPage("/ListarMovimientos");
    })
    .catch((error) => toastError(error));
}

//#endregion

//#endregion
