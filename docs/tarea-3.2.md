# Convete · Tarea 3.2 · Ubicaciones, navegación y enlaces externos

## Resumen y auditoría

Se reutilizaron `VenueDetails`/`Venues` y `Gifts` de `Sections.tsx`, que son los equivalentes existentes de EventDetails y GiftRegistry. No se duplicaron secciones ni se cambió la ruta o el renderer. La dirección antes desaparecía cuando había `mapUrl`; ahora permanece visible y las acciones se resuelven por separado.

Ceremonia y recepción reciben sus datos independientes. Los regalos conservan el mensaje sin URL y ofrecen texto de botón configurable cuando existe un destino HTTPS válido. Las dos demos mantienen sus datos aprobados y ningún enlace ficticio de mapas/regalos activo. RSVP no se modificó.

## Archivos creados

- `src/lib/urls.ts`: política pura de sintaxis HTTP/HTTPS; HTTPS para acciones externas y regalos.
- `src/features/locations/types.ts`: `EventLocation` y `Coordinates`.
- `src/features/locations/navigation.ts`: validación de destinos y resolución de URLs oficiales.
- `src/components/ui/ExternalLink.tsx`: enlace HTTPS con validación defensiva, nueva pestaña, `noopener noreferrer` y nombre accesible.
- `src/components/wedding/LocationActions.tsx`: renderiza solo Maps/Waze disponibles.
- `tests/navigation.test.ts`: 25 casos nuevos con runner nativo de Node.
- Este informe, `docs/screenshots/navigation-responsive.json`, `navigation-actions-qa.png` y captura de la celebración de la demo final.

## Archivos modificados

- `src/features/invitations/types.ts`: `Venue` extiende `EventLocation`; los horarios y fotografías conservan su lugar. `gifts.buttonText` es opcional.
- `src/features/invitations/validation.ts`: reutiliza el validador HTTPS central, comprueba coordenadas, URLs oficiales, campos opcionales y texto de botón; mantiene los mensajes con slug/campo.
- `src/components/wedding/Sections.tsx`: dirección siempre visible, ciudad/país/indicaciones opcionales, `LocationActions` y enlace de regalos compartido.
- `src/styles/base.css`: acciones de 44 px, separación y ajuste de texto largo; las fotos solo se adaptan cuando hay acciones disponibles. Sin cambios de paleta, tipografías, ornamentos o espaciado entre secciones.
- `scripts/verify-http.mjs`: además de las verificaciones previas, asegura que las demos no tienen acciones de mapas/regalos ficticias.
- `README.md`: modelo, políticas, instrucciones para boda real y ejemplos seguros.

No se modificaron configuraciones de parejas, RSVP, dependencias, proyectos externos ni el renderizador. Las configuraciones existentes ya cumplen la regla de no inventar destinos; por eso no se añadieron direcciones, coordenadas o listas reales a las demos.

## Modelo y reutilización

`EventLocation` permite `name`, `address`, `city`, `country`, `coordinates`, `googleMapsUrl`, `wazeUrl`, `directions` y `navigationEnabled`. `Venue` añade `startsAt` y `photo`, conservando el contrato existente. `mapUrl` es un alias compatible de Google Maps; se rechaza definirlo junto con otra `googleMapsUrl` diferente.

Una constante de ubicación puede reutilizarse con spread en dos eventos manteniendo `startsAt` independiente. Para dos lugares distintos, usar objetos independientes. No se requieren coordenadas si basta un enlace oficial validado.

## Funciones reutilizables

- `parseWebUrl`, `isHttpUrl`, `isHttpsUrl`, `isGiftRegistryUrl`: sin red ni redirects; rechazan protocolos no web, credenciales, puertos no estándar, controles, espacios y escape porcentual inválido. Los botones entregados exigen HTTPS.
- `isValidCoordinates`: valores finitos y dentro de rangos geográficos.
- `hasSpecificAddress`: calle con número y longitud suficiente, ciudad y país, sin marcadores de datos ficticios. Direcciones más generales se muestran, pero no se convierten en destinos.
- `isGoogleMapsUrl`, `isWazeUrl`: host/ruta oficiales, destino suficiente y parámetros válidos; bloquean dominios imitadores, redirecciones conocidas y parámetros duplicados.
- `buildGoogleMapsUrl`: URL explícita válida → coordenadas → dirección completa → undefined.
- `buildWazeUrl`: coordenadas → URL Waze explícita válida → undefined. No deriva Waze desde una URL Google ni genera búsqueda libre por nombre.
- `resolveLocationActions`: resultado tipado con las acciones disponibles.

La política exacta de dominios, rutas y parámetros está en el [README](../README.md#ubicaciones-y-enlaces-externos--tarea-32). Los enlaces cortos oficiales se aceptan, pero sus redirecciones posteriores pertenecen al proveedor y no se inspeccionan en Convete.

## Guía breve para una boda real

Obtener ubicación y acceso verificados de los anfitriones. Configurar cada evento con su nombre, dirección/ciudad/país y su horario; añadir URL Maps compartida o coordenadas verificadas, y opcionalmente Waze. Si la dirección carece de número, preferir coordenadas o URL explícita en lugar de generar una búsqueda ambigua. Verificar manualmente el destino antes de entregar.

Agregar `gifts.url` solo si existe una lista HTTPS autorizada, y `gifts.buttonText` para personalizarla. `sections` controla si regalos está habilitado; sin URL permanece el mensaje. No se agregan pagos ni información bancaria.

Los ejemplos de configuración del README usan variables para datos reales verificados, no establecimientos inventados. Los ejemplos de URL siguientes usan el punto publicado en la documentación oficial de Waze, exclusivamente como ejemplo técnico: no corresponde a una boda de las demos.

## Resultados de validación

- TypeScript: aprobado.
- ESLint: aprobado, sin advertencias.
- Suite nativa: **65 casos aprobados**, los 40 previos y los 25 de esta tarea. Incluye dominios/protocolos, rangos, prioridades, codificación, direcciones insuficientes, destinos ausentes, Google solo/ambos, regalos, independencia, snapshot original y ausencia de enlaces ficticios.
- Build: aprobado, genera las dos rutas existentes.
- HTTP de producción: ambas demos 200 y slug inexistente 404; comprobación de ausencia de acciones ficticias. La ruta temporal de QA devuelve 404 tras retirarse.
- Navegador: apertura explícita de Google Maps y Waze en sus páginas web oficiales; enlace HTTPS de ejemplo abierto; sin interacción con cuentas, sin permisos de geolocalización solicitados por la invitación ni scripts/SDK de mapas.
- Atributos: las acciones incluyen `_blank`, `noopener noreferrer` y nombre accesible por evento/lugar, con aviso de otra pestaña.
- Responsive medido: 320, 375, 390, 430, 768, 1024, 1440 px CSS; sin scroll horizontal, con dirección larga y acciones de 44 px. El viewport temporal se restauró. Las capturas/medidas de QA están claramente separadas de las demos reales del repositorio.
- Página temporal `navigation-qa` retirada antes del build final. Ningún ejemplo técnico se registra como invitación comercial.

## Límites y recomendaciones

Sin geocodificación, verificación de existencia del establecimiento, mapas embebidos, API de Maps, claves, servicios de geolocalización o backend. Una URL sintácticamente correcta no garantiza que apunte al lugar deseado. La política de direcciones es deliberadamente conservadora; para una dirección rural sin número usar coordenadas o enlace verificado.

La selección de origen, acceso, consentimiento, disponibilidad de aplicación y rutas calculadas depende de Google/Waze y de su propio estado en el dispositivo. Convete no incorpora ubicación del invitado a sus enlaces ni invoca geolocalización. Los enlaces de regalos se validan sintácticamente, sin garantizar seguridad/contenido del proveedor de destino.

Para la Tarea 3.3: definir y autorizar su alcance por separado y recopilar los destinos autorizados de una boda real si se pretende una entrega comercial. No se implementó ninguna funcionalidad de la siguiente tarea.

Sin pagos, Supabase, autenticación, servicios nuevos, dependencias nuevas, commits, push o despliegue.

## URLs generadas de ejemplo técnico

```text
Google Maps: https://www.google.com/maps/dir/?api=1&destination=45.6906304%2C-120.810983
Waze: https://www.waze.com/ul?ll=45.6906304%2C-120.810983&navigate=yes
```

Referencias oficiales: [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [Waze Deep Links y coordenadas del ejemplo](https://developers.google.com/waze/deeplinks).
