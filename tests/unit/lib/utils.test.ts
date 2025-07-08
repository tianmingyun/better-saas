import { describe, it, expect } from '@jest/globals';
import { cn } from '@/lib/utils';

describe('Utility Functions Tests', () => {
  describe('cn function', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional class names', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });

    it('should handle object-form class names', () => {
      expect(
        cn({
          class1: true,
          class2: false,
          class3: true,
        })
      ).toBe('class1 class3');
    });

    it('should handle array-form class names', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should deduplicate Tailwind class names', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle null values', () => {
      expect(cn('class1', null, undefined, '', 'class2')).toBe('class1 class2');
    });

    it('should handle complex combinations', () => {
      const isActive = true;
      const isDisabled = false;

      expect(
        cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class', {
          'conditional-class': true,
          'hidden-class': false,
        })
      ).toBe('base-class active-class conditional-class');
    });
  });
});
