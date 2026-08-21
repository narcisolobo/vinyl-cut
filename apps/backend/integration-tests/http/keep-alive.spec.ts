import { medusaIntegrationTestRunner } from '@medusajs/test-utils';

jest.setTimeout(60000);

medusaIntegrationTestRunner({
  testSuite: ({ api }) => {
    describe('GET /keep-alive', () => {
      it('returns 200 with a real database query', async () => {
        const response = await api.get('/keep-alive');

        expect(response.status).toEqual(200);
        expect(response.data).toEqual({ status: 'ok' });
      });
    });
  },
});
