/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  hsvToWheelXY,
  computeConfusionLinePoints,
  drawConfusionLinesCurve,
  drawConflictLinesOnCanvas,
} from '../../../../express/code/scripts/color-shared/utils/confusionLineUtils.js';

describe('confusionLineUtils', () => {
  describe('hsvToWheelXY', () => {
    const RADIUS = 100;

    it('returns center of canvas for zero saturation', () => {
      const [x, y] = hsvToWheelXY(0, 0, RADIUS);
      expect(x).to.be.closeTo(RADIUS, 1);
      expect(y).to.be.closeTo(RADIUS, 1);
    });

    it('returns coordinates within canvas bounds', () => {
      for (let h = 0; h < 360; h += 30) {
        const [x, y] = hsvToWheelXY(h, 100, RADIUS);
        expect(x).to.be.within(-1, RADIUS * 2 + 1);
        expect(y).to.be.within(-1, RADIUS * 2 + 1);
      }
    });

    it('moves further from center as saturation increases', () => {
      const [x1, y1] = hsvToWheelXY(120, 20, RADIUS);
      const [x2, y2] = hsvToWheelXY(120, 80, RADIUS);
      const dist1 = Math.sqrt((x1 - RADIUS) ** 2 + (y1 - RADIUS) ** 2);
      const dist2 = Math.sqrt((x2 - RADIUS) ** 2 + (y2 - RADIUS) ** 2);
      expect(dist2).to.be.greaterThan(dist1);
    });
  });

  describe('computeConfusionLinePoints', () => {
    it('returns points for all three defect types', () => {
      const result = computeConfusionLinePoints([0, 100], 100);
      expect(result).to.have.property('protan');
      expect(result).to.have.property('deutan');
      expect(result).to.have.property('tritan');
    });

    it('returns arrays of [h, s, v] triples', () => {
      const result = computeConfusionLinePoints([120, 80], 100);
      for (const type of Object.keys(result)) {
        for (const point of result[type]) {
          expect(point).to.have.lengthOf(3);
        }
      }
    });
  });

  describe('drawConfusionLinesCurve', () => {
    it('calls canvas context methods for valid points', () => {
      const ctx = {
        strokeStyle: '',
        lineWidth: 0,
        beginPath: sinon.stub(),
        moveTo: sinon.stub(),
        quadraticCurveTo: sinon.stub(),
        stroke: sinon.stub(),
      };
      const points = [
        [10, 10],
        [12, 12],
        [14, 14],
        [16, 16],
      ];

      drawConfusionLinesCurve(ctx, points, { lineWidth: 4, wheelRadius: 100 });

      expect(ctx.beginPath.called).to.be.true;
      expect(ctx.moveTo.called).to.be.true;
      expect(ctx.stroke.called).to.be.true;
      expect(ctx.strokeStyle).to.equal('rgba(255, 255, 255, 0.7)');
      expect(ctx.lineWidth).to.equal(4);
    });

    it('starts new path segment when gap is large', () => {
      const ctx = {
        strokeStyle: '',
        lineWidth: 0,
        beginPath: sinon.stub(),
        moveTo: sinon.stub(),
        quadraticCurveTo: sinon.stub(),
        stroke: sinon.stub(),
      };
      // Points with a large gap between index 1 and 2
      const points = [
        [10, 10],
        [12, 12],
        [180, 180], // far away → should trigger new path
        [182, 182],
      ];

      drawConfusionLinesCurve(ctx, points, { lineWidth: 4, wheelRadius: 100 });

      // moveTo called at least twice: once at start, once after gap
      expect(ctx.moveTo.callCount).to.be.at.least(2);
    });

    it('does nothing for empty points', () => {
      const ctx = {
        beginPath: sinon.stub(),
        moveTo: sinon.stub(),
        stroke: sinon.stub(),
      };
      drawConfusionLinesCurve(ctx, [], { lineWidth: 4, wheelRadius: 100 });
      expect(ctx.beginPath.called).to.be.false;
    });
  });

  describe('drawConflictLinesOnCanvas', () => {
    it('draws lines between conflicting pairs', () => {
      const ctx = {
        strokeStyle: '',
        lineWidth: 0,
        beginPath: sinon.stub(),
        moveTo: sinon.stub(),
        lineTo: sinon.stub(),
        stroke: sinon.stub(),
      };
      const swatches = [
        { hex: '#FF0000', hsv: { h: 0, s: 100, v: 100 } },
        { hex: '#00FF00', hsv: { h: 120, s: 100, v: 100 } },
        { hex: '#0000FF', hsv: { h: 240, s: 100, v: 100 } },
      ];
      const pairs = [[0, 1], [1, 2]];

      drawConflictLinesOnCanvas(ctx, swatches, pairs, 100);

      expect(ctx.beginPath.callCount).to.equal(2);
      expect(ctx.moveTo.callCount).to.equal(2);
      expect(ctx.lineTo.callCount).to.equal(2);
      expect(ctx.stroke.callCount).to.equal(2);
      expect(ctx.strokeStyle).to.equal('#fff');
      expect(ctx.lineWidth).to.equal(5);
    });

    it('does nothing for empty pairs', () => {
      const ctx = { beginPath: sinon.stub() };
      drawConflictLinesOnCanvas(ctx, [{ hsv: { h: 0, s: 0 } }], [], 100);
      expect(ctx.beginPath.called).to.be.false;
    });

    it('skips pairs referencing swatches without hsv', () => {
      const ctx = {
        strokeStyle: '',
        lineWidth: 0,
        beginPath: sinon.stub(),
        moveTo: sinon.stub(),
        lineTo: sinon.stub(),
        stroke: sinon.stub(),
      };
      const swatches = [
        { hex: '#FF0000' }, // no hsv
        { hex: '#00FF00', hsv: { h: 120, s: 100, v: 100 } },
      ];

      drawConflictLinesOnCanvas(ctx, swatches, [[0, 1]], 100);
      expect(ctx.lineTo.called).to.be.false;
    });
  });
});
