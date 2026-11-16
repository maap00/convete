# Tarea 3.3 — Auditoría integral de Convete

Fecha: 15 de noviembre de 2026. Entorno: macOS, Node 22.18.0, navegador integrado Chromium, producción local en 127.0.0.1:3101. Sin despliegue, commits, mensajes reales ni avance a Fase 4.

## Resumen ejecutivo

Se conserva Jardín Eterno y las diferencias de ambas demos. Se corrigieron las vulnerabilidades de producción mediante Next.js 16.4.6, el peso de fuentes, la preparación SEO, problemas de lectura móvil, textos extensos, errores accesibles y trabajo innecesario del temporizador RSVP. Las 65 pruebas existentes y cinco pruebas nuevas pasan: **70/70**. TypeScript, ESLint y build final pasan.

Recomendación: **aprobación técnica condicionada de Fase 3 para continuar trabajo local**, no autorización de publicación. Quedan una decisión sobre una dependencia mayor de herramientas, validación en móviles reales y pruebas con dominio público. No quedan vulnerabilidades críticas/altas conocidas en la auditoría de producción; esto no constituye garantía de ausencia de vulnerabilidades.

## Alcance y método

Se inspeccionaron tipos, repositorio, validación de configuración/archivos, temas, InvitationRenderer, componentes compartidos, fechas, contador, RSVP, navegación y enlaces, 65 pruebas previas, README e informes anteriores. Se probaron dos demos y 404 por HTTP; comportamiento de galería y formulario mediante teclado; geometría responsive, fotografías, lectura y variantes mediante navegador. Se ejecutó axe-core 4.14.0 disponible transitivamente en las herramientas, sin instalar dependencias de producto. Una ruta temporal renderizó los mismos componentes y un PerformanceObserver; fue retirada antes del build final.

## Hallazgos por severidad

| Severidad | Hallazgo | Resolución |
|---|---|---|
| Crítico | Next 16.2.6 afectado por avisos de ejecución remota, entre otros; aplicabilidad depende de plataforma/API | Actualización compatible dentro de 16 a 16.4.6, eslint-config-next alineado; lockfile actualizado. Producción sin avisos restantes. |
| Alto | Dependencias de Next: sharp y PostCSS afectados | Actualización resolvió la cadena; npm audit de producción: cero. |
| Medio | Fuentes TTF de 2.529.724 bytes | WOFF2 con glifos completos, 721.928 bytes; mismos nombres, pesos y licencias. −71,46 %. |
| Medio | Falta Twitter Card, previews y estrategia pública/canónica | Helper puro, origen HTTPS explícito, dos imágenes 1200×630, URLs públicas solo cuando exista configuración. |
| Medio | Input/select de 12,48 px, avisos muy pequeños | Campos 16 px para evitar zoom automático habitual de iOS; direcciones/avisos 12 px. Pendiente comprobar dispositivo real. |
| Medio | Nombres largos podían quedar recortados y saltos de línea se colapsaban | Ajuste de corte de palabras, mínimos de grid y pre-line para mensajes. |
| Medio | Blur del nombre validaba asistencia antes de interactuar; errores sin anuncio explícito | Blur valida solo nombre, errores role=alert; foco de primer error en submit conservado. |
| Medio | RSVP deshabilitado actualizaba reloj cada segundo sin necesidad | Inicializa disponibilidad; temporizador solo con RSVP habilitado y deadline. |
| Medio | Reveal podía retrasar secciones altas y ocultar contenido al imprimir/focalizar | Umbral 0; foco dentro e impresión fuerzan visibilidad; reduced-motion conservado. |
| Medio | minimatch 10.2.6 en typescript-eslint 8.72.2, aviso de amplificación de globs | **Pendiente de decisión de compatibilidad**: ocho paquetes moderados derivados del mismo aviso, solo herramientas. npm propone bajar eslint-config-next a 15.5.29; no se aplicó. Corregir con versión futura compatible de typescript-eslint o evaluar override a minimatch ≥11.0.1 y probar lint. No actualización mayor automática. |
| Bajo | Tipografía caligráfica con nombres muy largos aumenta mucho la portada | Ya no recorta; acordar abreviación editorial en personalizaciones extremas. No se cambió el diseño aprobado. |
| Bajo | Previews estáticos no se regeneran al editar nombres/fotos | Paso explícito de entrega; evitar publicar un preview desactualizado. |

Fuentes de seguridad: [aviso de Next/Image Optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [aviso minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249). Evidencia completa en `docs/audits/dependencies-before.json`, `dependencies-after.json`, `dependencies-production.json`. El recuento npm corresponde a paquetes afectados, no a ocho vulnerabilidades independientes.

## Correcciones y archivos

- `package.json`, `package-lock.json`: versiones alineadas y dependencias resueltas sin cambiar versión mayor.
- `public/fonts/*.woff2`, `src/themes/botanical/theme.css`: sustituyen TTF; licencias OFL conservadas.
- `src/features/invitations/metadata.ts`, `src/app/invitacion/[slug]/page.tsx`: metadatos y validación de origen.
- `public/invitations/{laura-martin,ana-carlos}/social.jpg`, `validate-assets.ts`: previews independientes y existencia validada durante build.
- `src/styles/base.css`: lectura, controles, texto extenso, impresión y foco.
- `src/components/wedding/{Rsvp,Reveal,Countdown}.tsx`, `src/lib/countdown.ts`: errores, animaciones y temporizadores; reloj no finito rechazado.
- `tests/metadata.test.ts`, `tests/core.test.ts`, `scripts/verify-http.mjs`: cobertura de metadatos, indexación, origen, reloj inválido, asset social vacío y previews HTTP.
- `README.md`, este informe, `docs/quality-responsive.json`, capturas `docs/screenshots/quality-*` y auditorías JSON: instrucciones y evidencia.

No se modificaron los datos aprobados de las parejas ni sus flags de secciones, receptor o navegación. No se agregó dependencia de ejecución ni servicio externo.

## Pruebas y funcionalidad

| Comprobación | Resultado |
|---|---|
| npm run typecheck | Pasa |
| npm run lint | Pasa |
| npm test | 70/70 |
| npm run build | Pasa; solo rutas de producto, demos SSG |
| npm audit | 0 críticos, 0 altos, 8 moderados en herramientas; salida no cero esperada |
| npm audit --omit=dev | 0 vulnerabilidades |
| HTTP de ambas demos / slug inexistente | 200 / 200 / 404 |
| SEO y previews HTTP | Títulos por pareja, robots, OG locale, Twitter Card; ambos JPEG disponibles |

Las pruebas existentes cubren fecha futura/vencida, zonas y cambio de día, plazo inclusivo, asistencia positiva/negativa, acompañantes, receptor ausente/inválido, mensaje codificado, secciones opcionales, temas independientes, fechas/URLs/archivos inválidos, Maps/Waze y regalos. Las pruebas nuevas comprueban que no se invente origen local, canonical/previews independientes, indexación independiente y rechazo de orígenes ambiguos/inseguros. El contador mantiene placeholders durante SSR para evitar discrepancia de hidratación, no produce negativos y deja de temporizar al vencer.

En navegador: apertura con Enter y cierre con Espacio de galería nativa details; foco visible; entrada de nombre y anuncio de error al salir vacío; dos acompañantes al aceptar; eliminación del selector al rechazar; botón deshabilitado con explicación en demo. No se abrió ni envió un mensaje real. Los flujos habilitados de WhatsApp y enlaces válidos se cubren mediante las pruebas existentes y evidencia de tareas 3.1/3.2; no se afirma una nueva prueba end-to-end contra aplicaciones externas. Las demos conservan destinos ficticios sin botones activos.

## Responsive y revisión visual

Ambas demos: 320, 375, 390, 430, 768, 1024 y 1440 píxeles CSS, altura 844. `scrollWidth === innerWidth` en los catorce casos. Evidencia: `quality-responsive.json`. Galería de dos columnas, contador de cuatro tarjetas y fotos con dimensiones reservadas; campos de 16 px y controles principales de al menos 44 px de alto. La rejilla de Ana y sus secciones omitidas se mantienen.

También se probó landscape 844×390 y contenido de estrés a 390: dos nombres compuestos, mensaje de tres líneas y dirección con palabra muy larga. No recortan horizontalmente y los saltos de línea se mantienen. Se inspeccionaron portada, formulario y galería mediante captura/DOM y se conservaron tipografías, paletas, ornamentación y selección fotográfica. La referencia del usuario es un mockup de varias pantallas; no se promete equivalencia píxel a píxel de una página continua.

Capturas: `quality-cover-320.png`, `quality-ana-390.png`, `quality-rsvp-mobile.png`. El viewport se restauró. **No se verificaron zoom real de navegador, teclado virtual, VoiceOver/TalkBack ni Safari/Firefox**: Chromium con viewport reducido no emula esos comportamientos. Reduced-motion y print se revisaron en CSS; no se simularon preferencias de sistema.

## Accesibilidad

Axe (etiquetas WCAG 2 A/AA, 2.1 AA y 2.2 AA) reportó **cero infracciones automáticas** en las dos demos, con `color-contrast` como revisión incompleta. No equivale a certificar WCAG: contenido fuera de pantalla con animación y ornamentos requieren juicio manual. Se revisaron landmarks, h1/h2/h3, secciones etiquetadas, alt de fotos, decoraciones vacías/aria-hidden, labels, radio group, required, texto de estado, foco y teclado de galería. No se encontraron trampas en los controles probados.

Cálculo de colores base: oliva texto/fondo **10,27:1**, botón/fondo claro **5,71:1**; rosa **11,09:1** y **6,35:1** respectivamente. Errores usan texto oscuro y mensaje, no solo color. Estos ratios no certifican todos los píxeles compuestos sobre adornos ni estados atenuados. El contraste incompleto y la validación con lector real quedan como controles de entrega; no se presenta la auditoría automática como certificación.

## Rendimiento

Mediciones de laboratorio con PerformanceObserver temporal y recursos locales, sin throttling de CPU/red ni caché controlada:

| Muestra | LCP | CLS acumulado observado |
|---|---:|---:|
| Laura, primera navegación antes de aplicar viewport móvil | 244 ms | 0,0001901 |
| Ana, sesión con cambios de viewport | 220 ms | 0 |
| Laura, navegación a 320×640, caché caliente | 108 ms | 0 |

Son muestras exploratorias de localhost, no percentiles ni resultados de Lighthouse, y no comparaciones válidas de rendimiento móvil. La lectura se tomó tras 3,5 s; no recoge toda la vida de página. La suma de layout shifts observada tampoco implementa ventanas de sesión oficiales de CLS. **INP no medido**: el máximo de eventos registrado fue cero por ausencia de eventos antes de la lectura; no se interpreta como INP=0. No hay RUM/CrUX ni confirmación de objetivos CWV en producción.

Datos estáticos verificables: fuentes −1.807.796 bytes; previews JPEG unos 104 KiB en disco (solo bots/compartición, no añadidos al cuerpo de la invitación). Build final: nueve archivos JS en static/chunks, **604.546 bytes / 188.449 bytes gzip** en conjunto; es suma de artefactos, no transferencia inicial por ruta. Componentes cliente limitados a contador, RSVP y Reveal; el resto renderiza en servidor. Imágenes WebP y next/image reservan dimensiones; fotos bajo portada siguen diferidas. No se añadió preload global que descargue una fuente innecesaria para la variante clásica. No hubo errores/warnings en la consola inspeccionada de la variante final de Ana.

## SEO, privacidad y seguridad

Metadatos por invitación: título, descripción, robots, OG website/es_VE y Twitter summary_large_image. HTML lang=es. Con `CONVETE_PUBLIC_ORIGIN` HTTPS real se generan canonical, og:url y URLs absolutas a imágenes propias; sin él se omiten URLs públicas e imagen social para evitar localhost implícito. No hay dominio definitivo configurado ni se asumió maap00.world como hosting. El origen inválido falla durante generación/build. No se consulta DNS: el operador debe confirmar que el origen configurado es público y suyo.

Previews incluidos: 1200×630, fotografía ilustrativa propia de cada demo y nombres. Assets inexistentes fallan en build. Un `seo.image` personalizado puede reemplazar el default; debe revisarse tamaño/proporción y contenido. Cambiar datos implica actualizar su preview. La vista previa de WhatsApp **no está validada** hasta compartir una URL pública accesible y comprobar caché y crawler.

`seo.noIndex` sigue configurable; ambas demos noindex/nofollow. **Noindex no impide acceso**, ni URL difícil sustituye autenticación. No se implementó contraseña. Revisar consentimiento y privacidad de nombres/fotos/ubicaciones antes de publicar.

Se revisaron URLs, listas exactas de dominios, rel=noopener noreferrer, bloqueo de protocolos peligrosos, validación de archivos locales y configuraciones. No se encontraron secretos, almacenamiento de respuestas ni logs de datos personales en src. La única variable añadida es un origen público de servidor. Inputs React se renderizan escapados, sin dangerouslySetInnerHTML. No se incorporaron analytics, geolocalización, APIs ni servicios de monitoreo. La validación tipada no pretende ser un parser de JSON externo no confiable; no hay uploads ni backend en este alcance.

## Riesgos y producción

1. Resolver la actualización de herramientas afectadas por minimatch con decisión de compatibilidad; no usar fix --force indiscriminadamente. Evitar procesar configuraciones/globs de lint no confiables mientras tanto.
2. Ejecutar Safari/iOS y Chrome/Android reales: zoom 200 %, teclado, orientación, lector de pantalla y preferencias de movimiento. Repetir contraste sobre el contenido final personalizado.
3. Configurar origen real antes de reconstruir; probar canonical, OG/Twitter y WhatsApp desde Internet. Revisar privacidad/autorización de fotos, coordenadas, receptor y textos.
4. Medir CWV en condiciones móviles representativas y después en campo; no prometer los resultados locales como SLA.
5. El RSVP depende del reloj del cliente y de que el invitado envíe el mensaje; la invitación no confirma entrega ni guarda respuestas. No se cambió esa decisión de producto.

No se desplegó, no se realizaron commits/push y no se inició Fase 4.
