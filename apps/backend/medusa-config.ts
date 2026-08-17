import { loadEnv, defineConfig } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    // @medusajs/medusa's admin loader auto-registers src/admin as a
    // "local plugin" source and generates its virtual-module import
    // specifiers root-relative to the *workspace* root (correctly
    // /app in this container -- two levels up from apps/backend).
    // But @medusajs/admin-bundler actually configures Vite's `root`
    // as .medusa/client, a different, deeper directory -- so the
    // generated specifier (e.g. "/apps/backend/src/admin/i18n/index.ts")
    // is wrong from Vite's perspective and fails to resolve ("Failed
    // to resolve import ... Does the file exist?"). This looks like
    // an upstream bug (confirmed: process.cwd(), the Docker bind
    // mount, and the workspace-root math are all correct), not a
    // config mistake here. Working around it by aliasing the broken
    // prefix back to the real absolute path.
    vite: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: [
          ...(Array.isArray(config.resolve?.alias)
            ? config.resolve!.alias
            : []),
          { find: /^\/apps\/backend\//, replacement: '/app/apps/backend/' },
        ],
      },
    }),
  },
  modules: [
    {
      resolve: './src/modules/restock',
    },
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: './src/modules/resend',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL,
            },
          },
          {
            resolve: '@medusajs/medusa/notification-local',
            id: 'local',
            options: { channels: ['feed'] },
          },
        ],
      },
    },
    {
      resolve: '@medusajs/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/file-s3',
            id: 's3',
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              // Required: Supabase's S3 gateway (like MinIO) doesn't
              // support virtual-hosted-style URLs.
              additional_client_config: { forcePathStyle: true },
              // Supabase's S3 gateway doesn't support per-object ACLs;
              // the bucket's own public-read setting handles that instead.
              acl: false,
            },
          },
        ],
      },
    },
  ],
});
