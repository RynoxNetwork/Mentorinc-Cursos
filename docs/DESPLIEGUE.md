# Despliegue automático de Mentorinc

Configuración preparada el 14 de octubre de 2026. La conexión de GitHub todavía requiere terminar la autorización de la aplicación Cloudflare Pages; este documento no acredita que esté activada.

## Configuración de Pages

- Repositorio: `RynoxNetwork/Mentorinc-Cursos`.
- Rama publicada: `main`.
- Directorio raíz: `/`.
- Node.js: `24.18.0`, fijado en `.node-version`.
- Comando: `npm ci && npm test && npm run build`.
- Salida: `dist`.
- Variable de build: `SKIP_DEPENDENCY_INSTALL=1`, para usar una única instalación reproducible con el lockfile.
- La aplicación estática no requiere secretos ni funciones.

Un cambio debe superar las pruebas y la compilación antes de generar la nueva publicación. Para verificar la automatización, subir un commit y comprobar que Pages lo identifica por su SHA, finaliza correctamente y sirve la nueva versión sin una carga manual.

## Proyecto existente

`mentorinc-impulso` se creó con Direct Upload y conserva la demo en <https://mentorinc-impulso.pages.dev/>. Cloudflare no permite convertir un proyecto Direct Upload a integración Git nativa. La conexión nativa requiere un nuevo proyecto; no borrar el anterior para reutilizar su nombre.

Una alternativa para mantener exactamente esa URL sería GitHub Actions con Wrangler, que necesitaría un token de Cloudflare guardado como secreto de GitHub. No se ha creado ni solicitado ese token.

## Fuentes oficiales

- [Direct Upload y restricción de conversión](https://developers.cloudflare.com/pages/get-started/direct-upload/).
- [Integración GitHub](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/).
- [Configuración de compilación](https://developers.cloudflare.com/pages/configuration/build-configuration/).
- [Versiones de Node y omisión de instalación automática](https://developers.cloudflare.com/pages/configuration/build-image/).
