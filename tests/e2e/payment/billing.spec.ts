import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS } from '../utils/test-helpers';

test.describe('账单和支付功能测试', () => {
  test.beforeEach(async ({ page, authHelper }) => {
    // 清除状态并登录
    await page.context().clearCookies();
    // 先导航到一个页面，然后清除存储
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 登录用户
    await authHelper.loginAsUser();
    
    // 导航到账单页面
    await page.goto('/settings/billing');
  });

  test.describe('账单页面', () => {
    test('应该显示账单管理界面', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 等待页面加载完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证账单页面主要元素
      await assertionHelper.assertElementVisible('[data-testid="billing-content"]');
      await assertionHelper.assertElementVisible('[data-testid="subscription-section"]');
      await assertionHelper.assertElementVisible('[data-testid="payment-methods-section"]');
      await assertionHelper.assertElementVisible('[data-testid="billing-history-section"]');
    });

    test('应该显示当前订阅状态', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证订阅状态卡片
      await assertionHelper.assertElementVisible('[data-testid="subscription-card"]');
      await assertionHelper.assertElementVisible('[data-testid="subscription-status"]');
      await assertionHelper.assertElementVisible('[data-testid="subscription-plan"]');
      await assertionHelper.assertElementVisible('[data-testid="subscription-price"]');
      await assertionHelper.assertElementVisible('[data-testid="next-billing-date"]');
    });

    test('应该显示可用的订阅计划', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证计划选择区域
      await assertionHelper.assertElementVisible('[data-testid="plans-section"]');
      await assertionHelper.assertElementVisible('[data-testid="plan-card"]');
      
      // 验证计划信息
      const planCards = page.locator('[data-testid="plan-card"]');
      const count = await planCards.count();
      
      for (let i = 0; i < count; i++) {
        const planCard = planCards.nth(i);
        await expect(planCard.locator('[data-testid="plan-name"]')).toBeVisible();
        await expect(planCard.locator('[data-testid="plan-price"]')).toBeVisible();
        await expect(planCard.locator('[data-testid="plan-features"]')).toBeVisible();
        await expect(planCard.locator('[data-testid="plan-button"]')).toBeVisible();
      }
    });
  });

  test.describe('订阅管理', () => {
    test('应该能够订阅新计划', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 选择一个计划
      const planCard = page.locator('[data-testid="plan-card"]').first();
      await planCard.locator('[data-testid="subscribe-button"]').click();
      
      // 验证重定向到Stripe Checkout
      await page.waitForURL('**/checkout.stripe.com/**', { timeout: 10000 });
      
      // 验证Stripe页面加载
      await assertionHelper.assertElementVisible('form[data-testid="payment-form"], .SubmitButton');
    });

    test('应该能够升级订阅计划', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟用户已有基础计划
      await page.evaluate(() => {
        window.localStorage.setItem('current-plan', 'basic');
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 选择高级计划
      const premiumPlan = page.locator('[data-testid="plan-card"]:has-text("Premium")');
      await premiumPlan.locator('[data-testid="upgrade-button"]').click();
      
      // 验证升级确认对话框
      await assertionHelper.assertElementVisible('[data-testid="upgrade-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="upgrade-summary"]');
      await assertionHelper.assertElementVisible('[data-testid="price-difference"]');
      
      // 确认升级
      await page.click('[data-testid="confirm-upgrade"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('订阅已升级');
    });

    test('应该能够降级订阅计划', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟用户已有高级计划
      await page.evaluate(() => {
        window.localStorage.setItem('current-plan', 'premium');
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 选择基础计划
      const basicPlan = page.locator('[data-testid="plan-card"]:has-text("Basic")');
      await basicPlan.locator('[data-testid="downgrade-button"]').click();
      
      // 验证降级警告对话框
      await assertionHelper.assertElementVisible('[data-testid="downgrade-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="downgrade-warning"]');
      await assertionHelper.assertTextContent('[data-testid="downgrade-warning"]', '降级将在下个计费周期生效');
      
      // 确认降级
      await page.click('[data-testid="confirm-downgrade"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('订阅将在下个计费周期降级');
    });

    test('应该能够取消订阅', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击取消订阅按钮
      await page.click('[data-testid="cancel-subscription-button"]');
      
      // 验证取消订阅对话框
      await assertionHelper.assertElementVisible('[data-testid="cancel-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="cancel-reasons"]');
      await assertionHelper.assertElementVisible('[data-testid="cancel-feedback"]');
      
      // 选择取消原因
      await page.click('[data-testid="reason-too-expensive"]');
      
      // 填写反馈
      await page.fill('[data-testid="cancel-feedback"]', '价格太高了');
      
      // 确认取消
      await page.click('[data-testid="confirm-cancel"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('订阅已取消，将在当前计费周期结束时生效');
      
      // 验证订阅状态更新
      await assertionHelper.assertTextContent('[data-testid="subscription-status"]', '已取消');
    });

    test('应该能够重新激活已取消的订阅', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟已取消的订阅
      await page.evaluate(() => {
        window.localStorage.setItem('subscription-status', 'canceled');
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 验证重新激活按钮显示
      await assertionHelper.assertElementVisible('[data-testid="reactivate-button"]');
      
      // 点击重新激活
      await page.click('[data-testid="reactivate-button"]');
      
      // 验证确认对话框
      await assertionHelper.assertElementVisible('[data-testid="reactivate-dialog"]');
      
      // 确认重新激活
      await page.click('[data-testid="confirm-reactivate"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('订阅已重新激活');
      
      // 验证状态更新
      await assertionHelper.assertTextContent('[data-testid="subscription-status"]', '活跃');
    });
  });

  test.describe('支付方式管理', () => {
    test('应该显示当前支付方式', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证支付方式区域
      await assertionHelper.assertElementVisible('[data-testid="payment-methods"]');
      
      // 如果有支付方式，验证显示
      const paymentMethods = page.locator('[data-testid="payment-method-card"]');
      const count = await paymentMethods.count();
      
      if (count > 0) {
        const firstMethod = paymentMethods.first();
        await expect(firstMethod.locator('[data-testid="card-brand"]')).toBeVisible();
        await expect(firstMethod.locator('[data-testid="card-last4"]')).toBeVisible();
        await expect(firstMethod.locator('[data-testid="card-expiry"]')).toBeVisible();
        await expect(firstMethod.locator('[data-testid="default-badge"]')).toBeVisible();
      }
    });

    test('应该能够添加新的支付方式', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击添加支付方式按钮
      await page.click('[data-testid="add-payment-method"]');
      
      // 验证Stripe Elements表单显示
      await assertionHelper.assertElementVisible('[data-testid="payment-form"]');
      await assertionHelper.assertElementVisible('[data-testid="card-element"]');
      await assertionHelper.assertElementVisible('[data-testid="billing-address"]');
      
      // 验证表单字段
      await assertionHelper.assertElementVisible('[data-testid="cardholder-name"]');
      await assertionHelper.assertElementVisible('[data-testid="address-line1"]');
      await assertionHelper.assertElementVisible('[data-testid="city"]');
      await assertionHelper.assertElementVisible('[data-testid="postal-code"]');
      await assertionHelper.assertElementVisible('[data-testid="country"]');
    });

    test('应该能够删除支付方式', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已有支付方式
      const paymentMethod = page.locator('[data-testid="payment-method-card"]').first();
      
      if (await paymentMethod.count() > 0) {
        // 点击删除按钮
        await paymentMethod.locator('[data-testid="delete-payment-method"]').click();
        
        // 验证确认对话框
        await assertionHelper.assertElementVisible('[data-testid="confirm-dialog"]');
        await assertionHelper.assertTextContent('[data-testid="confirm-dialog-title"]', '删除支付方式');
        
        // 确认删除
        await page.click('[data-testid="confirm-button"]');
        
        // 验证成功消息
        await formHelper.waitForSuccessMessage('支付方式已删除');
      }
    });

    test('应该能够设置默认支付方式', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设有多个支付方式
      const paymentMethods = page.locator('[data-testid="payment-method-card"]');
      const count = await paymentMethods.count();
      
      if (count > 1) {
        // 选择非默认的支付方式
        const nonDefaultMethod = paymentMethods.filter({
          hasNot: page.locator('[data-testid="default-badge"]')
        }).first();
        
        // 点击设为默认
        await nonDefaultMethod.locator('[data-testid="set-default"]').click();
        
        // 验证成功消息
        await formHelper.waitForSuccessMessage('默认支付方式已更新');
        
        // 验证默认标识更新
        await expect(nonDefaultMethod.locator('[data-testid="default-badge"]')).toBeVisible();
      }
    });

    test('应该验证支付方式表单', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击添加支付方式
      await page.click('[data-testid="add-payment-method"]');
      
      // 尝试提交空表单
      await page.click('[data-testid="save-payment-method"]');
      
      // 验证验证错误
      await assertionHelper.assertElementVisible('[data-testid="cardholder-name-error"]');
      await assertionHelper.assertElementVisible('[data-testid="card-error"]');
      await assertionHelper.assertElementVisible('[data-testid="address-error"]');
    });
  });

  test.describe('账单历史', () => {
    test('应该显示账单历史列表', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证账单历史区域
      await assertionHelper.assertElementVisible('[data-testid="billing-history"]');
      await assertionHelper.assertElementVisible('[data-testid="invoices-table"]');
      
      // 验证表格标题
      await assertionHelper.assertElementVisible('[data-testid="invoice-date-header"]');
      await assertionHelper.assertElementVisible('[data-testid="invoice-amount-header"]');
      await assertionHelper.assertElementVisible('[data-testid="invoice-status-header"]');
      await assertionHelper.assertElementVisible('[data-testid="invoice-actions-header"]');
    });

    test('应该能够查看账单详情', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设有账单记录
      const invoiceRow = page.locator('[data-testid="invoice-row"]').first();
      
      if (await invoiceRow.count() > 0) {
        // 点击查看详情
        await invoiceRow.locator('[data-testid="view-invoice"]').click();
        
        // 验证账单详情模态框
        await assertionHelper.assertElementVisible('[data-testid="invoice-details-modal"]');
        await assertionHelper.assertElementVisible('[data-testid="invoice-number"]');
        await assertionHelper.assertElementVisible('[data-testid="invoice-date"]');
        await assertionHelper.assertElementVisible('[data-testid="invoice-amount"]');
        await assertionHelper.assertElementVisible('[data-testid="invoice-items"]');
        await assertionHelper.assertElementVisible('[data-testid="billing-address"]');
      }
    });

    test('应该能够下载账单PDF', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设有账单记录
      const invoiceRow = page.locator('[data-testid="invoice-row"]').first();
      
      if (await invoiceRow.count() > 0) {
        // 点击下载PDF
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          invoiceRow.locator('[data-testid="download-pdf"]').click()
        ]);
        
        // 验证下载文件
        expect(download.suggestedFilename()).toContain('invoice');
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    });

    test('应该能够筛选账单历史', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证筛选选项
      await assertionHelper.assertElementVisible('[data-testid="date-range-filter"]');
      await assertionHelper.assertElementVisible('[data-testid="status-filter"]');
      
      // 设置日期范围
      await page.click('[data-testid="date-range-filter"]');
      await page.click('[data-testid="last-3-months"]');
      
      // 设置状态筛选
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-paid"]');
      
      // 等待筛选结果
      await waitHelper.waitForApiResponse('**/api/billing/invoices**');
      
      // 验证筛选结果
      const invoiceRows = page.locator('[data-testid="invoice-row"]');
      const count = await invoiceRows.count();
      
      if (count > 0) {
        // 验证所有显示的账单都是已支付状态
        for (let i = 0; i < count; i++) {
          const row = invoiceRows.nth(i);
          await expect(row.locator('[data-testid="invoice-status"]')).toContainText('已支付');
        }
      }
    });

    test('应该能够导出账单历史', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击导出按钮
      await page.click('[data-testid="export-invoices"]');
      
      // 验证导出选项
      await assertionHelper.assertElementVisible('[data-testid="export-options"]');
      await assertionHelper.assertElementVisible('[data-testid="export-csv"]');
      await assertionHelper.assertElementVisible('[data-testid="export-excel"]');
      
      // 选择CSV导出
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-csv"]')
      ]);
      
      // 验证下载文件
      expect(download.suggestedFilename()).toContain('invoices');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('使用量和配额', () => {
    test('应该显示当前使用量', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证使用量区域
      await assertionHelper.assertElementVisible('[data-testid="usage-section"]');
      await assertionHelper.assertElementVisible('[data-testid="usage-chart"]');
      
      // 验证使用量指标
      await assertionHelper.assertElementVisible('[data-testid="storage-usage"]');
      await assertionHelper.assertElementVisible('[data-testid="bandwidth-usage"]');
      await assertionHelper.assertElementVisible('[data-testid="api-requests-usage"]');
      
      // 验证使用量百分比
      const storageUsage = await page.textContent('[data-testid="storage-usage-percent"]');
      expect(storageUsage).toMatch(/\d+%/);
    });

    test('应该显示配额限制', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证配额显示
      await assertionHelper.assertElementVisible('[data-testid="quota-limits"]');
      await assertionHelper.assertElementVisible('[data-testid="storage-limit"]');
      await assertionHelper.assertElementVisible('[data-testid="bandwidth-limit"]');
      await assertionHelper.assertElementVisible('[data-testid="api-limit"]');
      
      // 验证配额格式
      const storageLimit = await page.textContent('[data-testid="storage-limit"]');
      expect(storageLimit).toMatch(/\d+\s*(GB|TB)/);
    });

    test('应该在接近配额限制时显示警告', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟高使用量
      await page.evaluate(() => {
        window.localStorage.setItem('storage-usage-percent', '85');
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 验证警告显示
      await assertionHelper.assertElementVisible('[data-testid="usage-warning"]');
      await assertionHelper.assertTextContent('[data-testid="usage-warning"]', '存储使用量接近限制');
    });

    test('应该能够查看详细使用量报告', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击查看详细报告
      await page.click('[data-testid="view-detailed-usage"]');
      
      // 验证详细报告页面
      await assertionHelper.assertElementVisible('[data-testid="usage-report"]');
      await assertionHelper.assertElementVisible('[data-testid="usage-timeline"]');
      await assertionHelper.assertElementVisible('[data-testid="usage-breakdown"]');
      
      // 验证时间范围选择器
      await assertionHelper.assertElementVisible('[data-testid="time-range-selector"]');
    });
  });

  test.describe('税务信息', () => {
    test('应该能够设置税务信息', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击税务信息设置
      await page.click('[data-testid="tax-settings"]');
      
      // 验证税务信息表单
      await assertionHelper.assertElementVisible('[data-testid="tax-form"]');
      await assertionHelper.assertElementVisible('[data-testid="tax-id-input"]');
      await assertionHelper.assertElementVisible('[data-testid="tax-type-select"]');
      await assertionHelper.assertElementVisible('[data-testid="business-name-input"]');
      await assertionHelper.assertElementVisible('[data-testid="business-address"]');
      
      // 填写税务信息
      await page.fill('[data-testid="tax-id-input"]', '123456789');
      await page.selectOption('[data-testid="tax-type-select"]', 'vat');
      await page.fill('[data-testid="business-name-input"]', 'Test Company');
      
      // 保存税务信息
      await page.click('[data-testid="save-tax-info"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('税务信息已保存');
    });

    test('应该在账单上显示税务信息', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已设置税务信息并有账单
      const invoiceRow = page.locator('[data-testid="invoice-row"]').first();
      
      if (await invoiceRow.count() > 0) {
        // 查看账单详情
        await invoiceRow.locator('[data-testid="view-invoice"]').click();
        
        // 验证税务信息显示
        await assertionHelper.assertElementVisible('[data-testid="tax-information"]');
        await assertionHelper.assertElementVisible('[data-testid="tax-amount"]');
        await assertionHelper.assertElementVisible('[data-testid="tax-rate"]');
      }
    });
  });

  test.describe('优惠券和折扣', () => {
    test('应该能够应用优惠券', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击应用优惠券
      await page.click('[data-testid="apply-coupon"]');
      
      // 验证优惠券输入框
      await assertionHelper.assertElementVisible('[data-testid="coupon-input"]');
      
      // 输入优惠券代码
      await page.fill('[data-testid="coupon-input"]', 'TESTCOUPON');
      
      // 应用优惠券
      await page.click('[data-testid="apply-coupon-button"]');
      
      // 验证优惠券应用成功
      await formHelper.waitForSuccessMessage('优惠券应用成功');
      
      // 验证折扣显示
      await assertionHelper.assertElementVisible('[data-testid="applied-coupon"]');
      await assertionHelper.assertElementVisible('[data-testid="discount-amount"]');
    });

    test('应该能够移除优惠券', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已应用优惠券
      await page.evaluate(() => {
        window.localStorage.setItem('applied-coupon', 'TESTCOUPON');
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 点击移除优惠券
      await page.click('[data-testid="remove-coupon"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('优惠券已移除');
      
      // 验证优惠券信息消失
      await assertionHelper.assertElementHidden('[data-testid="applied-coupon"]');
    });

    test('应该处理无效优惠券', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击应用优惠券
      await page.click('[data-testid="apply-coupon"]');
      
      // 输入无效优惠券代码
      await page.fill('[data-testid="coupon-input"]', 'INVALIDCOUPON');
      
      // 尝试应用
      await page.click('[data-testid="apply-coupon-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('优惠券无效或已过期');
    });
  });

  test.describe('账单通知', () => {
    test('应该能够设置账单通知偏好', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击通知设置
      await page.click('[data-testid="notification-settings"]');
      
      // 验证通知选项
      await assertionHelper.assertElementVisible('[data-testid="email-notifications"]');
      await assertionHelper.assertElementVisible('[data-testid="payment-reminders"]');
      await assertionHelper.assertElementVisible('[data-testid="usage-alerts"]');
      
      // 切换通知设置
      await page.click('[data-testid="email-notifications"]');
      await page.click('[data-testid="payment-reminders"]');
      
      // 保存设置
      await page.click('[data-testid="save-notification-settings"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('通知设置已保存');
    });

    test('应该显示即将到期的账单提醒', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟即将到期的订阅
      await page.evaluate(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        window.localStorage.setItem('next-billing-date', tomorrow.toISOString());
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 验证提醒显示
      await assertionHelper.assertElementVisible('[data-testid="billing-reminder"]');
      await assertionHelper.assertTextContent('[data-testid="billing-reminder"]', '您的订阅将在明天续费');
    });
  });
}); 