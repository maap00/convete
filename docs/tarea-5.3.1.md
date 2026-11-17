# Convete — Tarea 5.3.1

Fecha de revisión: 17 de noviembre de 2026. Alcance: correcciones locales y preparación de publicación. **No se ha desplegado, cometido, enviado a Git, cambiado DNS, Vercel ni variables de producción.** No se avanzó a Fase 6.

## A. Resumen ejecutivo

**GO técnico condicionado para autorizar una nueva publicación de la demo con Webpack.** Las correcciones están comprobadas en builds locales, no en la versión pública actual. La autorización del propietario y la revisión de configuración del proyecto Vercel preceden a cualquier publicación. **NO-GO para declarar la entrega comercial completa o la demo pública ya corregida.**

Se inspeccionó el informe completo de 5.3, status/diff e historial antes de modificar. Se conservaron las correcciones previas de metadatos, política pública, proxy, cabeceras y pruebas; se completaron su separación por entorno y la protección física de documentos. [Matriz inicial](audits/tarea-5.3.1/matriz-inicial.md).

El generador guarda configuración e informe fuera de `public`; la publicación demo rechaza directorios ajenos a las dos demos incorporadas. Un modo explícito por invitación impide acciones RSVP en demostraciones sin deshabilitar el RSVP comercial. No se cambió el diseño Jardín Eterno, el contrato de solicitudes ni se añadieron dependencias.

## B. Hallazgos y correcciones

| Hallazgo heredado | Corrección existente / completada | Evidencia local |
|---|---|---|
| Faltaban OG image, URL y canonical públicos | Se conservó la solución de 5.3; se añadió metadataBase y resolución independiente de Preview | Pruebas de metadata + HTTP de ambos builds |
| Fixture de desarrollo publicable | Fixture histórica archivada; registro demo solo carga builtins; prebuild rechaza carpetas ajenas | Artefacto: solo Laura y Ana, HTTP fixture 404 |
| Configuración, informe y README en public | Retirada física y generador con dos destinos; config privada es el punto final de registro | Prueba de rollback tras primer rename; generación/HTTP real |
| Riesgo de confirmar asistencia de una demo | `mode: demo` fuerza RSVP deshabilitado, sin teléfono serializado al cliente | Prueba con enabled accidental; DOM botón deshabilitado |
| Preview podía heredar origen de Production | Preview exige origen propio o VERCEL_URL; noindex forzado | Build local Preview con dominio de prueba distinto; HTTP correcto |
| No había inspección física automática del artefacto | Prebuild public + postbuild static, prerender y trazas | 70 entradas inspeccionadas, cero errores |
| WhatsApp, red, físicos, Vercel y PageSpeed | No se simulan como aprobados | Pendientes explícitos en E y F |
| Turbopack | Se reintentó incluso con escalación de permisos, sin cambiar arquitectura | Sigue fallando al crear proceso/abrir puerto durante PostCSS |

### Inventario de exposición previa

Archivos concretos identificados en 5.3 y retirados del árbol público:

| Ruta pública anterior | Clasificación | Ubicación actual |
|---|---|---|
| `/invitations/fixture-generador-local/invitation.json` | Configuración interna ficticia, incluía RSVP de prueba | `tests/fixtures/legacy-generated/fixture-generador-local/invitation.json` |
| `/invitations/fixture-generador-local/preparation-report.json` | Informe interno de generación | Misma carpeta de archivo en tests |
| `/invitations/laura-martin/README.md` | Procedencia de fotografías, documentación interna | `docs/invitation-assets/laura-martin.md` |
| `/invitations/ana-carlos/README.md` | Procedencia de fotografías, documentación interna | `docs/invitation-assets/ana-carlos.md` |
| `/invitations/fixture-generador-local/photos/main-01.webp` | Gráfico de prueba innecesario para demo pública | `tests/fixtures/legacy-generated/fixture-generador-local/photos/main-01.webp` |

Las fotografías, ornamentos, fuentes y sus tres licencias OFL previstos permanecen públicos. Los archivos revisados contienen datos ficticios y procedencia de recursos; no se identificaron credenciales ni datos personales reales en ellos. Esto no equivale a una investigación forense de todos los despliegues. La corrección local no elimina cachés, enlaces ni versiones previas. El propietario debe revisar y contener esas copias tras publicar. Si descubre datos reales o secretos en otras versiones, evaluar alcance, retirar acceso y revocar los secretos afectados.

### Protección y generador

Las nuevas configuraciones e informes viven en `data/invitations/<slug>/`; solo las fotos optimizadas van a `public/invitations/<slug>/photos/`. El registro y el auditor usan el almacén privado, sin fallback al JSON público antiguo. Los comandos check/approve/handoff conservan su contrato; las aprobaciones permanecen en `.convete`, fuera de public. La fixture histórica está archivada y ya no se registra automáticamente.

El dry-run no crea el almacén privado. Se conservan validación, slug seguro, rechazo de enlaces simbólicos, no sobrescritura y locks. La escritura prepara ambos destinos; publica fotos y finalmente configuración. Si falla el segundo rename, retira las fotos recién creadas y etapas propias sin tocar datos preexistentes. No constituye una transacción resistente a cortes del sistema: tras una interrupción abrupta, revisar etapas/locks antes de recuperar manualmente; no borrar carpetas de clientes a ciegas.

La inspección permite JSON legítimos de Next y manifiestos web públicos reconocidos; rechaza documentos en public, symlinks, etapas ocultas y documentos internos conocidos en estáticos/trazas. Next excluye informes, docs, tests y aprobaciones de tracing. En modo demo no se cargan configuraciones generadas privadas y se rechazan directorios públicos de otras invitaciones. Esto evita incluir fotos de clientes inadvertidamente. En modo comercial intencional, el contenido necesario para renderizar una invitación será público; que la fuente JSON sea privada no vuelve confidencial la invitación renderizada.

### SEO y modo demo

Production exige `CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app`; se rechazan HTTP, localhost, IP, rutas, puertos, credenciales y hosts internos comunes. Preview utiliza `CONVETE_PREVIEW_ORIGIN` o `https://${VERCEL_URL}`, nunca el origen de Production por fallback. Preview sin ambos falla antes del build. No se utilizan variables `NEXT_PUBLIC_*` ni secretos nuevos. Local sin origen explícito omite URLs sociales/canonical en vez de inventarlas.

Cada invitación conserva title, description, robots, OG, Twitter Card, imagen propia, alt y canonical. Las imágenes JPEG sociales de ambas demos devolvieron 200; no se cruza contenido de Laura con Ana. Preview siempre es noindex; Production respeta la política por invitación. Noindex es una política de indexación, no una protección de acceso.

Laura y Ana declaran `mode: demo`. `effectiveRsvp` deshabilita la acción y retira su destino incluso si enabled se activa por error. Las fixtures generadas usan demo. Las solicitudes comerciales se transforman con modo commercial; las pruebas conservan el caso RSVP válido habilitado. No se abrió WhatsApp ni se registraron confirmaciones reales. Ana conserva las secciones opcionales ocultas.

## C. Archivos y finalidad

- `src/features/invitations/{metadata,public-policy,registry,repository}.ts`, página de invitación y `scripts/check-public-release.ts`: entornos, validación, registro y SEO.
- `src/features/invitations/{private-store,discovery}.ts`, `src/features/invitation-generator/{generate,transform}.ts`, `src/features/invitation-quality/audit.ts`: datos privados, generación, descubrimiento y auditoría.
- `src/features/invitations/{types,validation,demo,active-view,InvitationRenderer}.ts[x]`, configs Laura/Ana y `src/features/rsvp/{types,whatsapp}.ts`, `Rsvp.tsx`: modo demo reutilizable y protección de acción/destino.
- `src/features/invitations/release-artifact.ts`, `scripts/check-production-artifact.ts`, `package.json`, `next.config.ts`: controles pre/postbuild e inspección de artefactos/trazas.
- `tests/release-preparation.test.ts`: seis pruebas nuevas de entornos, metadataBase, RSVP, árboles públicos, artefactos y rollback entre destinos. Tests anteriores de generador/calidad adaptados al almacén privado; snapshots históricos conservan contenido y comprueban el nuevo modo demo por separado.
- `scripts/verify-generated-http.mjs`: verifica cualquier slug explícito generado; ya no depende de una fixture pública fija.
- Traslados de archivos indicados en el inventario; README, `.env.example`, matriz inicial y este informe documentan operación y límites.
- Se conservaron los cambios previos de 5.3, incluyendo `src/proxy.ts`, política pública, auditoría y verificador HTTP. `next-env.d.ts` se restituyó exactamente al estado al inicio de 5.3.1 después de los builds; ya estaba modificado antes de esta tarea.

## D. Validaciones ejecutadas

Evidencia en [audits/tarea-5.3.1](audits/tarea-5.3.1/). No se presenta una prueba unitaria como sustituto del build/HTTP.

| Comando ejecutado | Resultado |
|---|---|
| `npm test` | 159/159; 153 anteriores conservadas y 6 nuevas |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto |
| `npm run test:commercial` | Correcto en directorio temporal, aprobación solo simulada |
| `node --experimental-strip-types scripts/create-invitation.ts --input docs/examples/solicitud-invitacion-recorrido-4.1.1.json --assets public/invitations/laura-martin --slug fixture-531-validation --fixture` | Creación correcta, informe privado y fotos públicas; solo datos ficticios |
| `CONVETE_PUBLIC_DEMO=false CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app npm run build -- --webpack` | Correcto; ruta generada registrada |
| `node scripts/verify-generated-http.mjs http://127.0.0.1:3110 fixture-531-validation` | Correcto: ruta, motor, secciones, gráficos, demo y documentos 404 |
| `VERCEL_ENV=preview VERCEL_URL=convete-preview-531.example.com CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run build -- --webpack` | Correcto, build local, no despliegue; dominio ficticio solo para comprobar aislamiento |
| `node scripts/verify-public-release.mjs http://127.0.0.1:3110 https://convete-preview-531.example.com` | Correcto sobre el servidor del build Preview |
| `VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run build -- --webpack` | Correcto, build final local Production |
| `node scripts/verify-public-release.mjs http://127.0.0.1:3110 https://convete.vercel.app` | Correcto sobre build Production: demos 200, canonical/OG/robots/cabeceras, imágenes JPEG 200, fixture/documentos/optimizer bypass 404, formulario 200 |
| `node scripts/verify-http.mjs http://127.0.0.1:3110` | Correcto sobre builds local generado y final Production, motor/secciones/formulario/404 |
| `VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run test:artifact` | 70 entradas, sin errores; rutas previstas y sin fixture |
| `VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run build` | Falló por bloqueo ambiental Turbopack: binding to a port, Operation not permitted (os error 1) |

Para cada HTTP se inició `npm start -- --port 3110` con las mismas variables del build; no se reutilizó el servidor de otra variante. La fixture creada para esta validación se retiró de ambos destinos después de su prueba y antes de compilar la demo pública, conservando su informe ficticio en evidencia. Ninguna carpeta previa de cliente fue eliminada.

El postbuild inspeccionó `public`, `.next/static`, prerender-manifest y trazas NFT de `.next/server`. `.vercel/output/static` se inspecciona si existe; no se generó ni se verificó un bundle Vercel real. Los JSON propios de Next permanecen. Cabeceras HTTP comprobadas; caché/CDN/overrides de Vercel no se pueden inferir de localhost.

### Responsive, accesibilidad y formulario

18 mediciones en navegador integrado: Laura, Ana y formulario × 320, 375, 390, 768, 1024 y 1440 px; `scrollWidth` igual a `innerWidth` en todas. Cero imágenes completadas rotas en las mediciones de demos; esto no certifica imágenes lazy aún no cargadas. DOM: títulos, texto alternativo, salto al contenido, galería, cronograma de Laura, RSVP deshabilitado, ausencia de secciones opcionales en Ana. Se conservó CSS y contenido aprobado, con pruebas de regresión. No es una auditoría WCAG completa ni validación física.

Se guardaron `responsive.json`, captura de Laura a 320 y captura del formulario. La captura full-page de Laura no dispara las revelaciones de secciones fuera de viewport; sus zonas vacías no son evidencia de inspección visual de cada sección desplazada. La revisión visual completa mediante scroll y dispositivos físicos queda pendiente; no se afirma una comparación pixel a pixel.

En formulario: errores al avanzar vacío, avance con datos ficticios, fechas/ubicación compartida, fotografía JPEG local, secciones opcionales, resumen y manifiesto, checkbox y descarga JSON. Se leyó el archivo descargado: pareja ficticia correcta, un recurso y RSVP desactivado. Copia en `formulario-export.json`. El navegador mostró «Se preparó la descarga del JSON. No se ha enviado la solicitud». La selección de archivo y descarga tuvieron demoras de automatización. La navegación posterior a otra página devolvió ERR_ABORTED; no afectó el archivo ya descargado.

Revisión de código de `src/features/invitation-requests` y ruta del formulario: no se encontraron fetch, XMLHttpRequest, sendBeacon, localStorage o sessionStorage para transmitir/persistir el borrador. La exportación usa descarga local. **No hubo captura dinámica de red/HAR**: la superficie disponible no expone un registro de solicitudes. Por tanto no se certifica ausencia de tráfico externo, telemetría o transmisión con evidencia de red; requiere DevTools autorizado y HAR saneado.

## E. Riesgos pendientes

- El build predeterminado Turbopack falla en este entorno incluso con el reintento autorizado; Webpack es la vía verificada. **Bloquea publicar si el propietario conserva un comando de build distinto sin verificarlo.** No se cambió configuración remota.
- Vercel: proyecto, cuenta, framework, directorio raíz, Node, build command, variables, cabeceras/caché y logs no inspeccionados en consola. Deben revisarse antes de publicar.
- Demo en Internet, versiones antiguas y cachés siguen sin corregirse por esta tarea local. La validación y contención posteriores son obligatorias.
- WhatsApp/OG real, dispositivos físicos, scroll visual completo, red dinámica y PageSpeed siguen pendientes. PageSpeed heredó un 429 de 5.3; no se afirma una puntuación nueva.
- Una invitación comercial requiere permisos de fotos, receptor RSVP autorizado y aprobación real vigente. Las simulaciones de esta tarea no los sustituyen.

## F. Procedimiento propuesto de despliegue y rollback

**Solo preparación: no ejecutar hasta autorización del propietario.**

### Previos

- [ ] Revisar diff completo incluyendo cambios heredados de 5.3 y todos los archivos nuevos; confirmar versión exacta a publicar.
- [ ] Confirmar cuenta/proyecto Convete, raíz y Node >=22.18; no ejecutar `vercel link` contra un proyecto desconocido.
- [ ] Configurar/revisar Production: `CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app`, `CONVETE_PUBLIC_DEMO=true`.
- [ ] Preview, si se autoriza posteriormente: `CONVETE_PREVIEW_ORIGIN` propio o `VERCEL_URL` automático, sin reutilizar el dominio Production. No desplegar Preview como parte de esta tarea.
- [ ] Verificar comando remoto `npm run build -- --webpack`, o demostrar que el comando elegido supera el bloqueo en el entorno de destino. No cambiar a Turbopack sin validación.
- [ ] Revisar `public` sin carpetas de clientes ni fixtures de prueba. No copiar solicitudes, informes, originales, aprobaciones o este directorio de evidencia allí.
- [ ] Repetir tests, typecheck, lint y build/artefacto con las variables de Production.
- [ ] Elegir previamente un deployment de rollback conocido y sin documentos expuestos.

Comandos propuestos para el operador, **no ejecutados**:

```sh
npm ci
npm test
npm run typecheck
npm run lint
VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run build -- --webpack
VERCEL_ENV=production CONVETE_PUBLIC_ORIGIN=https://convete.vercel.app CONVETE_PUBLIC_DEMO=true npm run test:artifact
# Después de autorización y revisión del proyecto/configuración:
vercel deploy --prod
```

El deploy normal vuelve a construir en Vercel; comprobar que utiliza la misma versión, variables y comando. El artefacto local no demuestra por sí solo lo que Vercel desplegará. Referencias oficiales: [deploy](https://vercel.com/docs/cli/deploy), [rollback](https://vercel.com/docs/cli/rollback), [Next output/tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

### Posteriores (todos pendientes, no marcar antes de publicar)

- [ ] `/`, `/invitacion/laura-martin`, `/invitacion/ana-carlos`, `/solicitar-invitacion`: 200 y contenido propio.
- [ ] Canonical/OG URL/metadataBase y Twitter absolutos del dominio real; imágenes sociales de ambas parejas 200 JPEG, robots según política.
- [ ] Repetir verificador público contra el dominio real; rutas inexistentes y fixture 404.
- [ ] Antiguos invitation.json, preparation-report.json y ambos README: 404; fixture photos y bypass de optimizador: 404. Comprobar enlaces/cachés/deployments anteriores por separado.
- [ ] Demo identificada, RSVP sin acción ni destino, sin envío/registro real. Ana mantiene sus opciones ocultas.
- [ ] Hero, tipografía, proporciones, galería expandida, cronograma, navegación y RSVP mediante scroll en todos los anchos; iOS/Android físicos.
- [ ] Recorrer formulario ficticio, descargar y validar JSON/manifiesto; capturar HAR saneado distinguiendo estáticos, Next, telemetría, terceros y datos del formulario.
- [ ] Validar previsualización WhatsApp autorizada sin enviar confirmaciones ni mensajes reales; revisar caché de OG.
- [ ] Logs Vercel sin errores, build command/variables/cabeceras/cache correctos; repetir PageSpeed cuando disponible.
- [ ] Registrar URL/identificador exactos del deployment y resultado; solo entonces declarar publicación verificada.

### Rollback

Ante exposición de documentos, demo con acción real, rutas rotas o errores graves: conservar evidencia sin secretos y detener la validación comercial. El operador autorizado puede volver al deployment seguro previamente identificado:

```sh
# Sustituir por URL o identificador del deployment seguro revisado:
vercel rollback DEPLOYMENT_URL
```

Verificar de nuevo dominio, rutas, metadatos y documentos 404 después del rollback; registrar resultado. **No volver automáticamente a un deployment anterior que expone los documentos auditados.** Si no hay versión segura, el propietario debe autorizar la contención/restricción o retirada del acceso afectado mediante la plataforma y preparar una corrección, sin reintroducir la exposición. No se ha realizado ninguna operación de cuenta.

## G. Recomendación

**GO condicionado para solicitar autorización de despliegue de la demo corregida**, usando Webpack y tras completar los previos de Vercel. Código, 159 tests, TypeScript, ESLint, builds locales Preview/Production, artefacto y HTTP pasan. La protección ya no depende solo de reglas HTTP: los documentos se retiraron físicamente y el generador no vuelve a colocarlos en public.

**NO-GO para afirmar producción corregida, cierre comercial completo o aprobación de cliente.** Quedan la publicación autorizada y su checklist, red dinámica, WhatsApp/OG real, revisión visual completa y físicos. El propietario conserva el control del siguiente paso; esta tarea no publica.
