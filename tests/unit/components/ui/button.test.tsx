import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button组件测试', () => {
  describe('基本渲染', () => {
    it('应该渲染按钮文本', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('应该应用默认类名', () => {
      render(<Button>Default Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('应该有正确的data-slot属性', () => {
      render(<Button>Test Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-slot', 'button')
    })
  })

  describe('变体样式', () => {
    it('应该应用默认变体样式', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('应该应用destructive变体样式', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive', 'text-white')
    })

    it('应该应用outline变体样式', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'bg-background')
    })

    it('应该应用secondary变体样式', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('应该应用ghost变体样式', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('应该应用link变体样式', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })
  })

  describe('尺寸样式', () => {
    it('应该应用默认尺寸样式', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('应该应用小尺寸样式', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'px-3')
    })

    it('应该应用大尺寸样式', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-6')
    })

    it('应该应用图标尺寸样式', () => {
      render(<Button size="icon">🔍</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('size-9')
    })
  })

  describe('自定义类名', () => {
    it('应该合并自定义类名', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('inline-flex') // 保持默认类名
    })
  })

  describe('事件处理', () => {
    it('应该处理点击事件', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('应该在禁用时不触发点击事件', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick} disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('禁用状态', () => {
    it('应该正确设置禁用状态', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })
  })

  describe('asChild属性', () => {
    it('应该渲染为子元素当asChild为true时', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveClass('inline-flex', 'items-center')
    })

    it('应该渲染为button当asChild为false时', () => {
      render(<Button asChild={false}>Regular Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('可访问性', () => {
    it('应该支持aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>)
      const button = screen.getByRole('button', { name: 'Close dialog' })
      expect(button).toBeInTheDocument()
    })

    it('应该支持aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help-text">Submit</Button>
          <div id="help-text">This will submit the form</div>
        </>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('应该在无效状态下有正确的样式', () => {
      render(<Button aria-invalid="true">Invalid</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('aria-invalid:border-destructive')
    })
  })

  describe('组合变体', () => {
    it('应该正确组合变体和尺寸', () => {
      render(<Button variant="outline" size="lg">Large Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'bg-background') // outline variant
      expect(button).toHaveClass('h-10', 'px-6') // lg size
    })

    it('应该正确组合所有属性', () => {
      render(
        <Button 
          variant="destructive" 
          size="sm" 
          className="custom-class"
          disabled
        >
          Delete Item
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive') // variant
      expect(button).toHaveClass('h-8') // size
      expect(button).toHaveClass('custom-class') // custom class
      expect(button).toBeDisabled() // disabled
    })
  })
})
