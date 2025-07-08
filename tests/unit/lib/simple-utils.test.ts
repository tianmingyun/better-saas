import { describe, it, expect } from '@jest/globals'

// Simple utility functions for testing
function add(a: number, b: number): number {
  return a + b
}

function multiply(a: number, b: number): number {
  return a * b
}

function isEven(num: number): boolean {
  return num % 2 === 0
}

describe('简单工具函数测试', () => {
  describe('add函数', () => {
    it('应该正确相加两个正数', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('应该正确处理负数', () => {
      expect(add(-2, 3)).toBe(1)
      expect(add(-2, -3)).toBe(-5)
    })

    it('应该正确处理零', () => {
      expect(add(0, 5)).toBe(5)
      expect(add(5, 0)).toBe(5)
      expect(add(0, 0)).toBe(0)
    })
  })

  describe('multiply函数', () => {
    it('应该正确相乘两个正数', () => {
      expect(multiply(2, 3)).toBe(6)
    })

    it('应该正确处理负数', () => {
      expect(multiply(-2, 3)).toBe(-6)
      expect(multiply(-2, -3)).toBe(6)
    })

    it('应该正确处理零', () => {
      expect(multiply(0, 5)).toBe(0)
      expect(multiply(5, 0)).toBe(0)
    })
  })

  describe('isEven函数', () => {
    it('应该正确判断偶数', () => {
      expect(isEven(2)).toBe(true)
      expect(isEven(4)).toBe(true)
      expect(isEven(0)).toBe(true)
    })

    it('应该正确判断奇数', () => {
      expect(isEven(1)).toBe(false)
      expect(isEven(3)).toBe(false)
      expect(isEven(5)).toBe(false)
    })

    it('应该正确处理负数', () => {
      expect(isEven(-2)).toBe(true)
      expect(isEven(-1)).toBe(false)
    })
  })
})
