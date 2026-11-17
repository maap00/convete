# Tarea 5.3 — Auditoría de la demo pública

## Resumen ejecutivo

**No recomiendo declarar la demo completamente validada para difusión comercial general en su estado público actual.** La experiencia visual principal funciona en las comprobaciones realizadas, pero faltan metadatos de compartición y se expone una fixture de desarrollo junto a documentos internos. Se prepararon correcciones locales y se verificaron; **no se desplegaron**. WhatsApp real, tráfico dinámico del formulario y dispositivos físicos siguen pendientes.

URL principal: <https://convete.vercel.app/invitacion/laura-martin>. Auditoría iniciada el **16 de noviembre de 2026** y completada el **17 de noviembre de 2026**, America/Caracas. Las evidencias guardan instantes UTC; el inventario HTTP final terminó el `2026-11-17T18:45:33.431Z`. No hubo commits, push, cambios en el panel de Vercel, mensajes reales, aprobaciones reales ni avance a Fase 6.

No se confirmó un hallazgo CRITICAL en las rutas y recursos consultados. Esto no certifica la ausencia de fallos: varias verificaciones relevantes no pudieron realizarse.

## Herramientas y alcance

Se inspeccionaron README, Tareas 3.3/4.1/4.2/4.3, contratos, configuraciones de ambas demos, registro/repositorio, metadatos, renderizador, fotos, validadores, RSVP, mapas, regalos, formulario y pruebas existentes. El checkout no tenía `next.config` ni configuración local de Vercel. `next-env.d.ts` ya estaba modificado al inicio; se conservó su contenido inicial tras el build.

Herramientas utilizadas:

- curl GET/HEAD pasivo, acotado al host autorizado y sus recursos; compresión y negociación WebP en el inventario final.
- Sharp instalado para dimensiones/formato y huellas de JPEG sociales; no se recomprimieron ni sustituyeron fotos.
- Chromium del navegador integrado: DOM, teclado, screenshots y viewports emulados.
- Runner Node, TypeScript, ESLint, build Next y verificadores HTTP.
- npm audit completo y `--omit=dev`, sin cambios automáticos de dependencias.
- PageSpeed Insights: solicitud fallida con HTTP 429; sin puntuaciones ni datos de campo obtenidos.

El navegador integrado no ofrece captura de red ni Performance Resource Timing en su evaluación. El intento de acceder a Chrome nativo fue rechazado por falta de permisos de Computer Use. No se intentó eludir esa restricción. No hubo acceso al panel autenticado de Vercel ni a Safari, teléfonos físicos o WhatsApp nativo para esta auditoría.

## Resultados HTTP públicos

Se consultaron **49 URLs** en el inventario final, sin errores de conexión. La tabla completa registra HTTP, Content-Type, Cache-Control, tamaño transferido, TTFB y cabeceras en [http-table.md](audits/tarea-5.3/http-table.md); datos estructurados en [http.json](audits/tarea-5.3/http.json). No se conservaron contenidos de documentos potencialmente privados, solo estado/tipo y claves JSON de inventario.

| Ruta / grupo | Resultado público | Interpretación |
| --- | --- | --- |
| `/` | 200 HTML | Lista demos y también la fixture de integración. Texto técnico de vista preliminar. |
| `/invitacion/laura-martin` | 200 HTML | Demo principal accesible. |
| `/invitacion/ana-carlos` | 200 HTML | Demo independiente, paleta rosa y secciones propias. |
| `/solicitar-invitacion` | 200 HTML | Formulario público funcional en recorrido probado. |
| `/invitacion/no-existe-auditoria-5-3` | 404 HTML | Respuesta de ruta inexistente correcta. |
| `/invitacion/fixture-generador-local` | 200 HTML | Fixture de desarrollo públicamente accesible; no es la demo comercial seleccionada. |
| `invitation.json` y `preparation-report.json` de fixture | 200 JSON | Superficie interna expuesta, aunque los datos observados son ficticios. |
| README de ambas demos en `/invitations/.../README.md` | 200 | Documentación interna colocada bajo `public`. |
| `/docs/tarea-4.3.md`, solicitud de ejemplo bajo `/docs/`, `/package.json`, `/.env` | 404 | No accesibles en las rutas exactas consultadas. |
| `/.convete/approvals/laura-martin/` | 308 a la misma ruta sin barra; después 404 | No se accedió a registros reales ni se adivinaron UUID. |
| `/robots.txt` | 404 | No existe archivo; los meta robots de las páginas sí están presentes. |
| Imágenes, ornamentos, chunks, CSS y tres WOFF2 consultados | 200 | Recursos accesibles. |
| JPEG sociales de ambas demos | 200 `image/jpeg`, 1200 × 630 | Formato y dimensiones adecuados. |

HTTP sin TLS redirige **308** a la URL HTTPS equivalente. HTTPS devuelve HSTS de Vercel (`max-age=63072000; includeSubDomains; preload`). No se omitió validación de certificados. No hubo redirecciones inesperadas en las rutas principales HTTPS.

Las páginas HTML envían `public, max-age=0, must-revalidate`; las respuestas muestran `server: Vercel` y señales de prerender/caché. Las tres fuentes tienen también `max-age=0, must-revalidate`. Los detalles por recurso se conservan para no generalizar una política a todos los tipos. curl no siguió automáticamente redirecciones del inventario; el destino sin barra de aprobaciones se consultó por separado.

## Responsive y consistencia visual

Se midieron los **ocho anchos CSS solicitados**: 320, 360, 375, 390, 414, 768, 1024 y 1440 px. Se revisaron Laura, Ana y el resumen final del formulario: **24 mediciones**, todas con `scrollWidth === innerWidth`, H1 único y sin imágenes cargadas que reportaran error de decodificación. El backend de viewport se ajustó cuando su escala difería y se confirmó el ancho CSS real. Evidencia: [responsive.json](audits/tarea-5.3/responsive.json).

Se observaron portada, fuentes, adornos, espacios, contador, lugares/horarios, itinerario, galería, vestimenta, regalos, RSVP y cierre mediante DOM y capturas seleccionadas. La portada móvil y RSVP no mostraron solapamientos ni recortes en las capturas revisadas. Ana conserva su variante y no muestra recepción, itinerario, regalos o RSVP desactivados. No se rediseñó ninguna invitación.

Las mediciones cubren ancho global y estados observados, no una inspección visual exhaustiva de cada píxel de cada sección en las 24 combinaciones. Las fotos lazy o dentro de galería cerrada no se califican como fallidas por no estar cargadas inicialmente. La disponibilidad de los recursos se comprobó también mediante HTTP.

Capturas: `laura-320.jpg`, `laura-1440.jpg`, `laura-rsvp.jpg`, `ana-320.jpg`, `ana-1440.jpg`, `formulario-revision-{320,1440}.jpg` y `formulario-descarga.jpg`, bajo `docs/audits/tarea-5.3/`. Se restauró el viewport al terminar. **Estas son pruebas de Chromium emulado, no teléfonos físicos ni Chrome Android/Safari iOS.**

## Accesibilidad

Se probaron enlaces internos con teclado, expansión de galería con Enter y cierre con Espacio, etiquetas del formulario, errores anunciados, preservación de datos y navegación anterior/siguiente. Se observaron landmarks, un H1 por vista y avisos explícitos de RSVP desactivado. No se enviaron respuestas.

Los colores base locales calculan texto/fondo de 10,27:1 (oliva) y 11,09:1 (rosa); principal/fondo, 5,37:1 y 5,93:1. Véase `contrast-source.json`. Son pares de tokens de fuente, no una certificación de todos los píxeles/estados desplegados. No hubo una nueva ejecución de axe ni una certificación WCAG. Zoom 200 %, lectores de pantalla, teclado virtual y contraste compuesto siguen en el checklist manual.

## Rendimiento y Core Web Vitals

No se obtuvieron puntuaciones Lighthouse Performance/Accessibility/Best Practices/SEO. PageSpeed respondió **429 RESOURCE_EXHAUSTED**; la respuesta se conservó sin identificadores de consumidor en `pagespeed.json`. Chrome nativo no estaba disponible para Lighthouse. **LCP y CLS no fueron medidos; INP de campo no pudo consultarse.** No se afirma que no existan datos CrUX: no se pudo obtenerlos.

Mediciones disponibles del último inventario curl:

| Página | TTFB de muestra | HTML comprimido | JS comprimido declarado en HTML |
| --- | --- | --- | --- |
| Laura/Martín | 491 ms | 8874 B | 189961 B |
| Ana/Carlos | 392 ms | 5830 B | 189961 B |
| Formulario | 392 ms | 3152 B | 195690 B |

Son muestras de red desde el entorno de ejecución, con caché/latencia no controladas. La suma de scripts declarados no es una captura de la transferencia inicial real ni un resultado Lighthouse. TTFB de curl no sustituye LCP ni mide la experiencia de Caracas o un teléfono.

Las tres WOFF2 públicas suman **721928 B**: Great Vibes 162064, Cormorant 209296 e Inter 350568. Se usa `font-display: swap` en el CSS revisado. Los nombres no tienen huella en la URL; no se añadió caché inmutable de un año sin una estrategia de versionado.

Las imágenes optimizadas responden WebP al negociar ese formato. Ejemplos del fallback SSR `w=3840`: ornamento 123458 B, pareja 10342 B y ceremonia 132962 B. El ancho solicitado no implica que se amplíe el original: las dimensiones reales están en el inventario. Estos tamaños **no equivalen al recurso elegido por srcset en cada móvil**. Las fuentes y el adorno superior son candidatos para medir su contribución cuando haya Lighthouse; no se hizo una optimización especulativa ni recomprensión sin comparación visual.

Objetivos orientativos pendientes de medir: LCP ≤2,5 s, CLS ≤0,1, INP ≤200 ms cuando haya campo válido y Performance móvil ≥90 como objetivo, no aprobación automática.

## Fotografías y Open Graph

Se verificaron rutas optimizadas referenciadas por el HTML, tamaños, formatos y dimensiones. Hay dimensiones declaradas, `srcset`/`sizes`, fotos inferiores lazy y carga anticipada del ornamento de portada. La portada es texto con ornamentación; no se añadió preload de una fotografía que no es su hero.

Ambos JPEG sociales son públicamente accesibles sin autenticación, 1200 × 630 y con metadatos por pareja. `og-image-hashes.json` compara los bytes públicos con los archivos locales revisados; la composición local de Laura/Martín muestra sus nombres y el material ilustrativo aprobado. No se sustituyeron fotos, no se alteraron recortes ni se recomprimió material.

## SEO público y WhatsApp

En producción se verificaron `lang=es`, title, description, robots noindex/nofollow, OG title/description/locale/type y Twitter Card independientes para cada invitación. Ana no reutiliza los metadatos de Laura.

**Faltan `og:image`, `og:url`, `twitter:image` y canonical en el HTML público.** Los JPEG existen, pero eso no basta: los bots no reciben la referencia de imagen esperada. El helper actual omite esas URLs si no recibe `CONVETE_PUBLIC_ORIGIN`; el resultado observado es compatible con esa configuración ausente durante build, pero no se inspeccionó el dashboard para confirmar su causa.

No se cambió globalmente la indexación. `noindex` es apropiado para estas demos ficticias y una decisión razonable para invitaciones privadas, pero **no restringe acceso ni reemplaza autenticación**. Tampoco se añadió un robots.txt que bloquee crawlers de compartición sin comprobar su efecto.

**WhatsApp real: pendiente.** No hubo acceso autorizado al cliente nativo para ver su preview y no se enviaron mensajes. No se concluye que la imagen se vea correctamente ni que sea definitivamente inexistente en WhatsApp: puede intervenir caché o extracción alternativa. Primero deben aparecer las etiquetas correctas en la URL pública; después hay que comprobar el borrador de compartir sin enviar.

## Funcionalidades y formulario público

- Contador: se observó actualización de segundos, fecha 17/04/2027 y horarios 16:00/18:00 de Laura en America/Caracas; Ana conserva su fecha y horario propios. El caso vencido se cubre mediante las pruebas locales existentes, no mediante modificación del sitio público.
- Galería: cuatro fotos iniciales y expansión a seis en Laura, apertura/cierre por teclado; Ana conserva sus dos fotos. No hay un carrusel que deba inventarse para considerar funcional la galería.
- RSVP Laura: botón de envío desactivado, mensaje explícito y error de nombre al salir vacío. Con nombre ficticio y «No podré asistir» siguió desactivado. No se abrió WhatsApp, no se envió mensaje ni se registró asistencia.
- Mapas: lugares ficticios sin navegación activa; ausencia de botones reales es intencional. No se abrieron enlaces externos. Validadores y enlaces configurables siguen cubiertos localmente.
- Regalos: Laura muestra texto sin enlace ficticio; en Ana está oculto.
- Formulario: se recorrieron **los seis pasos públicos** con datos ficticios, ubicación compartida y horarios distintos; se seleccionó `social.jpg` de demostración, se observó vista previa, se desactivó galería y vestimenta, se comprobó navegación anterior y se descargó JSON. Se verificaron versión 1, manifiesto de una foto, RSVP apagado, originales pendientes y ausencia de Blob URLs/Base64. Evidencias: `formulario.json` y `solicitud-ficticia-descargada.json`.

**Tráfico del formulario: pendiente de captura dinámica.** La selección y descarga observadas y el código local no sustituyen un HAR. El navegador integrado no expone esa captura; Chrome nativo negó permisos. No se declara ausencia de transmisiones a terceros. Los scripts estáticos enumerados usan rutas del proyecto, pero eso tampoco prueba que no exista telemetría ejecutada dinámicamente.

## Seguridad, privacidad y dependencias

HTTPS/HSTS funcionan. Las rutas exactas de `.env`, package, documentación privada y solicitudes comerciales bajo `/docs` respondieron 404. No se consultaron tokens, cuentas ni registros de clientes reales. No se intentó enumerar UUID de aprobaciones ni se hicieron ataques o barridos ajenos al host.

Sí se verificó exposición de la fixture, su configuración, informe de preparación y README de las demos. Los datos revisados son ficticios; no se confirmó una fuga de información de un cliente real. Aun así, esos documentos internos no deben formar parte de la superficie comercial. La configuración pública contiene el receptor ficticio de la fixture, cuyo RSVP está activo; conviene retirarla de la publicación, no presentarla como otra demo comercial.

El inventario de cabeceras muestra HSTS, pero no las restricciones explícitas de MIME, frames y referencia añadidas localmente. Esa ausencia no demuestra explotación. No se añadió una CSP que pudiera romper scripts inline de Next; requiere un diseño y una prueba específicos si se incorpora después.

Auditoría actual de dependencias: **15 paquetes afectados en herramientas, 9 high y 6 moderate; 0 critical**. `npm audit --omit=dev`: **0 avisos en el grafo de producción instalado**. No son quince vulnerabilidades independientes ni garantía de seguridad absoluta. La cadena incluye [picomatch ReDoS](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) y [minimatch amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249). Npm propone en parte un cambio mayor a eslint-config-next 14; no se aplicó ese downgrade incompatible ni `audit fix --force`. Debe evaluarse una actualización compatible de herramientas. No se demostró acceso público a un ejecutor de glob/lint.

## Vercel y Turbopack

Verificado públicamente: respuestas de Vercel, HTTPS, prerender/caché, rutas y recursos. **No verificado:** Framework Preset, Build Command, variables reales de Production/Preview, permisos del proyecto, deployment SHA, logs y diferencias entre entornos. No había `.vercel` ni `vercel.json` en el checkout y no se accedió a una cuenta autenticada.

El build local predeterminado vuelve a fallar con `creating new process → binding to a port → Operation not permitted (os error 1)` durante PostCSS/Turbopack. Registro: `turbopack.txt`. El sitio público sí responde; no se bloqueó la auditoría por este error ambiental. Los nombres de chunks desplegados incluyen `turbopack-...`, pero no se usan como sustituto del log del build de Vercel ni para afirmar que Turbopack funciona localmente.

## Hallazgos priorizados

| ID | Categoría y descripción | Severidad | Evidencia | Impacto / corrección | Estado |
| --- | --- | --- | --- | --- | --- |
| PUB-01 | Sin OG image/URL/canonical públicos | HIGH | `http.json`, JPEG 200 | Completar origen explícito de Production y verificar compartición | Verificado; preflight corregido localmente; pendiente de despliegue y verificación pública |
| PUB-02 | Fixture enlazada y accesible, RSVP ficticio activo | HIGH | `/` y ruta de fixture 200 | Modo demo con solo las dos configuraciones incorporadas, también en imágenes/optimizador | Verificado; corregido localmente; pendiente de despliegue |
| PUB-03 | JSON, informe y README descargables | MEDIUM | Rutas 200 del inventario | Limitar HTTP de directorios de invitación a recursos gráficos | Verificado; corregido localmente; pendiente de despliegue |
| PUB-04 | Cabeceras de endurecimiento ausentes | LOW | Cabeceras públicas | nosniff, referrer, frame y permisos, sin CSP especulativa | Verificado; corregido localmente; pendiente de despliegue |
| PUB-05 | Avisos high/moderate de herramientas | MEDIUM en este contexto | `dependencies*.json` | Revisar compatibilidad de actualización; producción instalada sin avisos | Verificado; pendiente de revisión, no corregido |
| PUB-06 | Portada raíz con texto técnico preliminar | LOW | `/`, `src/app/page.tsx` | Acordar texto comercial con propietario | Verificado; pendiente editorial, sin cambio de contenido |

La tabla distingue severidad de contexto frente a la etiqueta del advisory. Los huecos de Lighthouse/INP, red dinámica, WhatsApp y dispositivos son **pendientes de validación**, no defectos de rendimiento/exfiltración inventados. No se marcó un problema como resuelto públicamente por corregirlo solo aquí. Detalle estructurado: `findings.json`.

## Correcciones locales y límites

1. `public-policy.ts`: modo demo en Vercel Production/Preview por defecto, con flag explícito; solo expone las dos demos incorporadas. Desarrollo local conserva la fixture. `CONVETE_PUBLIC_DEMO=false` se reserva a una publicación de clientes intencional y revisada, no a un remedio para saltar la auditoría.
2. Repositorio: filtra slugs y consulta según esa política, sin cambiar la lectura local del generador ni crear otra fuente de configuraciones.
3. `src/proxy.ts`: bloquea documentos no gráficos bajo `/invitations`, registros `.convete` y recursos de invitaciones no permitidas, incluyendo el acceso por `/_next/image`. Devuelve 404/no-store, no muestra rutas internas. Se usa la [convención Proxy de Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), que se ejecuta antes de rutas/archivos públicos.
4. `next.config.ts`: nosniff, Referrer-Policy, SAMEORIGIN y Permissions-Policy para cámara/micrófono/geolocalización no utilizados por la aplicación. No toca contenido ni diseño.
5. Prebuild: rechaza Vercel Production sin un `CONVETE_PUBLIC_ORIGIN` HTTPS válido; nunca inventa un dominio. `.env.example` documenta el origen real suministrado por el propietario y el flag demo; no contiene credenciales.

Los archivos siguen disponibles para CLI por filesystem; bloquear su HTTP no destruye configuraciones ni fotografías. Este control no es autenticación. La política de seguridad reemplaza la exposición deliberada de JSON documentada históricamente en 4.2; no se modificaron las demos ni sus datos.

Se verificó un **build local** con `VERCEL_ENV=production`, origen `https://convete.vercel.app` y modo demo true. Solo prerenderiza Laura/Ana. En localhost, canonical/OG son correctos, fixture/JSON/README/aprobaciones e imagen de fixture por optimizador devuelven 404, imágenes sociales y formulario siguen 200. **No demuestra que esas correcciones estén ya en convete.vercel.app.**

## Pruebas y reproducción

- Baseline: 146 pruebas previas aprobadas.
- Final: **153 pruebas aprobadas**, incluidas siete regresiones de política de Production/Preview/local, documentos internos, fotos permitidas, paths codificados/optimizador, origen explícito, SEO independiente/noindex y cabeceras.
- TypeScript y ESLint correctos.
- Build Webpack en modo público correcto; build predeterminado bloqueado ambientalmente.
- HTTP local corregido correcto; HTTP público inventariado por separado.

Comandos reproducibles:

```sh
node scripts/audit-public.mjs
npm test
npm run typecheck
npm run lint
VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run build -- --webpack
VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm start -- --hostname 127.0.0.1 --port 3102
# En otra terminal, con el servidor anterior:
node scripts/verify-public-release.mjs http://127.0.0.1:3102 https://convete.vercel.app
```

La primera consulta solo el host autorizado, limita tiempo/tamaño, no sigue redirecciones y borra cuerpos temporales. Requiere acceso a Internet. Los otros comandos no publican ni ejecutan Vercel CLI. Los datos sintéticos descargados no se cargaron a un servidor mediante estos scripts.

Archivos creados: `next.config.ts`, `.env.example`, `src/proxy.ts`, `src/features/invitations/public-policy.ts`, preflight, auditor HTTP público, verificador local público, `tests/public-release.test.ts`, este informe y evidencias bajo `docs/audits/tarea-5.3/`. Modificados: `package.json`, repositorio y README. `next-env.d.ts` conserva el cambio preexistente del usuario, no una corrección de esta tarea. No se añadieron dependencias.

## Checklist pendiente del propietario

- [ ] Revisar los cambios locales antes de autorizar cualquier despliegue.
- [ ] Confirmar Framework Next.js y Build Command; revisar el log real de Vercel y el deployment/commit seleccionado.
- [ ] Configurar explícitamente origen HTTPS y `CONVETE_PUBLIC_DEMO=true` en los entornos correspondientes; comprobar disponibilidad de [variables de sistema de Vercel](https://vercel.com/docs/environment-variables/system-environment-variables), sin compartir tokens. Las comprobaciones locales no confirman la configuración del dashboard.
- [ ] Tras un despliegue autorizado, repetir HTTP público: metadata completa, JPEG 200, fixture/internos 404, portada solo con demos y sin regresiones.
- [ ] Pegar el enlace en un borrador propio de WhatsApp, **sin pulsar Enviar**; comprobar título, descripción e imagen, registrar fecha y captura sin datos de contactos. Considerar caché de previews; no prometer invalidación inmediata.
- [ ] Capturar red del formulario desde antes de cargarlo hasta después de exportar. Usar solo fixtures y datos ficticios. Revisar URL, método, initiator y payload, distinguiendo estáticos/Next/RSC, telemetría y envíos. Redactar cookies, tokens o cabeceras antes de guardar HAR. La captura sigue pendiente, no se afirma ausencia de transmisiones.
- [ ] Safari iPhone y Chrome Android físicos: fuentes, scroll/táctil, galería, contador, teclado de formularios, orientación, zoom 200 %, foco, VoiceOver/TalkBack y descarga JSON.
- [ ] Chrome y Safari de escritorio reales: mismas interacciones y exportación; no confundir el Chromium integrado con esas pruebas.
- [ ] Ejecutar Lighthouse/PageSpeed cuando esté disponible: cuatro categorías, LCP/CLS/TTFB de laboratorio; INP solo de campo válido, sin sustituirlo por TBT. Medir bajo condiciones registradas.
- [ ] Confirmar permisos de fotos/textos y destinos antes de usar datos de clientes; noindex no los protege de quien tenga el enlace.
- [ ] Revisar actualización compatible de herramientas sin aplicar `audit fix --force` ni downgrades mayores a ciegas.

## Recomendación final

La demo es utilizable para **revisión visual guiada**, con reservas explícitas. No la doy por completamente validada ni recomiendo promoción comercial general antes de resolver PUB-01/PUB-02/PUB-03 en una publicación autorizada y completar al menos preview real y comprobación dinámica de privacidad. Las pruebas físicas y métricas ausentes deben registrarse como pendientes, no como aprobadas.

No se hizo despliegue ni se avanzó a Fase 6. El siguiente paso autorizado en este trabajo termina en un resultado local revisable y un informe de auditoría; publicar requiere una instrucción nueva del propietario.
