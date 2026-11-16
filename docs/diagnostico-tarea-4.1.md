# Diagnóstico de Tarea 4.1

Fecha: 15 de noviembre de 2026. Evaluación del código presente frente al prompt proporcionado. No se dispone de un registro de la ejecución original: este informe acredita el estado actual, no su historial.

## Dictamen

Implementación avanzada, pendiente de cierre. No corresponde declarar cumplidos todos los criterios de aceptación.

## Implementación encontrada

- Ruta independiente `/solicitar-invitacion` y componentes para los seis pasos.
- Estado centralizado en React, conservado entre pasos, sin persistencia automática; aviso al abandonar una pestaña modificada.
- Contrato `WeddingInvitationRequest`, `schemaVersion: 1`, separación de datos comerciales, eventos, contenido, recursos, preferencias, RSVP y completitud.
- Validación por pasos e integral; reutilización de utilidades existentes de teléfonos, mapas y temas.
- Ceremonia y recepción independientes o ubicación compartida con horarios distintos.
- Selección local de fotografías, vistas previas, eliminación, límites de tamaño/cantidad y comprobación de cabeceras y decodificación.
- Serialización mediante lista explícita de campos: manifiesto sin objetos File, Base64 ni Blob URLs. Entrega de originales señalada como pendiente.
- Descarga explícita, UUID de exportación y aviso de que descargar no envía la solicitud.
- Tema botanical y paletas olive/rose; configuración de secciones y RSVP con receptor independiente del contacto comercial.
- Ejemplo en `docs/examples/solicitud-invitacion-ejemplo.json`.
- No se encontraron llamadas de red, almacenamiento de navegador ni registros de consola en el módulo comercial revisado. Esto es una revisión estática, no una captura de tráfico.

## Hallazgos

1. **Bloqueo de navegación para omitir vestimenta.** `config.ts` activa dressCode inicialmente; `validation.ts` lo exige en el paso 4; el control para desactivarlo está en `PreferencesStep`, paso 5. `InvitationRequestWizard` impide avanzar si falla la validación y solo permite acceder a pasos ya visitados. Una persona que quiera omitir vestimenta debe introducir un valor provisional para alcanzar el control. Conviene permitir desactivarla en el paso donde se solicita o adelantar las preferencias.
2. **Mensajes obligatorios sin aclaración del criterio.** Portada, bienvenida y cierre son obligatorios en `ContentStep` y `validation.ts`, incluso al desactivar bienvenida. El prompt pide admitir mensajes opcionales vacíos, pero no identifica exhaustivamente cuáles. Solo historia es opcional actualmente. Se debe definir y documentar esta decisión y alinear la validación con las secciones activas.
3. **Documentación incompleta.** Falta `docs/tarea-4.1.md`. README no incluye instrucciones del nuevo formulario y conserva la referencia anterior a 70 pruebas, frente a las 93 actuales.
4. **Cierre visual y de accesibilidad sin acreditar.** Existe `docs/screenshots/request-desktop.png`, pero no se encontró un informe de Tarea 4.1 que cubra los siete anchos solicitados y el recorrido completo. Una captura de escritorio no acredita responsive, teclado, contraste ni lectores de pantalla. No se realizó esa comprobación durante este diagnóstico.

## Verificaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 93 aprobadas, 0 fallidas |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto |
| `npm run build` | Falló: Turbopack no pudo abrir un puerto de su proceso de compilación, `Operation not permitted` |
| Reintento del build con escalación | Mismo error de permisos |
| `npm run build -- --webpack` | Correcto; generó ambas invitaciones y el formulario |
| Inicio de servidor en 127.0.0.1:3100 | Bloqueado por `listen EPERM` |
| HTTP de demos, formulario y 404 | No ejecutado: no fue posible iniciar el servidor |
| Responsive 320, 375, 390, 430, 768, 1024 y 1440 px | No verificado en esta auditoría |
| Flujo manual y descarga en navegador | No verificado en esta auditoría |

El script `scripts/verify-http.mjs` contiene comprobaciones para ambas demos, 404 y formulario, pero su existencia no equivale a una ejecución satisfactoria. Las pruebas automatizadas y el build con Webpack tampoco garantizan preservación visual de las demos.

## Cierre recomendado

Resolver el bloqueo de vestimenta, definir los mensajes opcionales, completar la documentación y ejecutar el recorrido de seis pasos con selección de imágenes y descarga real. Verificar el JSON descargado, las rutas HTTP y los siete anchos, además de teclado y accesibilidad. Repetir el build predeterminado en un entorno que permita los puertos internos del compilador.

Durante el diagnóstico no se modificó código funcional ni se avanzó a Tarea 4.2. No se realizaron commits, push ni despliegues. Los comandos de verificación pueden actualizar artefactos locales de compilación.
