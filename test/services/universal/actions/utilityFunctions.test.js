import { expect } from '@esm-bundle/chai';
import {
  buildUniversalSearchFormData,
  parseUniversalSearchData,
} from '../../../../express/code/libs/services/plugins/universal/actions/UniversalSearchActions.js';
import {
  DEFAULT_BATCH_SIZE,
  FORM_FIELD_REQUEST,
  FORM_FIELD_IMAGE,
  SEARCH_SCOPE,
  SEARCH_ASSET_TYPE,
} from '../../../../express/code/libs/services/plugins/universal/constants.js';

// ── Helpers ──

function createMockFile(name = 'test.jpg', type = 'image/jpeg') {
  return new File(['fake-image-data'], name, { type });
}

// ── Mock Data ──

const mockSearchResponse = {
  result_sets: [
    {
      items: [
        { id: 'stock-001', title: 'Mountain Landscape' },
        { id: 'stock-002', title: 'Ocean Sunset' },
        { id: 'stock-003', title: 'City Skyline' },
      ],
      total_results: 42,
    },
  ],
};

// ═══════════════════════════════════════════════════════
//  buildUniversalSearchFormData
// ═══════════════════════════════════════════════════════

describe('buildUniversalSearchFormData', () => {
  it('should return a FormData instance', () => {
    const imageFile = createMockFile();
    const formData = buildUniversalSearchFormData(imageFile);
    expect(formData).to.be.instanceOf(FormData);
  });

  it('should include the request field with correct JSON structure', () => {
    const imageFile = createMockFile();
    const formData = buildUniversalSearchFormData(imageFile, 1, 20);
    const requestJson = JSON.parse(formData.get(FORM_FIELD_REQUEST));

    expect(requestJson.scope).to.deep.equal(SEARCH_SCOPE);
    expect(requestJson.limit).to.equal(20);
    expect(requestJson.start_index).to.equal(0);
    expect(requestJson.asset_type).to.deep.equal(SEARCH_ASSET_TYPE);
  });

  it('should include the image file in the form data', () => {
    const imageFile = createMockFile('photo.png', 'image/png');
    const formData = buildUniversalSearchFormData(imageFile);
    expect(formData.get(FORM_FIELD_IMAGE)).to.be.instanceOf(File);
  });

  it('should calculate start_index from pageNumber and batchSize', () => {
    const imageFile = createMockFile();
    const formData = buildUniversalSearchFormData(imageFile, 3, 10);
    const requestJson = JSON.parse(formData.get(FORM_FIELD_REQUEST));

    // (3 - 1) * 10 = 20
    expect(requestJson.start_index).to.equal(20);
    expect(requestJson.limit).to.equal(10);
  });

  it('should use defaults when pageNumber and batchSize are omitted', () => {
    const imageFile = createMockFile();
    const formData = buildUniversalSearchFormData(imageFile);
    const requestJson = JSON.parse(formData.get(FORM_FIELD_REQUEST));

    expect(requestJson.limit).to.equal(DEFAULT_BATCH_SIZE);
    expect(requestJson.start_index).to.equal(0);
  });

  it('should handle page 1 with start_index 0', () => {
    const imageFile = createMockFile();
    const formData = buildUniversalSearchFormData(imageFile, 1, 50);
    const requestJson = JSON.parse(formData.get(FORM_FIELD_REQUEST));

    expect(requestJson.start_index).to.equal(0);
    expect(requestJson.limit).to.equal(50);
  });

  it('should always include scope and asset_type arrays', () => {
    const imageFile = createMockFile();
    const formData = buildUniversalSearchFormData(imageFile, 2, 5);
    const requestJson = JSON.parse(formData.get(FORM_FIELD_REQUEST));

    expect(requestJson.scope).to.be.an('array').that.includes('stock');
    expect(requestJson.asset_type).to.be.an('array').that.includes('images');
  });
});

// ═══════════════════════════════════════════════════════
//  parseUniversalSearchData
// ═══════════════════════════════════════════════════════

describe('parseUniversalSearchData', () => {
  it('should extract themes from result_sets[0].items', () => {
    const parsed = parseUniversalSearchData(mockSearchResponse);

    expect(parsed.themes).to.have.lengthOf(3);
    expect(parsed.themes[0].id).to.equal('stock-001');
    expect(parsed.total_results).to.equal(42);
  });

  it('should return empty themes array when result_sets is missing', () => {
    const parsed = parseUniversalSearchData({});
    expect(parsed.themes).to.deep.equal([]);
  });

  it('should return empty themes when result_sets[0].items is missing', () => {
    const parsed = parseUniversalSearchData({ result_sets: [{}] });
    expect(parsed.themes).to.deep.equal([]);
  });

  it('should default total_results to 0 when missing', () => {
    const parsed = parseUniversalSearchData({
      result_sets: [{ items: [{ id: '1' }] }],
    });
    expect(parsed.total_results).to.equal(0);
  });

  it('should preserve other raw fields from the response', () => {
    const data = { ...mockSearchResponse, extra_field: 'preserved', request_id: 'abc-123' };
    const parsed = parseUniversalSearchData(data);

    expect(parsed.extra_field).to.equal('preserved');
    expect(parsed.request_id).to.equal('abc-123');
  });

  it('should handle null result_sets gracefully', () => {
    const parsed = parseUniversalSearchData({ result_sets: null });
    expect(parsed.themes).to.deep.equal([]);
  });

  it('should handle empty result_sets array', () => {
    const parsed = parseUniversalSearchData({ result_sets: [] });
    expect(parsed.themes).to.deep.equal([]);
  });

  it('should handle result_sets with total_results but no items', () => {
    const parsed = parseUniversalSearchData({
      result_sets: [{ total_results: 10 }],
    });
    expect(parsed.themes).to.deep.equal([]);
  });

  it('should not mutate the original data object', () => {
    const data = { result_sets: [{ items: [{ id: '1' }], total_results: 1 }] };
    const original = JSON.parse(JSON.stringify(data));
    parseUniversalSearchData(data);

    expect(data.result_sets).to.deep.equal(original.result_sets);
  });
});
