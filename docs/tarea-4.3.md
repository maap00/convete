# Tarea 4.3 — Validación y entrega comercial

Fecha de entrega: 15 de noviembre de 2026 (America/Caracas). Fechas de los registros: ISO UTC.

## Resultado

Convete dispone de auditoría comercial por CLI, checklist adaptado al contenido, registros privados e inmutables de aprobación, huellas de revisión e informes de entrega. La validación técnica nunca crea aprobación. No hay backend nuevo, autenticación, firmas digitales, envíos, servicios externos ni despliegue.

**Estado de la fixture real del proyecto:** técnica `passed`, lista para revisión, aprobación `absent`, estado comercial `ready-for-review`, publicación verificada `false`. Tiene dos advertencias: preparación sin dominio público y contenido ficticio. No se registró una aprobación comercial en este checkout. Las aprobaciones de prueba se ejecutaron en directorios temporales aislados y están marcadas como simuladas en los ejemplos.

## Auditoría inicial y arquitectura

Se revisaron Tareas 4.1, 4.2, 3.3, README, contratos comercial y del motor, registro/discovery/repositorio, validación, fotografías y manifiestos, metadatos, temas, RSVP, navegación, regalos, privacidad, CLI/informes del generador y las 120 pruebas previas.

Se encontró que el validador del motor era estricto incluso con contenido oculto y que el repositorio exigía una vista previa social también en preparación local. Se extendieron esas funciones, manteniendo su modo estricto predeterminado para los consumidores anteriores y sus pruebas:

- `active-view.ts` crea una copia de validación de las secciones activas, conservando la configuración original. Exige los objetos/listas estructurales del contrato y omite recursos o campos operativos de grupos ocultos. No modifica el diseño ni las configuraciones de las demos.
- `validateInvitation` y `validateInvitationRegistry` admiten `activeOnly`. Renderer, repositorio y discovery usan ese modo; la llamada estricta anterior sigue disponible.
- `validateInvitationAssets` comprueba fotos activas y decoraciones compartidas. Su opción `previewOptional` permite preparación local sin imagen social; el repositorio la utiliza solo cuando no hay origen público configurado. En preparación pública vuelve a exigir ese recurso.

Módulos nuevos en `src/features/invitation-quality/`:

| Módulo | Responsabilidad |
| --- | --- |
| `types.ts` | Informes, hallazgos y estados de aprobación/entrega |
| `audit.ts` | Lectura segura de una invitación, validación compartida, lectura de imágenes, huella y medición |
| `approval.ts` | Registro explícito, validación de entradas y evaluación de vigencia |
| `documents.ts` | Checklist de cliente e informe comercial |
| `storage.ts` | Frontera del workspace, rechazo de symlinks y escritura exclusiva |

`scripts/invitation-quality.ts` proporciona los tres comandos; usa `parseArgs` nativo, sin dependencias nuevas. La auditoría lee la configuración seleccionada o la demo incorporada sin importar el registro completo: otra invitación dañada no impide informar sobre la solicitada. El generador sigue siendo la fuente de configuraciones; no se creó un registro paralelo.

## Comandos

Ejecutar desde la raíz, con Node 22.18+ y dependencias instaladas:

```sh
npm run invitation:check -- --slug fixture-generador-local
npm run invitation:check -- --slug fixture-generador-local --json
npm run invitation:check -- --slug fixture-generador-local --checklist
npm run invitation:handoff -- --slug fixture-generador-local
npm run invitation:handoff -- --slug fixture-generador-local --json
```

Por defecto solo leen archivos y escriben su resultado en stdout. Para JSON limpio al redirigir stdout, usar `npm run --silent`; el encabezado habitual de npm no forma parte del documento generado.

Guardar requiere una ruta explícita y nueva:

```sh
npm run invitation:check -- --slug fixture-generador-local --json --output reports/auditoria.json
npm run invitation:check -- --slug fixture-generador-local --checklist --output reports/checklist-cliente.md
npm run invitation:handoff -- --slug fixture-generador-local --output reports/entrega.md
```

`--output` solo acepta archivos `.json`, `.md` o `.txt` dentro de `docs/` o `reports/` del proyecto. No admite sobrescritura, rutas fuera del proyecto, symlinks o destinos públicos. Si el archivo existe, elegir un nombre nuevo. `--help` describe las opciones. Los flags de aprobación se rechazan en comandos de auditoría/entrega.

Códigos: 0 cuando el comando termina y no hay errores técnicos bloqueantes; 1 ante configuración/recursos críticos, entrada/argumentos inválidos o fallo de escritura. Advertencias o aprobación pendiente no convierten por sí solas la ejecución de una auditoría en un error de proceso. **Código 0 no significa aprobada ni lista para publicar:** hay que revisar el estado del informe. Una simulación exitosa devuelve 0 y `status: simulated`, nunca aprobación real.

## Reglas y clasificación

Se reutilizan los validadores del motor para nombres, fecha ISO, zona, mensajes, secciones, tema/paleta, RSVP, itinerario, URLs HTTPS, dominios Maps/Waze, coordenadas y rutas públicas. No se crea un segundo juego de reglas comerciales incompatible. El validador existente informa el primer defecto de configuración: se corrige y se repite para descubrir los siguientes; las comprobaciones independientes de recursos sí acumulan hallazgos.

| Nivel | Ejemplos y efecto |
| --- | --- |
| ERROR | JSON/configuración ilegible, esquema estructural inválido, tema desconocido, campos obligatorios activos inválidos, RSVP activo sin receptor válido, enlace inseguro, coordenadas inválidas, foto activa referenciada ausente/corrupta, dimensiones declaradas falsas o decoración requerida faltante. Bloquea revisión/aprobación/preparación pública. |
| WARNING | Resolución reducida, peso elevado, galería con menos de tres fotos, itinerario activo vacío, dirección incompleta, plazo RSVP vencido, metadatos sociales incompletos en contexto local, ausencia de origen público, indexación habilitada o demo. Requiere revisión; no equivale automáticamente a error técnico local. |
| INFO | Tema/secciones/recursos del resumen, fallback de historia a bienvenida, RSVP desactivado, canales de navegación disponibles, noindex y evento histórico. |

Se bloquean además campos de credenciales o contacto privado reconocibles (por ejemplo `apiKey`, `password`, `commercial`, `contact` o `email`) dentro de la configuración pública. El informe no muestra sus valores. La inspección se limita a profundidad 32 y 20.000 nodos; una estructura mayor se bloquea. Es una comprobación conservadora de claves, no una garantía de detectar secretos arbitrarios insertados como texto.

Una fotografía opcional no referenciada no se exige. Las fotos de galería, historia o lugares ocultos no se cuentan como faltantes. Las decoraciones compartidas sí son necesarias para el tema activo. La principal es opcional en `WeddingInvitation`; si se referencia en historia activa, el archivo debe existir. Si solo sirve como vista social, se aplica la regla de ese contexto.

La imagen Open Graph faltante o incompatible es advertencia en preparación local y bloqueo de publicación en el informe de entrega. Con un origen público explícito su archivo se exige también técnicamente. Título y descripción vacíos continúan siendo configuración inválida según el contrato del motor. No se exige dominio durante preparación local.

RSVP valida formato/configuración, límite y plazo mediante funciones existentes. No verifica que una cuenta de WhatsApp exista ni envía mensajes. Un plazo vencido es advertencia; una boda pasada es información, no configuración inválida. El contador existente termina en cero. No se añade una regla cultural que obligue a que recepción y ceremonia tengan un orden concreto. Fechas ISO distintas entre lugares y fecha principal se señalan para confirmar zona/día, sin inventar horarios.

Mapas y Waze se resuelven con los helpers existentes sin abrir enlaces. Los regalos sin URL muestran texto sin botón ficticio; confirmar destino y texto del botón requiere revisión humana.

## Fotografías: método y umbrales

La auditoría no copia, recomprime ni modifica imágenes. Lee recursos activos bajo `public`, rechaza symlinks y escapes del workspace, calcula SHA-256 y usa Sharp ya instalado para metadatos y decodificación de raster.

- Límite de lectura de un recurso: 20 MiB. Un recurso por encima no se procesa como válido; ERROR si es requerido, WARNING si solo es vista social local.
- Límite de decodificación: 40 megapíxeles. Formatos reales coherentes con JPEG, PNG, WebP o AVIF; se rechazan animados y archivos corruptos.
- Resolución menor de 800 px en el lado mayor: WARNING.
- Imagen social menor de 1200 × 630: WARNING; no significa que se haya diseñado o verificado su recorte.
- Peso superior a 2 MiB: WARNING.
- Dimensiones declaradas de una foto distintas de las reales: ERROR.
- SVG decorativos compartidos: existencia, ruta segura y hash; no se ejecutan ni recomprimen. Son recursos de confianza del tema, no uploads arbitrarios sanitizados.

El informe diferencia foto, vista social y decoración, lista roles, existencia, validez, bytes, dimensiones y hash cuando corresponde. Una misma imagen usada en historia y SEO se lee una vez y conserva ambos roles.

## Checklist para el cliente

[Ejemplo generado](audits/tarea-4.3/checklist-fixture.md). El documento usa lenguaje común, casillas sin marcar, nombres de pareja y referencia de versión. Incluye nombres, fecha, lugares/direcciones/horarios visibles, fotos y permisos, mensajes, actividades, vestimenta, regalos, RSVP, tema/colores, revisión en teléfono, privacidad y autorización separada de publicación. Omite secciones desactivadas.

No contiene instrucciones sobre React, Next.js o JSON. Generarlo no demuestra que nadie lo haya leído ni firmado. El operador debe recibir la confirmación real por el canal acordado y conservar su evidencia fuera de este mecanismo. Confirmar que el checklist fue revisado no sustituye el flag independiente de autorización para publicar.

## Registro explícito de aprobación

Solo después de recibir aprobación real, sustituir los marcadores por los datos confirmados:

```sh
npm run invitation:approve -- --slug SLUG_REAL --responsible "RESPONSABLE_CONFIRMADO" --approved-at FECHA_ISO_CON_ZONA --reviewed-fingerprint HUELLA_DEL_INFORME --confirm-client-approval --confirm-checklist --acknowledge-warnings
```

La fecha debe ser la de aprobación comunicada, no una fecha inventada ni autocompletada desde el reloj. El instante requiere zona y no puede estar en el futuro. El sistema añade por separado `recordedAt`, que mide cuándo el operador hizo el registro.

Opciones:

- `--authorize-publication`: solo si se recibió además esa autorización explícita. Sin él puede existir aprobación del contenido, pero no preparación para publicación.
- `--observations`: observaciones opcionales, hasta 2000 caracteres; evitar información sensible innecesaria.
- `--human-review-minutes`: duración declarada por el operador si realmente fue medida. Si se omite queda desconocida; no se deriva de tiempos de scripts.
- `--simulation`: ensayo explícito. Las demos/fixtures solo admiten este modo y jamás cuentan como aprobación comercial real.

La operación vuelve a auditar, exige ausencia de errores, huella exacta, responsable explícito, checklist/aprobación recibida confirmados y advertencias reconocidas. Rechaza identidades vacías, fechas imposibles/futuras, controles y duraciones inválidas.

Registros: `.convete/approvals/{slug}/{UUID}.json`, fuera de `public`, ignorados por Git, directorios privados y archivos nuevos con permisos 0600. Contienen versión, slug, responsable, fechas, huella, estado, confirmación de checklist, autorización separada, códigos de advertencia revisados y observaciones/duración opcionales. No se sobrescriben registros anteriores. El informe de entrega no copia la identidad ni observaciones del responsable.

Registros inválidos o conflictos de fecha fallan de forma conservadora. Si hay varios, se considera el más reciente por fecha de registro; conflictos diferentes con la misma fecha no producen una aprobación elegida arbitrariamente. Un registro dañado requiere inspección del operador, no se ignora silenciosamente.

Esto es una declaración local del operador, **no una firma digital, autenticación del cliente ni prueba independiente de consentimiento**. Quien puede editar archivos del proyecto puede alterar registros. No se implementó revocación, servicio de identidad ni cadena legal de custodia; cualquier retirada de autorización debe detener la entrega y resolverse con el operador antes de usar el informe.

[Ejemplo ficticio de registro](audits/tarea-4.3/aprobacion-simulada-ejemplo.json): envuelto con un aviso y `status: simulated`. Se produjo en un directorio temporal y no creó registros privados en este checkout.

## Huella y control de cambios

SHA-256 determinista de:

1. Configuración completa, incluidos campos ocultos, serializada con claves ordenadas. Reordenar claves no cambia la huella.
2. Bytes de fotos activas, vista social y decoraciones relevantes; ausencias se representan explícitamente.
3. Fuentes, estilos, tema, renderer y dependencias locales de UI, RSVP, navegación, fechas y validación enumeradas en `audit.ts`.
4. Versión de reglas y contexto de origen público.

Cambiar configuración, activar una sección, reemplazar una foto relevante, modificar adornos/estilos/fuentes o cambiar el origen invalida la aprobación. No se usan mtime, hora de auditoría ni el informe de preparación como sustitutos del contenido. Cambiar un archivo de foto no referenciado no invalida por sí solo; activar su sección sí cambia la configuración.

El estado pasa a `stale` cuando la huella del registro no corresponde. Si aparecen nuevas advertencias dependientes del tiempo —por ejemplo RSVP vencido—, pueden conservarse los datos aprobados pero se bloquea preparación pública hasta reconocerlas en una nueva aprobación. Reauditar siempre inmediatamente antes de entregar.

La huella no certifica el runtime, todas las dependencias de terceros, el navegador ni una infraestructura desplegada. No bloquea procesos concurrentes maliciosos: trabajar en un checkout controlado, sin editar durante la revisión. Cambios de herramientas/entorno requieren repetir build, pruebas y revisión humana. Reiniciar/reconstruir la vista local antes de mostrársela al cliente para que represente los archivos auditados.

## Estados e informe de entrega

[Informe de ejemplo](audits/tarea-4.3/entrega-fixture.md).

| Estado | Significado |
| --- | --- |
| `blocked` | Hay errores técnicos. No está lista para revisión/aprobación. |
| `ready-for-review` | Técnica correcta; aprobación real ausente, simulada, inválida o desactualizada. |
| `client-approved` | Aprobación real vigente; aún hay pendientes para publicación. |
| `ready-for-publication` | Técnica correcta, aprobación real vigente, advertencias actuales reconocidas, autorización explícita, origen válido, vista social válida y contenido no marcado como demo. Es preparación local, no despliegue. |

`publishedAndVerified` siempre es **false**. No hay opción CLI que establezca publicación verificada. El informe distingue ruta local de dominio público e incluye identificador, pareja, tema, fecha, secciones, estados, hallazgos, recursos, tiempos conocidos y próximos pasos.

Una advertencia no bloquea automáticamente revisión técnica; para preparación pública debe haber sido reconocida por una aprobación real vigente. La sintaxis de un origen HTTPS no prueba propiedad, DNS, disponibilidad ni accesibilidad para crawlers. Comprobar URL, TLS, recursos, móvil, canonical y preview de WhatsApp después de un despliegue autorizado sigue siendo trabajo externo pendiente.

## Flujo comercial reproducible

1. Recibir JSON y todos los originales; conservarlos fuera de `public`.
2. Ejecutar `invitation:create --dry-run` y resolver datos/recursos faltantes.
3. Crear la invitación con un slug libre.
4. Reconstruir o reiniciar desarrollo y abrir su ruta local.
5. Ejecutar `invitation:check`, corregir ERROR y revisar WARNING.
6. Generar checklist en una ruta nueva.
7. Revisar con el cliente la vista actual, también en teléfono; confirmar permisos, contenido y destinatarios.
8. Recibir aprobación real y, por separado, autorización de publicación si corresponde.
9. Registrar con `invitation:approve` la huella exacta y datos confirmados.
10. Reauditar y generar `invitation:handoff`. No avanzar si hay errores, aprobación antigua o pendientes de publicación.
11. Entregar al responsable del paso siguiente; estos comandos no despliegan ni envían mensajes.

Ensayo aislado repetible:

```sh
npm run test:commercial
```

Crea un directorio temporal, usa la solicitud ficticia 4.1.1 y la foto de demostración existente como fixture, prueba dry-run sin cambios, generación, auditoría, checklist, aprobación simulada y entrega; después limpia el directorio. No registra consentimiento en el proyecto. La comprobación de ruta/renderizado usa la fixture de proyecto existente y las pruebas HTTP, sin modificarla.

## Tiempos medidos

Muestra final de una sola foto, guardada en [tiempos.json](audits/tarea-4.3/tiempos.json):

| Operación | Tiempo |
| --- | --- |
| Dry-run completo | 55 ms |
| Lectura/validación de solicitud en ese dry-run | 15 ms |
| Validación/optimización de recursos en la creación posterior | 38 ms |
| Creación total posterior, incluidas escrituras/publicación local de carpeta | 40 ms |
| Auditoría aislada | 46 ms |
| Preparación de checklist | 0 ms (menos de 1 ms a esta resolución) |
| Registro simulado, incluida reauditoría | 42 ms |
| Informe de entrega, incluida reauditoría | 42 ms |
| Revisión humana | **No medida** |

Son operaciones/sesiones distintas, con milisegundos redondeados; no sumar subfases de un dry-run a otra creación ni auditorías incluidas de nuevo en registro/entrega. No son percentiles ni un benchmark de solicitudes grandes.

El generador devuelve ahora `timings.validationMs`, `assetPreparationMs` y `generationTotalMs`; el último se completa en la respuesta CLI tras el rename final. El archivo `preparation-report.json`, escrito antes del rename, conserva ese total como `null`; no se fabrica una medida posterior dentro de un informe anterior. `elapsedMs` histórico sigue midiendo preparación. El auditor diferencia esa medida de la revisión humana.

**No se ha demostrado la meta comercial de menos de 30 minutos.** Falta medir un caso real completo, con comunicación, revisión del cliente y correcciones. Los tiempos automáticos no sustituyen esa medición.

## Pruebas y verificación

**146 pruebas aprobadas, 0 fallidas:** 120 anteriores y 26 pruebas de comportamiento nuevas. Cubren invitaciones válidas/inexistentes/ilegibles, tema/configuración inválidos y datos privados sin filtración en el informe, foto activa faltante, opcionales/ocultas, formato/dimensiones/baja resolución, RSVP activo/desactivado, mapas/regalos/coordenadas, fechas históricas, contexto local/público, checklist condicional, aprobación explícita/ausente/simulada/inválida, huella estable y cambios posteriores, advertencias nuevas, estados, reportes, no sobrescritura, traversal/symlinks, códigos CLI, solo lectura, simulación CLI, tiempos y compatibilidad de demos.

| Verificación | Resultado |
| --- | --- |
| `npm test` | 146/146 |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto, sin advertencias |
| `npm run build -- --webpack` | Correcto; prerenderiza ambas demos, fixture y formulario |
| `npm run build` con permisos ampliados | Bloqueo ambiental Turbopack/PostCSS: `creating new process → binding to a port → Operation not permitted (os error 1)` |
| Auditoría CLI de fixture | `passed`, dos WARNING, sin aprobación real |
| Checklist e informe mediante `--output` | Creados explícitamente como archivos nuevos |
| Aprobación ficticia aislada | `simulated`; nunca `client-approved` ni publicada |
| HTTP ambas demos, formulario y fixture/WebP | 200, contenido/metadatos/secciones correctos |
| HTTP slug inexistente | 404 |

El servidor y conexiones Node a localhost requirieron permisos ampliados. Webpack correcto no se presenta como prueba de funcionamiento de Turbopack. No se alteró el script `build` para desactivarlo. Evidencias en `docs/audits/tarea-4.3/`: tests, Webpack, Turbopack, HTTP, auditoría, checklist, entrega y flujo/registro/times ficticios aislados.

No se modificaron los JSON/configuraciones ni fotografías de las invitaciones existentes. Se comprobó que la auditoría no altera los archivos y que las demos permanecen independientes. No se realizó una nueva auditoría de dependencias ni nueva certificación de accesibilidad; los límites documentados en 3.3 y 4.1 siguen requiriendo revisión en una entrega real.

## Archivos creados y modificados

Nuevos: carpeta `src/features/invitation-quality/`, `invitations/active-view.ts`, `scripts/invitation-quality.ts`, `scripts/verify-commercial-flow.ts`, `tests/invitation-quality.test.ts`, este documento y ejemplos/evidencias bajo `docs/audits/tarea-4.3/`.

Modificados: `package.json` (scripts), `.gitignore` (registros privados), validación/recursos/repositorio/discovery del motor, llamada de validación del renderer, mediciones del generador y README. No hay dependencias nuevas, rediseño, commits, push ni despliegue.

## Recomendación sobre Fase 4 y pendientes

**Aprobación técnica local condicionada de Fase 4.** El circuito solicitud → generación → auditoría → revisión → registro explícito → entrega está implementado y probado de forma aislada. No representa aprobación comercial de un cliente real ni autorización de publicación.

Antes de una entrega pública: completar revisión humana real y consentimiento/permisos, medir el flujo comercial real, resolver el build predeterminado en un entorno adecuado, repetir dispositivos/lectores reales, revisar seguridad/dependencias, configurar origen real y planificar por separado el despliegue autorizado y sus comprobaciones posteriores. WhatsApp no se verifica hasta comprobar una URL pública accesible; no se enviaron mensajes ni correos.

No se avanzó a la Fase 5.
