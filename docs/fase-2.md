# Convete · Entrega de fase 2

## Resultado y auditoría

Dos configuraciones independientes usan `InvitationRenderer`, la misma ruta dinámica y los mismos componentes. Crear una tercera requiere únicamente archivos de datos, recursos y una entrada en el registro. Se mantuvo `config/` por continuidad y sencillez; renombrarla a `data/` no aportaba una responsabilidad nueva.

La auditoría identificó que el registro ya era explícito, pero solo contenía una invitación; el tema solo ofrecía valores compartidos; ceremonia/recepción no se podían ocultar por separado; las comprobaciones no verificaban existencia de archivos, contraste o cantidades. Los nombres y rutas concretas ya estaban fuera de los componentes. Se conservó esa separación y el diseño aprobado.

## Archivos creados

- `src/themes/personalization.ts`: opciones visuales, paletas, colores, tipografías predefinidas y comprobación de contraste.
- `src/features/invitations/registry.ts`: lista explícita de configuraciones.
- `src/features/invitations/sections.ts`: selección de secciones y lugares sin huecos vacíos.
- `src/features/invitations/validate-assets.ts`: comprobación de archivos locales al cargar el registro, aislada de la presentación.
- `src/features/invitations/config/ana-carlos.ts`: segunda demo autónoma.
- `public/invitations/ana-carlos/`: tres fotografías de otra selección de la colección licenciada, rama SVG, textura SVG y README de procedencia. Todos los recursos tienen rutas propias; se pueden sustituir sin afectar a Laura y Martín.
- `tests/personalization.test.ts`: diez casos nuevos de personalización, registro, independencia y validación.
- `tests/fixtures/laura-martin.json`: configuración aprobada guardada antes de modificar código para detectar regresiones.
- `scripts/verify-http.mjs`: verificación de renderizado de producción de ambas rutas y 404.
- Este informe y capturas `docs/screenshots/{ana-carlos-mobile,laura-martin-phase2}.png`, además de `phase2-responsive.json`.

## Archivos modificados

- `src/features/invitations/types.ts`: personalización opcional, control independiente de lugares en `venues` y texto introductorio de RSVP opcional.
- `src/features/invitations/repository.ts`: carga del registro validado y copias independientes por consulta.
- `src/features/invitations/validation.ts`: mensajes con slug/campo, URLs, fechas, números, secciones, SEO y rutas de recursos.
- `src/features/invitations/InvitationRenderer.tsx`: resolución de tema por invitación, variables CSS, fondo opcional y secciones visibles.
- `src/themes/registry.ts`: resolver visual puro, con valores predeterminados idénticos al diseño aprobado.
- `src/components/wedding/Sections.tsx`: selección independiente de ceremonia/recepción usando el componente existente.
- `src/components/wedding/Rsvp.tsx`: introducción configurable con el texto aprobado como alternativa predeterminada.
- `src/styles/base.css`: reglas optativas para fondo decorativo, trazo suave, secciones con borde y lugares sin fotografía. Ningún selector nuevo cambia la demo original.
- `package.json`: comando `test:http`; no se añadieron dependencias.
- `README.md`: guía completa para crear una tercera invitación y personalizarla sin React ni CSS.

`laura-martin.ts`, sus assets y la lógica de `/invitacion/[slug]` permanecieron sin cambios.

## Arquitectura de personalización

El registro enumera datos; el repositorio valida integridad y archivos y resuelve por slug; el renderer combina la configuración con el tema. El resolver produce variables CSS locales al contenedor, evitando que colores o fuentes de una invitación afecten a otra. Las respuestas del repositorio son copias para evitar mutación accidental entre consumidores.

La personalización incluye paleta, ocho colores semánticos, dos combinaciones tipográficas predefinidas, ornamento floral o mínimo, grosor de iconos, borde opcional y overrides de esquinas/separadores/fondo. Colores opacos hexadecimales y contraste mínimo de 4.5:1 en texto y controles. Las imágenes de fondo se limitan visualmente a 8% de opacidad. No hay CSS libre ni editor.

Ceremonia/recepción se mantienen agrupadas en `venues` para preservar la composición original, con flags independientes. La lista explícita conserva el orden definido por cada configuración; portada y cierre quedan fuera de la lista opcional. Las secciones deshabilitadas, galerías vacías, itinerarios vacíos y grupos de lugares vacíos no se renderizan. El CTA de portada desaparece si RSVP está oculto.

## Ejemplo y tercera invitación

Ejemplo real completo: `src/features/invitations/config/ana-carlos.ts`. La [guía del README](../README.md#guía-práctica-crear-una-tercera-invitación) detalla los ocho pasos, formato de recursos, opciones y fragmento de configuración.

Resumen del procedimiento: crear `public/invitations/<slug>/`, crear una configuración tipada independiente con rutas propias, elegir personalización/secciones y registrarla en `registry.ts`. Ejecutar checks y abrir `/invitacion/<slug>`. No tocar componentes, CSS ni rutas.

## Diferencias entre demos

| Aspecto | Laura y Martín | Ana y Carlos |
| --- | --- | --- |
| Fecha | 17 abril 2027, 16:00, Caracas | 25 septiembre 2027, 17:30, Caracas |
| Paleta | Oliva original | Rosa antiguo |
| Tipografía de encabezados | Cormorant Garamond | Georgia |
| Ornamentación | Flores y follaje original | Ramas mínimas y textura de papel |
| Variante | Secciones sin borde, trazo fino | Secciones con borde, trazo suave |
| Principal/galería | Pareja, galería de seis | Mesa floral, galería de dos |
| Lugares | Ceremonia y recepción | Solo ceremonia |
| Secciones omitidas | Ninguna de las configuradas | Recepción, itinerario, regalos y RSVP |

Ambas usan datos ficticios, fotografías ilustrativas y no permiten enviar confirmaciones.

## Pruebas y evidencia

- `npm run lint`: sin errores ni advertencias.
- `npm run typecheck`: aprobado.
- `npm test`: 20 pruebas aprobadas (10 anteriores y 10 nuevas).
- `npm run build`: aprobado; genera ambas invitaciones con la misma ruta.
- `npm run test:http -- http://127.0.0.1:3100`: ambas rutas 200 con SEO, tokens, contenido y visibilidad correctos; slug inexistente 404. También comprueba portada/cierre esenciales y ausencia de referencias a Laura en la segunda página.
- Navegador: revisión de las dos portadas, tokens calculados, secciones presentes y ausencia de CTA a RSVP oculto. Segunda demo sin desbordamiento a 320, 390, 768 y 1440 px CSS.
- Preservación original: igualdad profunda de la configuración con el snapshot de fase 1; paleta, fuente y orden conservados. Comparación de portada móvil de 390 × 844 px con la captura de fase 1: **ningún píxel cambia más de 10/255 por canal**, diferencia media de 0.0014/255 (variación subvisual de captura). Esto verifica la portada, no es una regresión pixel a pixel de toda la página.

## Límites y pendientes

Validación diseñada para configuraciones TypeScript internas y archivos locales, no para interpretar JSON arbitrario ni sanitizar uploads. SVG de confianza, sin interfaz de carga. No existe backend, persistencia, panel, autenticación o RSVP funcional. La obtención de datos usa el filesystem del proyecto para validar assets durante build/servidor; ejecutar desde la raíz de la aplicación.

Las fotos de la segunda demo son otra selección de la colección ya licenciada, no fotografías de otra pareja real. Sustituir por contenido autorizado y URLs reales al vender una invitación. Recomendación: revisar la segunda demo y aprobar esta fase antes de definir el alcance de fase 3.

Sin cambios en proyectos externos, commits, push o despliegue.
