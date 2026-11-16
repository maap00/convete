# Tarea 4.1 y cierre 4.1.1 — Formulario comercial Convete

## Objetivo y alcance

Recopilar localmente la información de una boda y descargar una solicitud JSON para el operador comercial. Ruta: `/solicitar-invitacion`. No genera invitaciones, envía solicitudes ni almacena información remotamente. El cierre 4.1.1 corrige secciones condicionales, mensajes y documentación; no implementa Tarea 4.2.

## Arquitectura

`src/app/solicitar-invitacion/page.tsx` monta el formulario y sus estilos independientes. `src/features/invitation-requests/` separa responsabilidades:

- `types.ts`: borrador de interfaz y contrato comercial `WeddingInvitationRequest`.
- `config.ts`: pasos, tema botanical, paletas olive/rose, secciones y cierre predeterminado.
- `useRequestDraft.ts`: estado React centralizado, archivos locales y advertencia al abandonar una pestaña modificada. No persiste en localStorage.
- `validation.ts`: validación por paso e integral; reutiliza teléfonos de RSVP, mapas/coordenadas y registro de temas existentes.
- `dates.ts`: fechas locales y zona IANA a instantes UTC; rechaza fechas imposibles y horas ambiguas o inexistentes por cambio horario.
- `files.ts`: límites, MIME/extensión, manifiesto y cabeceras de imágenes.
- `serialization.ts`: transformación pura mediante lista explícita de campos y normalización.
- `export.ts`: Blob JSON y descarga explícita; libera su URL temporal.
- `components/`: wizard, progreso, seis pasos, campos accesibles, selector de fotografías y resumen.

El renderizador de invitaciones y las configuraciones de las demos no se modifican. El contrato de solicitud es independiente de `WeddingInvitation`.

## Flujo de seis pasos

1. **La pareja:** nombres, fecha, zona IANA, correo y WhatsApp comercial obligatorios.
2. **Los lugares:** ceremonia y recepción con sus propios horarios; ubicación compartida opcional sin sobrescribir el borrador del lugar independiente. Dirección, ciudad y país explícitos; mapas y coordenadas opcionales.
3. **Textos y fotos:** portada, bienvenida/historia, cierre y fotografías. Bienvenida/historia y galería se activan aquí.
4. **La celebración:** vestimenta y colores, itinerario editable, regalos e indicaciones especiales. Los controles de activación se encuentran junto a su contenido, antes de validarlo.
5. **Estilo y RSVP:** tema disponible, paleta, cuenta regresiva, lugares y RSVP. No duplica los controles de secciones de pasos anteriores. RSVP usa un receptor independiente del contacto comercial.
6. **Revisión y entrega:** resumen, acceso a pasos anteriores, confirmación de revisión, validación integral y descarga.

Avanzar valida el paso actual. Anterior y progreso conservan los datos en memoria. Desactivar secciones conserva el borrador, oculta sus campos y retira errores asociados. React no desmonta el estado central al cambiar de paso. Los campos ocultos de bienvenida, vestimenta, regalos e itinerario no bloquean la validación final ni se exportan como contenido activo.

## Reglas de textos y compatibilidad

| Campo | Requisito | Exportación / límite |
| --- | --- | --- |
| Frase de portada | Siempre obligatorio | `content.cover`, hasta 500 caracteres |
| Bienvenida | Obligatoria si bienvenida/historia está activa | `content.welcome`, hasta 2000; omitido si desactivada |
| Historia | Opcional dentro de bienvenida/historia | `content.story`, hasta 6000; omitido si vacío o sección desactivada |
| Cierre | Personalización opcional de una sección esencial | Hasta 2000; vacío usa «Gracias por acompañarnos en este nuevo comienzo.» |
| Código de vestimenta | Obligatorio si vestimenta está activa | Hasta 500; omitido si desactivada |
| Colores sugeridos | Opcional dentro de vestimenta | Hasta 300; omitidos si vacíos o sección desactivada |
| Información de regalos | Obligatoria si regalos está activa | Hasta 2000; omitida si desactivada |
| Indicaciones especiales | Opcionales | Hasta 3000; omitidas si vacías |
| Título de actividad | Obligatorio para actividades de itinerario activo | Hasta 160 |
| Descripción de actividad | Opcional | Hasta 500; omitida si vacía |

Los valores proporcionados en campos activos mantienen límites y rechazo de caracteres de control; no se restringen nombres ni textos a un país. Los espacios exteriores se recortan y los saltos CRLF se normalizan a LF. No se exportan los valores inválidos retenidos en secciones desactivadas. React conserva esos valores para que puedan corregirse al reactivar la sección.

El motor actual exige `messages.title`, `messages.welcome` y `messages.closing` no vacíos, incluso si una sección está oculta. Por ello no se debe pasar esta solicitud directamente al renderizador. Para la futura Tarea 4.2: portada aporta el título y cierre ya contiene el valor final. Si bienvenida está desactivada, el adaptador deberá completar el contrato interno con un valor válido (puede reutilizar portada) y conservar `welcome.enabled: false`. Igualmente, el contrato interno requiere vestimenta y regalos aunque estén ocultos: el adaptador deberá completarlos con valores internos documentados y mantener sus secciones desactivadas. No se implementó ese adaptador ni se modificó el motor en este cierre.

## Resto de validaciones

Correo de estructura válida, teléfono internacional normalizado de 8–15 dígitos, fechas reales, zona IANA, ceremonia correspondiente al día de boda y recepción no anterior a ceremonia. Coordenadas completas con rangos ±90/±180. Google Maps requiere HTTPS y dominio oficial con destino; regalos usa la política HTTPS existente. No se inventan ubicaciones.

Itinerario activo: hasta 20 actividades, identificadores únicos y orden cronológico con fecha completa. RSVP activo: receptor válido, máximo de acompañantes entero 0–20 y fecha límite no posterior a ceremonia. Si está desactivado, no exige ni exporta sus campos.

## Fotografías y manifiesto

JPEG, PNG y WebP; extensión coherente con MIME, cabecera local y decodificación mediante `createImageBitmap`. Hasta 8 MiB y 40 megapíxeles por imagen, 80 MiB en total, 12 imágenes de galería y una por cada otro destino. Nombres e identificadores únicos. Principal obligatoria; galería requiere una foto si está activa. Ceremonia y recepción son opcionales.

Los objetos File y las vistas previas Blob permanecen en memoria y no se incorporan al JSON. Las vistas previas liberan sus URLs. Cada entrada del manifiesto contiene `id`, `filename`, `mimeType`, `size` y `destination` (`main`, `gallery`, `ceremony`, `reception`). Al desactivar galería, sus entradas no se exportan.

Los originales deben entregarse por separado con el JSON. `completeness.originalFilesDelivery` permanece en `pending`: seleccionar una imagen o descargar el manifiesto no acredita su entrega al operador.

## Contrato JSON y exportación

`WeddingInvitationRequest` contiene `schemaVersion: 1`, UUID, `createdAt` UTC, `commercial`, `couple`, `event`, `venues`, `content`, `resources`, `celebration`, `preferences`, `rsvp` y `completeness`. Las horas de ceremonia, recepción, itinerario y RSVP se convierten a ISO UTC; fecha civil y zona IANA se conservan.

Los campos opcionales ausentes se omiten. Vestimenta y colores se omiten si la sección está desactivada, al igual que bienvenida/historia y regalos. Itinerario desactivado se exporta como `[]`. RSVP desactivado se representa como `{ "enabled": false }`. Las preferencias siempre conservan las banderas de todas las secciones.

El contrato permanece en versión 1 porque este es el cierre del primer esquema todavía no aprobado. `content.welcome` y `celebration.dressCode` pasan a ser opcionales en TypeScript para representar secciones desactivadas; futuros consumidores deben respetar las preferencias.

La descarga `solicitud-invitacion-{UUID}.json` solo ocurre tras una acción explícita, revisión y validación integral. La lista explícita de campos excluye File, Base64, Blob URLs y datos temporales de interfaz. Ejemplo original: `docs/examples/solicitud-invitacion-ejemplo.json`. Evidencia del archivo realmente descargado con datos ficticios: `docs/examples/solicitud-invitacion-recorrido-4.1.1.json`.

## Privacidad

No hay backend de recepción, endpoints de solicitudes, analytics ni persistencia automática añadidos. El submit se cancela y la exportación construye un Blob local. Cerrar o recargar descarta el borrador; existe una advertencia de salida. Descargar no significa enviar a maap00.world. El operador debe recibir los archivos por un canal acordado fuera de esta página.

La inspección estática del módulo, ruta y layout no encontró `fetch`, XMLHttpRequest, sendBeacon, logs de información personal ni almacenamiento de navegador. El recorrido observó la descarga local, sin abrir WhatsApp ni destinos externos. No se capturó tráfico de red: el navegador conectado no expone Performance Resource Timing en su evaluación. Esta revisión de privacidad no equivale a una auditoría dinámica de tráfico.

## Pruebas del cierre 4.1.1

- `npm test`: **97 aprobadas, 0 fallidas** (93 anteriores más cuatro regresiones).
- Regresiones: vestimenta activada/desactivada, avance validable y recuperación del borrador; exclusión de contenido oculto inválido sin mutarlo; portada obligatoria/bienvenida condicional/cierre predeterminado; textos opcionales personalizados, límites y controles.
- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `npm run build -- --webpack`: correcto con ambas demos y formulario prerenderizados. Verificación adicional, no sustitución del build predeterminado.
- HTTP en build de producción: `/solicitar-invitacion`, `/invitacion/laura-martin` y `/invitacion/ana-carlos`: 200; `/invitacion/no-existe`: 404. `npm run test:http -- http://127.0.0.1:3100` correcto, incluidos metadatos, secciones y recursos sociales de ambas demos.
- El sandbox bloquea `listen` y conexiones Node con EPERM. Iniciar el servidor y ejecutar HTTP con permisos ampliados permitió completar estas pruebas.

### Turbopack

El build predeterminado se reintentó con permisos ampliados. Falla al procesar CSS a través de PostCSS con esta cadena:

```text
Failed to write app endpoint /page
src/app/solicitar-invitacion/request.css [app-client] (css)
creating new process
binding to a port
Operation not permitted (os error 1)
```

Log de esta ejecución: `/var/folders/6p/bn58v4ws2cb3bj1rrn5lv01m0000gn/T/next-panic-9b794db38c7342d18738f48be1831f45.log`. No es un diagnóstico de sintaxis CSS: la causa anidada es un permiso de apertura de puerto de un proceso del compilador. TypeScript, ESLint y Webpack pasan. La evidencia apunta a una restricción ambiental; no demuestra que Turbopack vaya a terminar correctamente fuera de este entorno. No se cambió la configuración ni el script `build`; queda pendiente repetirlo en un entorno sin esa restricción.

### Navegador y responsive

Se completó en el navegador integrado una solicitud ficticia: pareja, ubicación compartida con horas 16:00/18:00, fotografía principal de demostración con vista previa, historia y cierre vacíos, vestimenta vacía activada con error, desactivación con retirada del error y avance, recuperación del texto al reactivar, itinerario con alta/edición/eliminación y RSVP con contacto independiente. Se usó navegación anterior y progreso para verificar conservación de datos; se regresó del paso 6 al 1 y nuevamente al 6.

La descarga real fue abierta como JSON y comprobada con aserciones: versión, manifiesto, cierre predeterminado, omisión de vestimenta/historia, horarios independientes, RSVP distinto del contacto, entrega de originales pendiente y ausencia de Base64/Blob/datos de UI.

Se midieron **42 combinaciones**: seis pasos × 320, 375, 390, 430, 768, 1024 y 1440 px CSS. En todas `innerWidth` coincidió con el objetivo y `scrollWidth` no lo superó. Se incluyeron nombres/direcciones largos, selector con foto, lista dinámica, RSVP y resumen. Evidencia: `docs/screenshots/tarea-4.1.1/responsive.json`. El navegador tiene escala 1.3, por lo que se ajustó la dimensión solicitada al backend y se comprobó siempre el ancho CSS real.

Se revisaron capturas móviles y el resumen; se comprobó foco, validación con errores, progreso y navegación por Enter/Espacio. El backend de capturas presenta recorte/escala en algunas capturas de página completa; las mediciones DOM son la evidencia de ancho, no las dimensiones físicas de esas imágenes. La captura `descarga-320.jpg` muestra revisión y aviso de descarga local. No se presenta esto como una certificación WCAG ni como pruebas en dispositivos físicos o en todos los navegadores.

## Archivos del cierre

Modificados: `config.ts`, `types.ts`, `validation.ts`, `serialization.ts`; componentes `ContentStep`, `CelebrationStep`, `PreferencesStep`, `InvitationRequestWizard` y `RequestSummary`; `tests/invitation-requests.test.ts` y README. Creados: este documento, `docs/tarea-4.1.1.md`, ejemplo descargado y evidencias bajo `docs/screenshots/tarea-4.1.1/`. No se añadieron dependencias ni se modificaron las demos.

## Limitaciones y recomendación

Las correcciones funcionales solicitadas y el recorrido hasta descarga están verificados. Recomiendo **aprobación condicionada**, sin declarar aprobación completa: sigue pendiente un build predeterminado satisfactorio y la comprobación dinámica de ausencia de tráfico externo. No hay capturas de tráfico ni certificación de accesibilidad; quedan también las comprobaciones habituales en navegadores y dispositivos reales.

Tarea 4.2 solo podrá comenzar con autorización. Su adaptador deberá respetar `schemaVersion`, validar entradas desconocidas, resolver originales del manifiesto y completar los campos internos exigidos por el motor para secciones ocultas. No se realizó implementación de ese generador, commits, push ni despliegue.
