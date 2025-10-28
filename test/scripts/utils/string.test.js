import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { titleCase } from '../../../express/code/scripts/utils/string.js';

setLibs('/libs');

describe('String Utils', () => {
  describe('titleCase', () => {
    it('should convert single word to title case', () => {
      expect(titleCase('hello')).to.equal('Hello');
      expect(titleCase('world')).to.equal('World');
      expect(titleCase('javascript')).to.equal('Javascript');
    });

    it('should convert multiple words to title case', () => {
      expect(titleCase('hello world')).to.equal('Hello World');
      expect(titleCase('this is a test')).to.equal('This Is A Test');
      expect(titleCase('adobe express features')).to.equal('Adobe Express Features');
    });

    it('should handle already title cased strings', () => {
      expect(titleCase('Hello World')).to.equal('Hello World');
      expect(titleCase('This Is A Test')).to.equal('This Is A Test');
    });

    it('should handle mixed case strings', () => {
      expect(titleCase('hELLo WoRLd')).to.equal('Hello World');
      expect(titleCase('tHiS iS a TeSt')).to.equal('This Is A Test');
    });

    it('should handle strings with special characters', () => {
      expect(titleCase('hello-world')).to.equal('Hello-world');
      expect(titleCase('test_case')).to.equal('Test_case');
      expect(titleCase('hello@world.com')).to.equal('Hello@world.com');
    });

    it('should handle empty string', () => {
      expect(titleCase('')).to.equal('');
    });

    it('should handle null and undefined', () => {
      expect(titleCase(null)).to.equal('');
      expect(titleCase(undefined)).to.equal('');
    });

    it('should handle single character strings', () => {
      expect(titleCase('a')).to.equal('A');
      expect(titleCase('z')).to.equal('Z');
    });

    it('should handle strings with numbers', () => {
      expect(titleCase('hello 123')).to.equal('Hello 123');
      expect(titleCase('test 456 world')).to.equal('Test 456 World');
    });

    it('should handle strings with multiple spaces', () => {
      expect(titleCase('hello   world')).to.equal('Hello   World');
      expect(titleCase('  test  ')).to.equal('  Test  ');
    });

    it('should handle strings with leading/trailing spaces', () => {
      expect(titleCase(' hello world ')).to.equal(' Hello World ');
      expect(titleCase('  test  ')).to.equal('  Test  ');
    });

    it('should handle very long strings', () => {
      const longString = 'this is a very long string with many words that should all be converted to title case';
      const expected = 'This Is A Very Long String With Many Words That Should All Be Converted To Title Case';
      expect(titleCase(longString)).to.equal(expected);
    });

    it('should handle strings with punctuation', () => {
      expect(titleCase('hello, world!')).to.equal('Hello, World!');
      expect(titleCase('test? yes!')).to.equal('Test? Yes!');
      expect(titleCase('one. two. three.')).to.equal('One. Two. Three.');
    });
  });
});
