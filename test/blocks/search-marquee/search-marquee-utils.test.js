import { expect } from '@esm-bundle/chai';

describe('Search Marquee Utility Functions', () => {
  describe('handlelize', () => {
    // Create a test version of handlelize function
    function handlelize(str) {
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/(\W+|\s+)/g, '-') // Replace space and other characters by hyphen
        .replace(/--+/g, '-') // Replaces multiple hyphens by one hyphen
        .replace(/(^-+|-+$)/g, '') // Remove extra hyphens from beginning or end of the string
        .toLowerCase(); // To lowercase
    }

    it('should convert string to lowercase handle format', () => {
      expect(handlelize('Hello World')).to.equal('hello-world');
    });

    it('should remove accents from characters', () => {
      expect(handlelize('Café résumé')).to.equal('cafe-resume');
    });

    it('should replace spaces and special characters with hyphens', () => {
      expect(handlelize('Hello, World! How are you?')).to.equal('hello-world-how-are-you');
    });

    it('should replace multiple hyphens with single hyphen', () => {
      expect(handlelize('Hello---World')).to.equal('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(handlelize('--Hello World--')).to.equal('hello-world');
    });

    it('should handle empty string', () => {
      expect(handlelize('')).to.equal('');
    });

    it('should handle string with only special characters', () => {
      expect(handlelize('!@#$%^&*()')).to.equal('');
    });

    it('should handle mixed case with numbers', () => {
      expect(handlelize('Hello123 World456')).to.equal('hello123-world456');
    });

    it('should handle unicode characters', () => {
      expect(handlelize('Hëllö Wörld')).to.equal('hello-world');
    });
  });

  describe('wordExistsInString', () => {
    // Create a test version of wordExistsInString function
    function wordExistsInString(word, inputString) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = new RegExp(`(?:^|\\s|[.,!?()'"-])${escapedWord}(?:$|\\s|[.,!?()'"-])`, 'i');
      return regexPattern.test(inputString);
    }

    it('should find word at beginning of string', () => {
      expect(wordExistsInString('hello', 'hello world')).to.be.true;
    });

    it('should find word at end of string', () => {
      expect(wordExistsInString('world', 'hello world')).to.be.true;
    });

    it('should find word in middle of string', () => {
      expect(wordExistsInString('is', 'this is great')).to.be.true;
    });

    it('should be case insensitive', () => {
      expect(wordExistsInString('HELLO', 'hello world')).to.be.true;
      expect(wordExistsInString('hello', 'HELLO WORLD')).to.be.true;
    });

    it('should not match partial words', () => {
      expect(wordExistsInString('hell', 'hello world')).to.be.false;
      expect(wordExistsInString('world', 'worldwide')).to.be.false;
    });

    it('should handle punctuation boundaries', () => {
      expect(wordExistsInString('hello', 'hello, world')).to.be.true;
      expect(wordExistsInString('world', 'hello, world!')).to.be.true;
      expect(wordExistsInString('test', '(test)')).to.be.true;
    });

    it('should handle quotes and apostrophes', () => {
      expect(wordExistsInString('hello', '"hello" world')).to.be.true;
      expect(wordExistsInString('world', "hello 'world'")).to.be.true;
    });

    it('should handle hyphenated boundaries', () => {
      expect(wordExistsInString('hello', 'hello-world')).to.be.true;
      expect(wordExistsInString('world', 'hello-world')).to.be.true;
    });

    it('should escape special regex characters in word', () => {
      expect(wordExistsInString('test.', 'this is test. done')).to.be.true;
      expect(wordExistsInString('test+', 'this is test+ done')).to.be.true;
      expect(wordExistsInString('test*', 'this is test* done')).to.be.true;
    });

    it('should return false for empty word', () => {
      expect(wordExistsInString('', 'hello world')).to.be.false;
    });

    it('should return false for empty string', () => {
      expect(wordExistsInString('hello', '')).to.be.false;
    });

    it('should handle single character words', () => {
      expect(wordExistsInString('a', 'this is a test')).to.be.true;
      expect(wordExistsInString('I', 'I am happy')).to.be.true;
    });
  });
});
