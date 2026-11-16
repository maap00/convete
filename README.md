# Jardín Eterno · maap00.world

Plantilla botánica de invitaciones digitales reutilizables. Motor de personalización de fase 2 sobre el diseño aprobado de Jardín Eterno: Next.js 16.4.6, React 19.3.1, TypeScript estricto, App Router y Tailwind CSS 4. Sin backend ni despliegue.

## Requisitos y ejecución

Node.js **22.18+** y npm 10+.

```sh
npm ci
npm run dev
```

Abrir `/invitacion/laura-martin` en el servidor local indicado por Next. La raíz lista las invitaciones; un slug inexistente devuelve 404.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`start` necesita un build previo. El lockfile fija las versiones. Next 16 no ejecuta ESLint durante build; se mantiene como comprobación independiente.

## Organización

```text
src/app/                         Rutas, layout, SEO y entrada de estilos
src/components/ui/               Section, ActionLink, Icon, BotanicalDecoration
src/components/wedding/          Secciones, Countdown, Rsvp y Reveal
src/features/invitations/        Contrato, configuración, assets, validación y renderer
src/features/rsvp/               Contrato, validación, mensajes y enlace de WhatsApp
src/themes/                      Registro, tokens botánicos e iconos
src/features/locations/          Modelo y resolución de navegación
src/lib/                         Fechas, cuenta regresiva y validación de URLs
src/styles/                      Tokens generales y reglas responsive
public/invitations/<slug>/photos Fotografías locales optimizadas
public/themes/botanical/         Ornamentos
public/fonts/                    Fuentes y licencias
 tests/core.test.ts              Pruebas nativas Node
 docs/visual-assets.md           Procedencia, prompt y diferencias visuales
```

Se conservaron las responsabilidades y convenciones existentes (inspeccionadas en Giuliett Pâtisserie sin modificar ese repositorio). No se añadieron dependencias en fase 1. Las secciones pequeñas comparten `Sections.tsx`; el contador, RSVP y la mejora de aparición progresiva tienen sus propios Client Components. El resto permanece en servidor.

## Personalizar la invitación

Editar `src/features/invitations/config/laura-martin.ts` o `ana-carlos.ts`. Nombres, mensajes, lugares, fecha, itinerario, vestimenta, regalos, RSVP, SEO y orden se reciben mediante propiedades tipadas. No se escriben datos de la pareja en los componentes.

- Fechas ISO con segundos y offset explícito, por ejemplo `2027-04-17T16:00:00-04:00`, más zona IANA `America/Caracas`. La visualización utiliza la zona configurada; lugares e itinerario usan formato de 24 horas.
- `messages.romantic`, `messages.story` y `messages.thankYou` controlan los nuevos textos. Conservan alternativas con los mensajes básicos del contrato.
- `sections` define el orden y la visibilidad. `countdown` es una sección opcional adicional; `enabled: false` u omitir la entrada la excluye.
- `storyPhoto`, `ceremony.photo` y `reception.photo` son opcionales. `photos` alimenta la galería: se muestran cuatro inicialmente y un desplegable cuando hay más.
- `dressCode.palette` define muestras con nombre accesible y color.
- Los lugares admiten `googleMapsUrl`, `wazeUrl`, coordenadas o dirección específica; `mapUrl` sigue como alias compatible de Google Maps. `gifts.url` admite HTTPS y `gifts.buttonText` personaliza la acción. No se generan enlaces para los lugares ficticios de las demos. Ver la guía de ubicaciones al final.
- `rsvp.maxCompanions` limita acompañantes (2 por defecto, sin incluir al invitado). `rsvp.enabled` activa la preparación por WhatsApp si existe un número válido y la fecha está vigente. Las dos demos conservan `enabled: false` y ningún receptor. Ver la guía RSVP al final.
- Conservar `seo.noIndex` y el aviso de demostración mientras los datos sean ficticios.

## Fotografías y temas

Añadir archivos WebP/AVIF/JPEG en `public/invitations/<slug>/photos/`. Registrar rutas, dimensiones reales y textos alternativos en el archivo de assets de esa invitación. Usar fotografías autorizadas; conservar originales fuera de `public`. Se utiliza `next/image` con tamaños responsive y carga diferida para fotos. El ornamento superior carga de forma anticipada.

`src/themes/registry.ts` centraliza ornamentos y variante; `src/themes/botanical/icons.ts` contiene los iconos. Los colores y fuentes se controlan con tokens de `theme.css`; la base consume esas variables. Para cambiar gráficos, editar el registro; para cambiar la paleta, editar los tokens. Los SVG decorativos no participan en la navegación ni se anuncian.

Para crear otro tema: ampliar `ThemeId`, añadir una entrada en el registro, crear su CSS e importarlo desde `app/globals.css`, y seleccionar su clave en la configuración. No hay editor visual ni sistema de temas adicional.

Consultar [recursos y licencias](docs/visual-assets.md) para fuentes locales, fotografías de demostración, ornamentos y prompt de generación.

## Agregar otra invitación (configuración manual histórica; preferir CLI 4.2)

1. Crear una configuración con `satisfies WeddingInvitation`, `id` y `slug` únicos.
2. Registrar sus fotografías bajo su propio slug y reemplazar las referencias del ejemplo.
3. Importar la configuración y añadirla al array de `src/features/invitations/registry.ts`.
4. Ejecutar las comprobaciones.

La ruta `/invitacion/<slug>` se genera sin copiar componentes. La validación comprueba fechas, zonas, slugs, secciones, orden del itinerario, URLs y fotografías. Es una frontera para configuraciones internas tipadas; una futura API deberá validar entradas externas desconocidas.

## Responsive, accesibilidad y animación

Mobile-first, tipografía fluida, galería de dos columnas, portada con altura adaptable y papel máximo de 760 px en escritorio. H1 único, regiones nombradas, etiquetas de formulario, foco visible, enlace para saltar al contenido y ornamentos ocultos a tecnologías de asistencia.

Aparición suave mediante IntersectionObserver y CSS, sin librería de animaciones. El contenido sigue disponible sin JavaScript. `prefers-reduced-motion` desactiva aparición animada, transiciones y scroll suave. El contador evita desajustes de hidratación y muestra ceros con «¡Llegó el gran día!» después de la fecha; su región no anuncia cada segundo.

## Validación

Pruebas unitarias nativas (`node:test`), sin suite pesada: fechas imposibles, zona y cambio de día, año bisiesto, RSVP, configuración múltiple, slugs, duplicados, itinerarios, enlaces, fotos y contador vencido. Sesenta y cinco casos: cuarenta anteriores y veinticinco de ubicaciones/enlaces, incluidos los veinte de RSVP.

Se revisa en navegador la portada, historia, celebración, galería y RSVP, y se mide ausencia de scroll horizontal en 320, 375, 390, 430, 768, 1024 y 1440 px CSS. Se comprueban salto a RSVP, expansión de galería y validación antes de abrir WhatsApp. Ver `docs/tarea-3.2.md` para el informe actual; `docs/tarea-3.1.md` documenta RSVP y `docs/fase-2.md` y `docs/fase-1.md` conservan las entregas anteriores.

## Pendientes

Sustituir contenido ilustrativo por fotos y datos autorizados y proporcionar URLs de mapas/regalos para eventos reales. El RSVP prepara respuestas mediante WhatsApp sin guardar datos ni verificar envíos; cualquier persistencia o canal adicional requiere una fase posterior. No se han realizado commits, push ni despliegue.

## Guía práctica: crear una tercera invitación

No es necesario cambiar componentes React, rutas ni CSS. Las demos conservan configuraciones TypeScript y las nuevas solicitudes pueden usar el descubrimiento automático de Tarea 4.2; no heredar una configuración de producción desde otra pareja.

1. Crear `public/invitations/sofia-diego/photos/`, `ornaments/` y `backgrounds/` según los recursos necesarios. Las subcarpetas sin recursos pueden omitirse.
2. Copiar **solo la configuración** `src/features/invitations/config/ana-carlos.ts` a `sofia-diego.ts` como punto de partida. Cambiar la variable exportada, `id`, `slug`, nombres, fechas, mensajes, lugares, SEO y avisos. Reemplazar **todas** las rutas de `/ana-carlos/` por las del nuevo slug. El tipo `satisfies WeddingInvitation` comprueba el contrato.
3. Registrar cada fotografía con dimensiones reales y texto alternativo. La principal se asigna a `storyPhoto`; la galería a `photos`; las de lugares a `ceremony.photo` y `reception.photo`. Para separar los datos de las fotos se puede crear un archivo de assets junto a la configuración, como hace Laura y Martín.
4. Seleccionar `theme: 'botanical'` y la personalización. Omitir `personalization` conserva exactamente los valores predeterminados de Laura y Martín.
5. Configurar `sections` en el orden de presentación deseado. Portada y cierre siempre aparecen. `venues` agrupa los lugares para conservar el diseño aprobado; permite activar ceremonia y recepción por separado. Un grupo sin lugares, una galería vacía o un itinerario vacío no generan espacios vacíos.
6. Importar `sofiaDiego` y añadirlo a `invitationRegistry` en `src/features/invitations/registry.ts`. No modificar la ruta ni `repository.ts`.
7. Ejecutar `npm run dev` y abrir `/invitacion/sofia-diego`. La raíz lista automáticamente todos los slugs registrados.
8. Ejecutar `npm test`, `npm run lint`, `npm run typecheck` y `npm run build`. El registro valida también que los recursos existan en `public/`; los mensajes señalan slug y campo. Revisar contenido y tamaños móviles.

Ejemplo de personalización dentro de la nueva configuración:

```ts
personalization: {
  palette: 'rose',             // 'olive' conserva la paleta original
  colors: { primary: '#743C50', accent: '#B88B73' },
  typography: 'classic',       // 'romantic' es la opción original
  ornament: 'minimal',         // 'floral' es la opción original
  icons: 'soft',               // 'fine' conserva el trazo original
  variant: 'outlined',         // 'plain' conserva el diseño original
  assets: {
    corner: '/invitations/sofia-diego/ornaments/corner.webp',
    ornament: '/invitations/sofia-diego/ornaments/sprig.svg',
    background: '/invitations/sofia-diego/backgrounds/paper.webp',
  },
},
sections: [
  { id: 'welcome', enabled: true },
  { id: 'countdown', enabled: true },
  { id: 'venues', enabled: true, ceremony: true, reception: false },
  { id: 'itinerary', enabled: false },
  { id: 'gallery', enabled: true },
  { id: 'dressCode', enabled: true },
  { id: 'gifts', enabled: false },
  { id: 'rsvp', enabled: false },
],
```

Eliminar del ejemplo las rutas de recursos que no se hayan creado. Los assets por invitación deben estar en su propio slug; los assets de tema pueden ser compartidos bajo `/themes/`. No se aceptan URLs externas ni rutas con traversal, queries o codificación escapada para recursos gráficos.

### Opciones visuales y límites

`colors` admite `primary`, `secondary`, `background`, `surface`, `text`, `border`, `accent` y `canvas`. Cada color debe ser hexadecimal opaco de seis dígitos. El resolver impide combinaciones con contraste inferior a **4.5:1** entre texto/fondos, principal/fondos y texto/canvas. Las fuentes se eligen entre combinaciones predefinidas; no se aceptan CSS ni familias arbitrarias. Los acentos y colores secundarios se usan como decoración, no como texto principal.

Los gráficos se resuelven por `registry.ts` de temas y después por los overrides de la invitación. El fondo es decorativo, fijo a una opacidad de 8% para no competir con el contenido. `soft` cambia el grosor del mismo registro de iconos, sin introducir una librería de iconos nueva. `outlined` añade bordes y un separador secundario; `plain` conserva la composición aprobada.

### Tamaños y formatos recomendados

| Recurso | Recomendación |
| --- | --- |
| Principal (`storyPhoto`) | 1400–1800 px de ancho, sujeto centrado; se recorta con `object-fit: cover` |
| Ceremonia/recepción | 800 px o más, encuadre centrado que admita recorte vertical |
| Galería | 800–1200 px, contenido importante cerca del centro; cuadrícula de dos columnas |
| Esquinas | WebP/PNG transparente de 600–1000 px o SVG confiable sin scripts |
| Separador | SVG aproximadamente 90 × 55; también se aceptan raster locales |
| Fondo | WebP/AVIF optimizado o SVG de textura discreta; sin texto incrustado |

No publicar originales de gran tamaño. Mantener nombres en ASCII, minúsculas y guiones. Las fuentes locales existentes se reutilizan. Antes de incorporar SVG ajenos, inspeccionarlos como código de confianza: no hay sanitizador de uploads porque no existe un sistema de uploads.

### Verificación HTTP de ambas demos

Después de `npm run build`, iniciar `npm start` en una terminal. En otra:

```sh
npm run test:http -- http://127.0.0.1:3000
```

Comprueba ambas rutas, metadatos distintos, tokens, secciones activas/desactivadas, portada/cierre esenciales, independencia de rutas de assets y respuesta 404. El script de HTTP comprueba las dos demos incluidas; al incorporar otra, añadir también sus expectativas si se quiere cubrirla en esa prueba.

### Datos y validación

No hay consultas externas. `registry.ts` reúne las demos y configuraciones JSON descubiertas de forma segura en servidor/build; `repository.ts` valida registro y archivos al cargar y devuelve copias para impedir mutaciones accidentales entre solicitudes. `validation.ts` y el resolver visual son funciones puras; `validate-assets.ts` separa la comprobación de archivos del código de presentación. La validación está destinada a configuraciones TypeScript internas; una futura API debe validar también la forma completa de entradas desconocidas.

La demo Ana y Carlos utiliza otra selección de fotografías locales de la colección ya licenciada, incluidas fotos como principal que en Laura y Martín tienen otros usos. Su propio directorio permite sustituirlas sin afectar a otra pareja. Procedencia: [recursos visuales](docs/visual-assets.md).

## RSVP funcional mediante WhatsApp · Tarea 3.1

La aplicación **prepara el mensaje y abre WhatsApp**; el invitado debe pulsar Enviar dentro de WhatsApp. Convete no puede confirmar ese envío, no registra la asistencia como completada ni almacena nombres o respuestas. No hay backend, API de mensajería, cookies, localStorage ni servicios de seguimiento añadidos.

### Configuración por invitación

En el objeto `rsvp` de cada configuración:

```ts
rsvp: {
  enabled: true,
  phone: numeroInternacionalAutorizado, // string del receptor real, proporcionado por su titular
  maxCompanions: 2,                    // entero 0–20; no incluye al invitado principal
  deadline: '2027-04-01T23:59:00-04:00', // opcional; quitar para no aplicar fecha límite
  intro: 'Nos encantará compartir contigo este día especial.',
  message: 'Contacta con los anfitriones si necesitas ayuda.',
  buttonText: 'Confirmar por WhatsApp',
  eventLabel: 'Laura y Martín',         // opcional; por defecto usa los nombres de couple
  texts: {
    greeting: 'Hola, {event}.',
    acceptIntro: 'Quiero confirmar mi asistencia a su boda.',
    declineIntro: 'Gracias por la invitación.',
    acceptClosing: '¡Nos vemos en la celebración!',
    declineClosing: 'Les deseo una celebración maravillosa.',
  },
},
```

`numeroInternacionalAutorizado` representa una variable con un número real autorizado; no es un placeholder para pegar literalmente. No se ha configurado un receptor real en ninguna demo. No copiar números ficticios como destinatarios de una invitación comercial.

- Teléfono: código de país y número completo, preferiblemente solo dígitos. También se admiten `+`, espacios, guiones, paréntesis y puntos como formato de entrada; al crear `wa.me` se eliminan. Se valida una estructura internacional de 8–15 dígitos sin cero inicial; **esto no verifica que exista la cuenta**.
- `enabled: false`: bloquea la apertura y muestra el motivo. Para ocultar además toda la sección y el CTA, desactivar también la entrada `rsvp` de `sections`.
- Número omitido: la acción permanece deshabilitada y se indica que es una demostración. Un número explícito inválido falla la validación de configuración; el componente también bloquea ese estado si llegara a recibirlo.
- Límite: 2 por defecto. El selector muestra 0 hasta el máximo solo al elegir Sí. Al elegir No, se oculta y normaliza a cero; volver a Sí mantiene cero.
- Fecha: instante ISO con offset, inclusivo hasta ese instante exacto. La zona horaria está en el propio offset; no depende de la zona del navegador. No puede superar la fecha del evento. Se actualiza durante la sesión y se comprueba de nuevo al pulsar el botón. El bloqueo cliente no sustituye una validación de servidor: no existe servidor de confirmaciones.
- Textos: `intro` y `buttonText` controlan la interfaz; `eventLabel` identifica pareja/evento. `texts` permite modificar los textos del mensaje y las etiquetas `nameLabel`, `attendanceLabel`, `companionsLabel`, `totalLabel`, `acceptAnswer` y `declineAnswer`. `{event}` en `greeting` se sustituye por la identificación configurada. Los campos ausentes conservan los textos predeterminados; los proporcionados no pueden estar vacíos.

### Validación y apertura

Nombre obligatorio, espacios normalizados y máximo de 100 caracteres. Ninguna asistencia se selecciona inicialmente. Los errores conservan el contenido introducido, se asocian mediante ARIA y enfocan el primer campo inválido al intentar continuar. Los radios y el selector funcionan con teclado.

El submit nativo se cancela: no se envían respuestas al servidor local. Solo el handler de una acción explícita valida, comprueba disponibilidad y llama a `window.location.assign` con una URL codificada mediante `URLSearchParams`. Se utiliza la misma pestaña para evitar popups. Sin JavaScript, el botón permanece deshabilitado; no hay un envío alternativo al servidor.

Al abrir el enlace, el nombre y la respuesta pasan a WhatsApp mediante su URL. WhatsApp Web, la app instalada o su pantalla de acceso pueden intervenir según el dispositivo. Convete no puede verificar instalación, conectividad, existencia de la cuenta ni que se pulse Enviar. No se muestra «Confirmación enviada».

Referencia del formato: [Click to chat · documentación oficial de WhatsApp](https://faq.whatsapp.com/5913398998672934).

### Cómo probarlo sin enviar mensajes reales

1. Ejecutar `npm test`: las funciones puras cubren datos válidos/inválidos, personalización por pareja, límites, fecha y URL. Las pruebas nunca hacen clic ni contactan destinatarios.
2. Ejecutar lint, TypeScript y build; después `npm start` y `npm run test:http -- http://127.0.0.1:3000`.
3. Abrir Laura y Martín: probar campos y errores al salir del nombre, Sí/No y acompañantes. El botón seguirá deshabilitado porque la configuración original está desactivada y sin teléfono. Ana y Carlos conserva su sección oculta.
4. Para una prueba de apertura real, configurar únicamente un número propio o expresamente autorizado, activar RSVP y comprobar la fecha. Utilizar datos de prueba y detenerse antes de pulsar Enviar en WhatsApp. No usar el número ilustrativo del enunciado como receptor.

La revisión de esta entrega utilizó una página local temporal con datos sintéticos y un número del [rango ficticio reservado 555-0100–0199 de NANPA](https://www.nanpa.com/numbering/555-line-numbers). Se comprobó apertura de la pantalla de WhatsApp, **sin pulsar Enviar**. La página temporal se eliminó antes del build final y no forma parte del producto ni del registro de invitaciones.

## Ubicaciones y enlaces externos · Tarea 3.2

Los eventos mantienen `name`, `startsAt` y `photo`. `Venue` amplía `EventLocation` con dirección opcional (`address`), `city`, `country`, `coordinates: { latitude, longitude }`, `googleMapsUrl`, `wazeUrl`, `directions` y `navigationEnabled`. No se repiten horarios ni se requiere una ubicación anidada adicional. `mapUrl` conserva compatibilidad como alias de Google Maps; para nuevas invitaciones usar `googleMapsUrl`. No definir ambos con valores distintos.

### Configurar una boda real

1. Pedir a los anfitriones el nombre, dirección postal, ciudad/país, enlace compartido o coordenadas verificadas y detalles de acceso de cada lugar. No inferir estos datos del nombre ni de una fotografía.
2. Añadir los datos a `ceremony` y `reception` de **su propia configuración**. Conservar fechas/horarios independientes.
3. Copiar un enlace HTTPS oficial del lugar a `googleMapsUrl`; alternativamente introducir coordenadas numéricas verificadas. Sin ambos, una dirección de búsqueda debe contener calle con número y `city`/`country`. No se geocodifica ni se comprueba la existencia del lugar.
4. Para Waze, usar las mismas coordenadas verificadas o copiar un enlace oficial propio a `wazeUrl`. No transformar una URL de Google Maps mediante reemplazos de texto.
5. `directions` permite indicar portón, estacionamiento o acceso. La dirección permanece visible aunque existan botones; sin destino suficiente solo se muestra la información. `navigationEnabled: false` oculta todas las acciones sin ocultar el evento.
6. Para regalos, pedir una URL HTTPS autorizada y configurarla en `gifts.url`. Añadir `gifts.buttonText` si se desea cambiar «Ver lista de regalos». `sections` controla su activación; sin URL permanece el mensaje, sin un botón ficticio.
7. Ejecutar pruebas, lint, TypeScript y build. Revisar los enlaces manualmente con los anfitriones: la validación sintáctica no puede asegurar que llevan al establecimiento correcto.

Patrón de datos (las variables representan valores **reales, verificados y autorizados**, no ejemplos para publicar):

```ts
import type { EventLocation } from '@/features/locations/types';

const sharedLocation = {
  name: nombreVerificado,
  address: direccionPostalVerificada,
  city: ciudadVerificada,
  country: paisVerificado,
  coordinates: { latitude: latitudVerificada, longitude: longitudVerificada },
  googleMapsUrl: enlaceCompartidoVerificado, // opcional si hay coordenadas o dirección suficiente
  directions: 'Utiliza la entrada indicada por los anfitriones.',
} satisfies EventLocation;

// Dentro de WeddingInvitation:
ceremony: { ...sharedLocation, startsAt: horaCeremonia, photo: fotoCeremonia },
reception: { ...sharedLocation, startsAt: horaRecepcion, photo: fotoRecepcion },
gifts: { message: mensajePersonalizado, url: listaAutorizada, buttonText: 'Nuestra lista de regalos' },
```

Si los lugares son distintos, crear dos objetos de ubicación independientes. Si no hay coordenadas verificadas, omitirlas; un enlace explícito validado basta. Omitir cualquier URL que no exista. Las dos demos incluidas se conservan sin mapas/listas ficticias activas y sin cambiar los datos aprobados.

### Prioridades y política verificable

- **Google Maps:** URL explícita válida → coordenadas válidas → calle con número + ciudad + país → sin acción. Se genera `https://www.google.com/maps/dir/?api=1&destination=…`. No se envía origen ni se solicita geolocalización desde Convete. Google puede resolver el origen según sus propias opciones.
- **Waze:** coordenadas válidas → URL oficial explícita válida → sin acción. La URL generada es `https://www.waze.com/ul?ll=…&navigate=yes`. No se genera búsqueda Waze a partir de una dirección libre ni de una URL Maps. Un enlace explícito puede tener coordenadas, un enlace compartido `/ul/h…` o una búsqueda con calle/número, ciudad y país separados por comas.
- Dominios Maps exactos permitidos: `google.com`, `www.google.com` bajo `/maps`; `maps.google.com` en raíz o `/maps`; `maps.app.goo.gl/<token>` y `goo.gl/maps/<token>` para enlaces compartidos. Se exige un destino en path/parámetros, no basta la portada de Maps. No se aceptan dominios regionales automáticamente: utilizar el enlace global oficial o coordenadas.
- Dominios Waze exactos permitidos: `waze.com` y `www.waze.com`, ruta `/ul` o enlace compartido `/ul/h…`. No se aceptan protocolos exclusivos de aplicaciones.
- Los enlaces de navegación deben usar HTTPS y carecer de credenciales, puertos no estándar, espacios sin codificar, controles, parámetros duplicados o parámetros de redirección conocidos. `api` debe ser 1; se validan coordenadas, modo de viaje y acción de navegación cuando aparecen. No se permite la sustitución por dominios como `google.com.otro-sitio.test`.
- Coordenadas: números finitos, latitud [-90, 90] y longitud [-180, 180], incluidos cero y extremos. El orden es latitud,longitud. Una coordenada inválida en configuración falla con slug/campo.
- La dirección para búsqueda requiere calle con número y longitud suficiente, ciudad y país. Marcadores como «ficticio», «demo», «ejemplo» o «por confirmar» no se convierten en destinos. Direcciones sin número pueden seguir siendo descriptivas; utilizar coordenadas o URL verificada para navegar.
- Regalos: cualquier proveedor HTTPS sintácticamente válido, sin limitar a una marca. No se admiten `javascript:`, `data:`, `file:`, credenciales ni URLs relativas. Las utilidades generales distinguen HTTP/HTTPS; los botones entregados exigen HTTPS.

`src/lib/urls.ts` centraliza sintaxis web, `features/locations/navigation.ts` resuelve destinos y `LocationActions` renderiza únicamente acciones disponibles. `ExternalLink` valida otra vez antes de renderizar, añade `target="_blank"`, `rel="noopener noreferrer"` y un nombre accesible que anuncia la otra pestaña. No hay redirecciones automáticas, scripts de proveedores, APIs, claves ni mapas embebidos.

### Pruebas y límites

`npm test` ejecuta 65 casos. `npm run test:http -- http://127.0.0.1:3000` comprueba ambas demos, el 404 y la ausencia de botones de navegación/regalos ficticios. Para QA de esta tarea se usó una página temporal con el punto del ejemplo oficial de Waze y un enlace de documentación, sin asignarlos a una boda ni modificar cuentas; esa ruta se retiró del producto.

Los enlaces compartidos oficiales pueden redirigir internamente: Convete no sigue ni inspecciona esos redirects. Los proveedores resuelven direcciones y controlan instalación, sesiones, consentimiento y apertura de aplicaciones. Las coordenadas y URLs deben verificarse humanamente antes de una entrega comercial. No se solicitan permisos de ubicación desde la invitación.

Referencias oficiales: [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) y [Waze Deep Links](https://developers.google.com/waze/deeplinks). Informe: [Tarea 3.2](docs/tarea-3.2.md).

### Calidad, privacidad y publicación (Tarea 3.3)

La suite actual tiene **146 pruebas** (120 anteriores y 26 de validación/entrega comercial). Next.js y eslint-config-next están fijados en **16.4.6**. Fuentes locales WOFF2 con las mismas licencias OFL. Informe y límites: [docs/tarea-3.3.md](docs/tarea-3.3.md).

Antes de un build público, definir `CONVETE_PUBLIC_ORIGIN` con el origen HTTPS real del alojamiento, sin ruta, parámetros ni credenciales. Es una variable de servidor, no `NEXT_PUBLIC_*`. No hay un dominio definitivo configurado. Al cambiarla, reconstruir: las invitaciones se prerenderizan. No usar localhost ni una ruta del sistema operativo. Los dominios usados en pruebas son ejemplos aislados, nunca configuración de publicación.

Con el origen configurado se emiten canonical, `og:url`, imágenes absolutas Open Graph y Twitter Cards por pareja. Sin origen se omiten esas URLs para evitar referencias públicas falsas; título, descripción, idioma y política de robots siguen disponibles. Cada invitación nueva necesita `public/invitations/<slug>/social.jpg` (1200 × 630 px), o un `seo.image` local propio. Comprobar visualmente su recorte y contenido; la existencia se valida durante build. Los previews incluidos usan fotografías ilustrativas ya presentes en cada demo. No afirman mostrar personas reales.

`seo.noIndex` controla `noindex,nofollow` (`true`) o indexación (`false`) por invitación. Ambas demos siguen en `true`. **Noindex no protege el acceso:** quien tenga el enlace puede ver nombres, fotos y ubicaciones; una URL poco obvia tampoco es autenticación. La publicación requiere autorización sobre los datos y las fotografías.

Antes de entregar: verificar destinos y receptor con los anfitriones, ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm audit` y `npm run test:http -- <origen-local>`. Auditar también `npm audit --omit=dev`. La auditoría completa aún informa ocho paquetes moderados afectados por un mismo aviso de minimatch en ESLint; la corrección mayor pendiente está descrita en el informe. No ejecutar `npm audit fix --force` sin revisar compatibilidad.

Una vez publicada con autorización, verificar los metadatos servidos y probar compartir la URL pública en WhatsApp: los bots deben poder acceder a la imagen. La preparación local no confirma la vista previa ni su caché. Completar pruebas en Safari/iOS y Chrome/Android reales, zoom y teclado virtual, además de métricas de campo.


## Solicitar una invitación · Tareas 4.1 y 4.1.1

Con `npm run dev`, abrir `/solicitar-invitacion`. Completar los seis pasos: pareja, lugares, textos/fotos, celebración, estilo/RSVP y revisión. Los controles de bienvenida, galería, vestimenta, itinerario y regalos se encuentran junto a su contenido. Pueden desactivarse sin completar sus campos; el borrador se conserva al reactivarlos.

Portada es obligatoria; bienvenida solo si su sección está activa. Historia, indicaciones especiales y cierre personalizado son opcionales. Si el cierre queda vacío se usa «Gracias por acompañarnos en este nuevo comienzo.». Los demás campos activos conservan sus validaciones.

Seleccionar fotografías JPEG, PNG o WebP locales. En el último paso, revisar los datos, marcar la confirmación y pulsar **Descargar solicitud JSON**. Entregar por separado el JSON y los originales del manifiesto al operador comercial: **descargar no envía la solicitud a maap00.world**. No hay almacenamiento automático; cerrar o recargar descarta los datos.

El JSON usa `schemaVersion: 1`, UUID e instantes UTC; omite contenido de secciones desactivadas y no contiene imágenes, Base64 ni URLs temporales. No crea ni publica invitaciones. Documentación, reglas del contrato, pruebas y limitaciones: [Tarea 4.1](docs/tarea-4.1.md).

Verificación del cierre: 97 pruebas aprobadas; TypeScript, ESLint, Webpack y HTTP correctos; recorrido real con descarga y seis pasos medidos en siete anchos. El build predeterminado con Turbopack continúa bloqueado por `binding to a port: Operation not permitted` en su proceso PostCSS, incluso con reintento ampliado. Webpack es una comprobación adicional; no se cambió el comando `build`. Sigue pendiente verificar el build predeterminado en otro entorno y una captura dinámica de tráfico. No se declara aprobación completa.


## Generar una invitación desde una solicitud · Tarea 4.2

Requisitos: Node 22.18+, `npm ci`, JSON descargado desde `/solicitar-invitacion` y una carpeta con todos los originales del manifiesto, usando sus nombres exactos. Ejecutar desde la raíz:

```sh
npm run invitation:create -- --input ./solicitud.json --assets ./fotografias --dry-run
npm run invitation:create -- --input ./solicitud.json --assets ./fotografias
```

Para elegir la ruta, añadir `--slug nombre-pareja`. `--help` muestra opciones; `--fixture` marca explícitamente una invitación de prueba. El dry-run valida y optimiza en memoria sin escribir. La creación genera configuración, WebP optimizados e informe en `public/invitations/{slug}/`; no sobrescribe directorios existentes ni necesita editar el registro, React o CSS. El contacto comercial del JSON no se copia a la invitación pública.

Reiniciar desarrollo o reconstruir (`npm run build`, luego `npm start`) y abrir `/invitacion/{slug}` en el servidor local. El CLI no publica en Internet. El build predeterminado sigue afectado por el bloqueo ambiental Turbopack documentado; Webpack se verificó adicionalmente con `npm run build -- --webpack`.

La fixture `/invitacion/fixture-generador-local` ya existe y está marcada como ficticia. Para comprobar otra simulación:

```sh
npm run invitation:create -- --input docs/examples/solicitud-invitacion-recorrido-4.1.1.json --assets public/invitations/laura-martin --slug fixture-simulacion --fixture --dry-run
```

Los recursos de ese comando son de demostración. No usarlos como datos de un cliente. La fotografía principal también sirve como imagen local SEO; revisar su recorte y textos alternativos antes de una entrega real. Las invitaciones se crean con `noindex`, que no restringe su acceso. Sin origen público válido no se emite canonical inventado.

Ver [Tarea 4.2](docs/tarea-4.2.md) para arquitectura, formato, valores por defecto, seguridad, recuperación ante fallos, pruebas y límites. Resultado de Tarea 4.2: 120 pruebas aprobadas; HTTP de demos/formulario/fixture/404 y build Webpack correctos. `npm run test:http:generated -- http://127.0.0.1:3100` verifica la fixture después de iniciar producción.


## Revisar y preparar la entrega comercial · Tarea 4.3

Los controles técnicos y la aprobación del cliente son pasos diferentes. Auditar no aprueba ni publica:

```sh
npm run invitation:check -- --slug fixture-generador-local
npm run invitation:check -- --slug fixture-generador-local --json
npm run invitation:check -- --slug fixture-generador-local --checklist --output reports/checklist-cliente.md
npm run invitation:handoff -- --slug fixture-generador-local --output reports/entrega.md
```

Los dos primeros comandos son de solo lectura; `--output` guarda únicamente en un archivo nuevo de `docs/` o `reports/`, sin sobrescribir. ERROR bloquea; WARNING requiere revisión; INFO orienta. El checklist omite secciones ocultas. La fixture no tiene aprobación real y no puede convertirse en entrega comercial mediante una simulación.

Para una invitación real: reconstruir/reiniciar la vista local, resolver errores, revisar contenido y móvil con el cliente, obtener aprobación y luego registrar la huella exacta con `invitation:approve`. Consultar `npm run invitation:approve -- --help`: exige responsable confirmado, fecha ISO de la aprobación recibida, huella y confirmaciones explícitas. `--authorize-publication` es independiente; no debe usarse si no se recibió esa autorización. Los registros se guardan en `.convete/approvals/`, fuera de `public` e ignorados por Git. Cambios de configuración o recursos revisados invalidan la aprobación.

`invitation:handoff` diferencia revisión, aprobación y preparación pública; jamás establece «publicada y verificada» desde localhost. Código de salida 0 significa ejecución técnica sin errores, no aprobación del cliente. Para ensayar todo sin cliente ni consentimiento real:

```sh
npm run test:commercial
```

Ese comando usa un directorio temporal y registra solo una simulación. Suite final: **146 pruebas aprobadas**, TypeScript/ESLint/Webpack y HTTP correctos; bloqueo ambiental de Turbopack documentado. La revisión humana y la meta de 30 minutos aún no se han medido con un caso real.

Guía, reglas, huellas, estados, seguridad y ejemplos: [Tarea 4.3](docs/tarea-4.3.md). No se publica automáticamente ni se avanzó a Fase 5.
