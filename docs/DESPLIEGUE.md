# Despliegue automático de Mentorinc

Conexión nativa de GitHub activada el 14 de octubre de 2026 en el proyecto `mentorinc-cursos`. URL: <https://mentorinc-cursos.pages.dev/>. El primer despliegue del commit `3911401` finalizó correctamente, con 22 pruebas aprobadas y compilación estática completada.

## Configuración de Pages

- Repositorio: `RynoxNetwork/Mentorinc-Cursos`.
- Rama publicada: `main`.
- Directorio raíz: `/`.
- Node.js: `24.18.0`, fijado en `.node-version`.
- Comando: `npm ci && npm test && npm run build`.
- Salida: `dist`.
- Variable de build: `SKIP_DEPENDENCY_INSTALL=1`, para usar una única instalación reproducible con el lockfile.
- La aplicación estática no requiere secretos ni funciones.

Cada push a `main` dispara un despliegue de producción. Un cambio debe superar las pruebas y la compilación antes de generar la nueva publicación. Comprobar en Deployments que el SHA coincide con el commit enviado, su estado es `success` y la URL pública sirve la versión esperada. Un build fallido no acredita publicación.

Las rutas internas usan el comportamiento SPA nativo de Pages, activado al no incluir `404.html` en la raíz. `_redirects` conserva solo comentarios: la regla global anterior a `/index.html` era ignorada por Cloudflare por crear un bucle. `_headers` mantiene las cabeceras del sitio.

Para volver a una versión anterior, usar el rollback de un despliegue de producción exitoso en Cloudflare y revertir el cambio correspondiente en Git para mantener ambas fuentes alineadas. No eliminar el proyecto como mecanismo de recuperación.

## Proyecto existente

`mentorinc-impulso` se creó con Direct Upload y conserva la demo en <https://mentorinc-impulso.pages.dev/>. Cloudflare no permite convertir un proyecto Direct Upload a integración Git nativa. La conexión nativa requiere un nuevo proyecto; no borrar el anterior para reutilizar su nombre.

La URL anterior se conserva como demo histórica manual. Cada origen mantiene datos locales independientes; exportarlos desde la dirección original si se necesitan conservar. La integración nativa usa la aplicación oficial de Cloudflare autorizada para este repositorio; no se añadieron tokens al código ni secretos de GitHub.

## Fuentes oficiales

- [Direct Upload y restricción de conversión](https://developers.cloudflare.com/pages/get-started/direct-upload/).
- [Integración GitHub](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/).
- [Configuración de compilación](https://developers.cloudflare.com/pages/configuration/build-configuration/).
- [Versiones de Node y omisión de instalación automática](https://developers.cloudflare.com/pages/configuration/build-image/).
- [Rutas y comportamiento SPA nativo](https://developers.cloudflare.com/pages/configuration/serving-pages/).
