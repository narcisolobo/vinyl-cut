import { describe, expect, it } from "vitest";
import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "./product-option-filters";

describe("parseOptionValueIds", () => {
  describe("URLSearchParams input", () => {
    it("returns an empty array when the key is absent", () => {
      expect(parseOptionValueIds(new URLSearchParams())).toEqual([]);
    });

    it("collects all values for the key", () => {
      const params = new URLSearchParams();
      params.append(OPTION_VALUE_QUERY_KEY, "a");
      params.append(OPTION_VALUE_QUERY_KEY, "b");

      expect(parseOptionValueIds(params)).toEqual(["a", "b"]);
    });

    it("deduplicates repeated values", () => {
      const params = new URLSearchParams();
      params.append(OPTION_VALUE_QUERY_KEY, "a");
      params.append(OPTION_VALUE_QUERY_KEY, "a");

      expect(parseOptionValueIds(params)).toEqual(["a"]);
    });

    it("drops empty-string values", () => {
      const params = new URLSearchParams();
      params.append(OPTION_VALUE_QUERY_KEY, "a");
      params.append(OPTION_VALUE_QUERY_KEY, "");

      expect(parseOptionValueIds(params)).toEqual(["a"]);
    });
  });

  describe("plain object input", () => {
    it("returns an empty array when the key is absent", () => {
      expect(parseOptionValueIds({})).toEqual([]);
    });

    it("deduplicates an array value", () => {
      expect(
        parseOptionValueIds({ [OPTION_VALUE_QUERY_KEY]: ["a", "b", "a"] }),
      ).toEqual(["a", "b"]);
    });

    it("splits and deduplicates a comma-separated string value", () => {
      expect(
        parseOptionValueIds({ [OPTION_VALUE_QUERY_KEY]: "a,b,a" }),
      ).toEqual(["a", "b"]);
    });

    it("returns an empty array for an empty string value", () => {
      expect(parseOptionValueIds({ [OPTION_VALUE_QUERY_KEY]: "" })).toEqual(
        [],
      );
    });

    it("returns an empty array when the value is undefined", () => {
      expect(
        parseOptionValueIds({ [OPTION_VALUE_QUERY_KEY]: undefined }),
      ).toEqual([]);
    });
  });
});
