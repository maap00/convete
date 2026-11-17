# Matriz inicial — antes de modificar la implementación

Estado recibido: 153 pruebas documentadas; un commit histórico b92f760. Se inspeccionaron status/diff; README, package y repositorio modificados, next-env preexistente y archivos 5.3 sin seguimiento. No se descartaron cambios.

| Hallazgo | Corrección existente | Evidencia inspeccionada | Acción necesaria |
| --- | --- | --- | --- |
| OG/canonical ausentes | Helper correcto con origen explícito; prebuild exige origen Production | metadata.ts, public-policy.ts, tests/public-release.test.ts, HTTP 5.3 | Completar metadataBase y resolución independiente Preview; verificar build/HTML real |
| Documentos internos en public | Proxy devuelve 404 por política | src/proxy.ts, public-policy.ts, pruebas/HTTP local 5.3 | Retirar físicamente JSON/informes/README; cambiar generador, discovery y calidad; escanear public/artefacto |
| Fixture publicada | Lista de demos incorporadas en Production/Preview | repository.ts y política existente | Conservar filtro; proteger también RSVP con modo explícito por invitación |
| RSVP de demos | Ambas demos tienen enabled:false y aviso | Configuraciones Laura/Ana y Rsvp | Añadir invariante reutilizable demo que bloquee acciones aunque enabled se active accidentalmente; conservar clientes live |
| Generador | Validación, dry-run, lock/staging/rollback | generate.ts y pruebas existentes | Separar documentos privados de gráficos públicos sin perder rollback entre directorios |
| Tráfico/WhatsApp/dispositivos | Evidencia pública previa, captura pendiente por permisos | tarea-5.3.md completo y artefactos | Revalidar lo posible; no afirmar captura ni pruebas físicas no realizadas |
| Turbopack | Bloqueo documentado de puertos; Webpack pasó | logs de 5.3 | Reintentar sin cambios arquitectónicos para eludir sandbox; mantener build reproducible |
