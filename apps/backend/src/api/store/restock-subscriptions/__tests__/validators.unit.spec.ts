import { PostStoreCreateRestockSubscription } from '../validators';

describe('PostStoreCreateRestockSubscription', () => {
  it('accepts a full payload', () => {
    const result = PostStoreCreateRestockSubscription.safeParse({
      variant_id: 'variant_01',
      email: 'shopper@example.com',
      sales_channel_id: 'sc_01',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a payload with only variant_id', () => {
    const result = PostStoreCreateRestockSubscription.safeParse({
      variant_id: 'variant_01',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a payload missing variant_id', () => {
    const result = PostStoreCreateRestockSubscription.safeParse({
      email: 'shopper@example.com',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a variant_id of the wrong type', () => {
    const result = PostStoreCreateRestockSubscription.safeParse({
      variant_id: 12345,
    });

    expect(result.success).toBe(false);
  });
});
