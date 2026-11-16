# Tarea 4.2 — Generador local de invitaciones

## Resultado y alcance

Implementado un CLI local que convierte el JSON comercial versión 1 y sus originales en una invitación independiente. Reutiliza `WeddingInvitation`, el renderer, temas, validación, navegación, RSVP y metadatos existentes. No añade backend, panel, servicios externos ni despliegue. La fixture de extremo a extremo es `/invitacion/fixture-generador-local`, identificada visiblemente como prueba ficticia y con indexación desactivada.

## Auditoría y arquitectura

Se revisaron README, Tarea 4.1/4.1.1, ejemplo descargado, contratos, registro/repositorio, resolución de rutas, `InvitationRenderer`, validadores, metadatos, temas, secciones, recursos de `public` y pruebas existentes. Hallazgos relevantes:

- El registro era una lista manual de dos configuraciones TypeScript.
- El formulario produce timestamps con milisegundos `.000Z`; el motor exige segundos sin fracción.
- El motor exige mensajes de bienvenida, vestimenta y regalos incluso para secciones ocultas.
- Colores sugeridos son texto libre y no muestras hexadecimales; indicaciones especiales no tenían campo propio en el motor.
- Ya existe Sharp como dependencia instalada y fijada transitivamente por Next.js.

Organización:

| Archivo | Responsabilidad |
| --- | --- |
| `scripts/create-invitation.ts` | CLI nativo con `parseArgs`, mensajes y códigos de salida |
| `src/features/invitation-generator/input.ts` | Frontera de JSON desconocido, estructura y reutilización de `validateRequest` |
| `slug.ts` | Normalización Unicode y validación de slugs |
| `transform.ts` | Adaptador puro de solicitud a invitación y recursos resueltos |
| `generate.ts` | Plan, lectura/optimización de imágenes, staging, bloqueo, publicación y limpieza |
| `src/features/invitations/builtins.ts` | Lista única de las dos demos incluidas |
| `src/features/invitations/discovery.ts` | Descubrimiento server/build de configuraciones generadas |
| `registry.ts` | Unión de demos y configuraciones descubiertas; repositorio conserva validación y copias independientes |

No hay importaciones ejecutables construidas a partir de datos del cliente. Se leen únicamente archivos `invitation.json` bajo directorios de slug válido. No hay una lista generada paralela que deba mantenerse manualmente.

## Uso para una nueva solicitud

Desde la raíz del proyecto, con Node 22.18+ y las dependencias instaladas mediante `npm ci`:

```sh
npm run invitation:create -- --help
npm run invitation:create -- --input ./solicitud.json --assets ./fotografias --dry-run
npm run invitation:create -- --input ./solicitud.json --assets ./fotografias
```

`--input` es obligatorio. `--assets` apunta a la carpeta plana de originales con los nombres del manifiesto; aunque la opción sea sintácticamente opcional, las solicitudes actuales requieren fotografía principal y por tanto necesitan originales. `--slug pareja-elegida` permite elegir el slug. `--dry-run` prepara y valida sin escribir. `--fixture` añade un aviso visible de prueba con datos ficticios. No hay opción de sobrescritura ni sufijos aleatorios silenciosos. Opciones desconocidas son errores.

Salida: informe JSON en stdout y código 0. Errores: stderr y código 1. `--help` devuelve 0 sin requerir input. El informe muestra estado, slug, pareja, tema, secciones activas, cantidad de fotos, advertencias, archivos relativos, ruta local y duración de preparación. No expone el correo ni el WhatsApp comercial. No inventa un origen público ni un host/puerto local que desconoce.

Después de crear, reiniciar el servidor de desarrollo o reconstruir:

```sh
npm run build
npm start
```

Abrir la ruta `/invitacion/{slug}` en el host y puerto que muestre el servidor. El CLI no arranca servidores ni publica en Internet. En este entorno, el build predeterminado está bloqueado ambientalmente; `npm run build -- --webpack` fue la verificación adicional disponible. No se modificó `build` para desactivar Turbopack.

## Contrato de entrada y validación

Se acepta el documento `WeddingInvitationRequest` con `schemaVersion: 1`. El JSON debe ocupar como máximo 1 MiB. Se valida la forma de objetos, listas (límite estructural 100), strings, números finitos, booleanos, ID y fecha de exportación antes de usarlo. Los errores identifican campos; JSON inválido, versiones futuras, objetos ausentes y tipos incorrectos fallan antes de generar archivos.

El lector reconstruye un borrador usando la zona horaria explícita y reutiliza las reglas comerciales para nombres, contacto, fechas, lugares, mapas, coordenadas, textos, tema/paleta, secciones, RSVP, itinerario y manifiesto. Los instantes se convierten a hora local de la zona únicamente para validar las reglas existentes; no se usa la zona del equipo. Se exige la precisión de minutos del formulario y se rechazan horas ambiguas/inexistentes. La conversión al motor elimina solo `.000`, conservando el instante.

Comprobaciones adicionales de frontera: `sameLocation` debe coincidir realmente entre ubicaciones, las secciones deben ser conocidas y booleanas, RSVP debe coincidir con su sección, y `requiredResourceIds` debe coincidir con principal/galería del manifiesto. Se exige el estado exportado `dataValidated: true` y `originalFilesDelivery: pending`, pero no se confía en esa afirmación: se vuelven a validar datos y originales.

El contrato de exportación omite contenido de secciones desactivadas. Un JSON externo que contradiga esa regla, por ejemplo una vestimenta presente con sección desactivada, se rechaza en vez de perder información silenciosamente. Un documento con campos ajenos al contrato no transfiere esos campos al modelo público: el adaptador construye explícitamente cada propiedad. No se almacena el JSON comercial de entrada en `public`.

## Transformación y campos opcionales

`requestToInvitation(request, slug, resolvedPhotos)` es pura, valida la entrada y el resultado y no depende de reloj, disco o UUID. Conserva nombres, fechas, zona, ubicaciones, mensajes activos, enlaces, preferencias visuales, secciones y RSVP. El ID interno se deriva del slug único, permitiendo crear variantes de una misma solicitud con slugs distintos sin colisionar por ID.

- Portada alimenta `messages.title` y `messages.romantic` para mantener la frase visible.
- Bienvenida ausente por sección desactivada usa portada como valor interno válido. La sección continúa oculta.
- Cierre vacío usa el predeterminado legítimo de 4.1.1: «Gracias por acompañarnos en este nuevo comienzo.».
- Vestimenta y regalos ocultos usan «Sección desactivada.» como valor interno requerido; no se muestran.
- RSVP desactivado no incorpora receptor. Activo conserva su receptor, límite y fecha; no copia el contacto comercial.
- La foto principal se asigna a `storyPhoto`; si historia está desactivada no se inventa otra ubicación visual para ella, se conserva como recurso y para metadatos, con advertencia.
- Historia, mensajes opcionales y descripciones solo se incluyen cuando corresponden.

Para no perder datos comerciales legítimos, se incorporaron dos campos opcionales mínimos al contrato del motor: `guestInstructions` (indicaciones al cierre) y `dressCode.suggestedColors` (texto de colores sugeridos en vestimenta). Usan clases existentes y validación de texto; no interpretan nombres de colores como CSS ni cambian las demos que no tienen esos campos. No se crearon componentes ni CSS por pareja.

## Slugs y seguridad de rutas

Los nombres se normalizan con NFKD, se eliminan marcas de acento, se convierten a minúsculas y los separadores se sustituyen por guiones simples. Solo ASCII alfanumérico y guiones, longitud 3–80. No se aceptan separadores de directorio, puntos relativos, escapes ni nombres reservados como `api`, `admin`, `public`, `themes`, `invitacion` o `solicitar-invitacion`.

Si nombres que no transliteran a ASCII no permiten un slug válido, se pide al operador un `--slug` explícito. No se adivina una transliteración ni se truncan nombres silenciosamente. Se comprueban colisiones con las demos, configuraciones descubiertas y cualquier directorio de destino preexistente.

## Fotografías y optimización

Se comprobó primero el ejemplo real de 4.1.1: referencia `social.jpg`, JPEG de **39048 bytes**. Está disponible como recurso de demostración en `public/invitations/laura-martin/social.jpg`; se utilizó explícitamente como fixture, sin descargar ni inventar imágenes ni modificar la demo.

Cada original debe estar en la carpeta indicada, con nombre y tamaño coincidentes con el manifiesto. Se reutilizan límites comerciales de MIME/extensión, cantidad, tamaño por archivo y total. Se rechazan rutas de salida del directorio, enlaces simbólicos, formatos reales distintos del MIME, imágenes animadas y archivos corruptos. Sharp limita la decodificación a 40 megapíxeles.

Sharp, ya instalado por Next.js, decodifica, aplica orientación, limita a 1800 × 1800 sin ampliar y codifica a WebP con calidad 85. Los archivos producidos son derivados optimizados; no se afirma que copiar equivalga a optimizar. Se registran dimensiones reales del resultado. Los nombres de salida son deterministas por destino e índice (`main-01.webp`, `gallery-02.webp`, etc.) y no dependen de rutas suministradas por el cliente. Los originales permanecen en su carpeta, no se sobrescriben. No se añaden binarios al JSON ni dependencias nuevas al manifiesto del proyecto.

Se reutilizan los ornamentos compartidos de `public/themes`; no se duplican por invitación. La instalación depende de que la versión fijada de Next siga incluyendo Sharp: si esa relación cambia, debe revisarse y declararse la dependencia explícitamente antes de cambiar el stack.

## Escritura, descubrimiento y rollback

Estructura generada:

```text
public/invitations/{slug}/
  invitation.json
  preparation-report.json
  photos/main-01.webp
  photos/...
```

El plan completo (incluida optimización en memoria, validación del modelo, recursos y colisiones) se construye antes de escribir. Dry-run solo ejecuta ese plan: no crea directorios, bloqueos, archivos ni staging.

La creación real reserva `.{slug}.lock` con `mkdir` exclusivo, vuelve a comprobar el destino y prepara todo en `.stage-*` dentro del mismo directorio padre. Los archivos se escriben con `wx`. Al terminar se publica la carpeta mediante un único rename en el mismo sistema de archivos. Ante fallos normales se eliminan únicamente el staging y bloqueo creados por esa ejecución. Nunca se borra un directorio preexistente. Si la limpieza falla, se indican explícitamente las rutas que permanecen y si llegó a publicarse la carpeta completa.

El bloqueo evita que dos ejecuciones cooperantes del CLI publiquen el mismo slug a la vez. El proceso está diseñado para un checkout local de confianza: no es una frontera frente a otro proceso malicioso que reemplace archivos del repositorio durante la ejecución. Un corte de energía o SIGKILL puede dejar `.stage-*` o un lock; no se eliminan automáticamente restos cuya propiedad no pueda demostrarse. Inspeccionarlos y limpiar solo los de una ejecución terminada.

`discovery.ts` se ejecuta solo en servidor/build: examina directorios de slug válido, ignora los nombres internos de staging y lee únicamente `invitation.json`. Rechaza symlinks, configuraciones demasiado grandes y slugs que no coincidan con el directorio. El repositorio valida el registro completo y sus recursos antes de servir invitaciones. Un JSON generado editado manualmente y mal formado puede bloquear el arranque/build; debe corregirse o retirarse por el operador, no ignorarse silenciosamente.

Las configuraciones de `public` son públicas al servir la aplicación. Solo contienen el modelo necesario para la invitación, nunca el contacto comercial de la solicitud. `noindex` no proporciona privacidad ni autenticación.

## Metadatos

Título y descripción propios de la pareja, `noIndex: true` predeterminado, Open Graph/Twitter mediante las utilidades existentes. Se utiliza `seo.image` apuntando a la fotografía principal válida: es el mecanismo aprobado de imagen local explícita, no un servicio externo ni una composición social inventada. Se advierte que el recorte debe revisarse; no se anuncia que exista una tarjeta diseñada de 1200 × 630.

Sin `CONVETE_PUBLIC_ORIGIN`, la política existente omite canonical y URLs sociales absolutas. Con un origen HTTPS público válido se generan mediante `invitationMetadata`; no se inventa un dominio. La indexación no tiene un flag de publicación en este CLI: cualquier cambio requiere revisión posterior de la configuración y autorización de publicación.

## Pruebas y evidencia

**120 pruebas aprobadas, 0 fallidas:** 97 anteriores más 23 pruebas significativas de 4.2. Un test anterior que suponía exactamente dos slugs ahora comprueba que las demos siguen primero y que no hay duplicados, para admitir el registro automático sin eliminar cobertura.

Las nuevas pruebas cubren JSON válido/inválido, versión, tipos, datos incompletos, reglas comerciales, zonas/instantes, incompatibilidades de secciones, transformación pura, mensajes opcionales, RSVP activo/inactivo, mapas/regalos, temas, slugs Unicode/reservados/traversal, manifiestos, recursos ausentes/alterados/corruptos/simbólicos, optimización, copia de derivados, dry-run, colisiones, generación repetida y concurrente, errores de escritura y rename con limpieza de staging, descubrimiento, metadatos, CLI y preservación de demos. Usan directorios temporales y recursos de demostración identificados como fixtures, con limpieza al finalizar.

Comprobaciones finales:

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 120 aprobadas |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto |
| `npm run build -- --webpack` | Correcto; prerenderiza dos demos, fixture y formulario |
| `npm run build` con permisos ampliados | Falla por bloqueo de puerto interno de Turbopack/PostCSS |
| Dry-run con `fixture-simulacion` | Correcto, 108 ms de preparación, sin crear su directorio |
| Creación con `fixture-generador-local --fixture` | Correcta, 60 ms de preparación más escritura local |
| Repetición del slug existente | Código 1, sin sobrescritura |
| HTTP demos/formulario | 200, metadatos y secciones correctos |
| HTTP fixture y WebP | 200, fechas, secciones y metadatos propios; contacto comercial ausente |
| Slug inexistente | 404 |
| Navegador integrado | Portada, contenido, foto, lugares 16:00/18:00, itinerario, RSVP y aviso de fixture renderizados; sin enviar mensajes |

Comandos HTTP, después de iniciar `npm start -- --hostname 127.0.0.1 --port 3100`:

```sh
npm run test:http -- http://127.0.0.1:3100
npm run test:http:generated -- http://127.0.0.1:3100
```

El entorno requirió permisos ampliados para abrir el servidor y conectar Node a localhost. Turbopack sigue fallando con `creating new process → binding to a port → Operation not permitted (os error 1)` al procesar `solicitar-invitacion/request.css`. No se cambió la configuración para esconderlo; Webpack correcto no prueba que Turbopack funcione.

Evidencias: `docs/audits/tarea-4.2/{dry-run.json,tests.txt,webpack.txt,turbopack.txt,http.txt,invitacion-generada.jpg}`. El informe real está en `public/invitations/fixture-generador-local/preparation-report.json`. La generación no modificó los originales ni las configuraciones de Laura/Martín o Ana/Carlos.

## Ejemplo reproducible con la fixture

La invitación de prueba ya está creada. Para simular otra sin escribir:

```sh
npm run invitation:create -- --input docs/examples/solicitud-invitacion-recorrido-4.1.1.json --assets public/invitations/laura-martin --slug fixture-simulacion --fixture --dry-run
```

Para crear una segunda fixture, elegir un slug libre y quitar `--dry-run`. Reutilizar `fixture-generador-local` debe fallar; no existe `--force`. El ejemplo representa datos ficticios y utiliza un receptor reservado de prueba; no se pulsó RSVP ni se envió información a WhatsApp.

## Archivos y cambios

Nuevos: carpeta `src/features/invitation-generator/` (input, slug, transformación y generación), `invitations/builtins.ts`, `invitations/discovery.ts`, CLI, verificador HTTP generado, `tests/invitation-generator.test.ts`, fixture pública con configuración/foto/informe, este documento y evidencias de auditoría.

Modificados: `package.json` (scripts), validador compartido de archivos (MIME desconocidos/prototipo rechazados de forma explícita), registro, contrato/validación de invitaciones, renderer y `Sections.tsx` para los dos campos opcionales imprescindibles, prueba de personalización y README. Sin dependencias nuevas, CSS por pareja, commits, push ni despliegue.

## Limitaciones, tiempo y recomendación

El tiempo medido en esta fixture de una fotografía fue 60 ms para preparar y optimizar; el dry-run posterior 108 ms. No es un benchmark universal ni mide recolección comercial, revisión humana, build o fotografías numerosas/grandes. Con datos/originales correctos, el comando evita editar React/CSS y hace viable el objetivo de preparación comercial en menos de 30 minutos, pero ese plazo no está certificado con una solicitud real.

No se hicieron nuevas pruebas físicas de dispositivos, auditoría completa de accesibilidad ni publicación/verificación de previews externos. Se conservan los límites ambientales de Turbopack. Conviene revisar textos alternativos generados, recorte de foto social y permisos del receptor/fotografías antes de cualquier uso real. El informe de preparación y las rutas internas no son un sistema de gestión comercial.

**Recomendación: aprobar funcionalmente la Tarea 4.2 para uso local, con reserva documentada del build Turbopack ambiental.** El flujo CLI, transformación, registro, renderizado y recursos están comprobados con Webpack, pruebas e HTTP. La aprobación de un entorno de publicación requerirá sus propias verificaciones; no se implementó ni autorizó publicación.

Para Tarea 4.3, solo con autorización: formalizar un esquema público de intercambio y migraciones, mejorar revisión comercial de assets/alt/recortes y definir una estrategia de entrega/publicación separada. No se avanzó a esa tarea.

La vista local final se dejó disponible en `http://127.0.0.1:3100/invitacion/fixture-generador-local` durante la entrega. Si el proceso termina, reconstruir/iniciar con los comandos anteriores.
