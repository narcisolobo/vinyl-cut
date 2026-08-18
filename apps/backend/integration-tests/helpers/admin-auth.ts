import {
  IApiKeyModuleService,
  IAuthModuleService,
  IUserModuleService,
  MedusaContainer,
} from '@medusajs/framework/types';
import {
  ApiKeyType,
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
  PUBLISHABLE_KEY_HEADER,
} from '@medusajs/framework/utils';

type AdminHeaders = { headers: { authorization: string } };
type StoreHeaders = { headers: { [key: string]: string } };

/**
 * Trimmed down from Medusa's own integration-test helper
 * (medusajs/medusa integration-tests/helpers/create-admin-user.ts): no
 * RBAC (not enabled in this project) and no real password hash — the JWT
 * is minted directly here, never exercised through `/auth/login`, so the
 * password value is never actually verified.
 */
async function createAdminUser(
  container: MedusaContainer,
  email = 'admin@test.com',
): Promise<AdminHeaders> {
  const userModule = container.resolve<IUserModuleService>(Modules.USER);
  const authModule = container.resolve<IAuthModuleService>(Modules.AUTH);

  const user = await userModule.createUsers({
    first_name: 'Test',
    last_name: 'Admin',
    email,
  });

  const authIdentity = await authModule.createAuthIdentities({
    provider_identities: [
      {
        provider: 'emailpass',
        entity_id: email,
        provider_metadata: { password: 'unused-in-tests' },
      },
    ],
    app_metadata: { user_id: user.id },
  });

  const { projectConfig } = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE,
  );
  const { jwtSecret, jwtOptions } = projectConfig.http;

  const token = generateJwtToken(
    {
      actor_id: user.id,
      actor_type: 'user',
      auth_identity_id: authIdentity.id,
      auth_provider: 'emailpass',
      app_metadata: { user: user.id },
    },
    { secret: jwtSecret, expiresIn: '1d', jwtOptions },
  );

  return { headers: { authorization: `Bearer ${token}` } };
}

async function generateStoreHeaders(
  container: MedusaContainer,
): Promise<StoreHeaders> {
  const apiKeyModule = container.resolve<IApiKeyModuleService>(
    Modules.API_KEY,
  );

  const apiKey = await apiKeyModule.createApiKeys({
    title: 'test publishable key',
    type: ApiKeyType.PUBLISHABLE,
    created_by: 'test',
  });

  return { headers: { [PUBLISHABLE_KEY_HEADER]: apiKey.token } };
}

export { createAdminUser, generateStoreHeaders };
export type { AdminHeaders, StoreHeaders };
