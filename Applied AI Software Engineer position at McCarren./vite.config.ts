import { defineConfig } from "vite";
import { getHttpsServerOptions } from "office-addin-dev-certs";

/**
 * Vite config for Office Add-in taskpane.
 *
 * - Must use HTTPS for sideloading in Word (web/desktop)
 * - Uses office-addin-dev-certs to generate/trust a dev certificate
 */
export default defineConfig(async () => {
  const https = await getHttpsServerOptions();

  return {
    server: {
      port: 3000,
      strictPort: true,
      https,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
    build: {
      target: "es2019",
    },
  };
});
