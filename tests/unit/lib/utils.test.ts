import { describe, it, expect } from '@jest/globals'
import { cn } from '@/lib/utils'

describe('工具函数测试', () => {
  describe('cn函数', () => {
    it('应该合并类名', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('应该处理条件类名', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
    })

    it('应该处理对象形式的类名', () => {
      expect(cn({
        'class1': true,
        'class2': false,
        'class3': true
      })).toBe('class1 class3')
    })

    it('应该处理数组形式的类名', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })

    it('应该去重Tailwind类名', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('应该处理空值', () => {
      expect(cn('class1', null, undefined, '', 'class2')).toBe('class1 class2')
    })

    it('应该处理复杂的组合', () => {
      const isActive = true
      const isDisabled = false
      
      expect(cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class',
        {
          'conditional-class': true,
          'hidden-class': false
        }
      )).toBe('base-class active-class conditional-class')
    })
  })
})
