const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

// 工具函数类
class Utils {
  // 创建目录
  static createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  // 格式化时间
  static formatTime(ms) {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  // 格式化数字
  static formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals)
  }

  // 计算百分位数
  static calculatePercentile(arr, percentile) {
    const sorted = arr.slice().sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  // 生成随机ID
  static generateId(length = 8) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 等待指定时间
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // 验证配置
  static validateConfig(config) {
    const errors = []

    if (!config.api?.baseURL) {
      errors.push('缺少API baseURL配置')
    }

    if (!config.api?.apiKey) {
      errors.push('缺少API密钥配置')
    }

    if (!config.api?.model) {
      errors.push('缺少模型名称配置')
    }

    if (config.default?.concurrent <= 0) {
      errors.push('并发数必须大于0')
    }

    if (config.default?.requests <= 0 && config.default?.duration <= 0) {
      errors.push('必须指定请求数或持续时间')
    }

    if (config.default?.timeout <= 0) {
      errors.push('超时时间必须大于0')
    }

    return errors
  }
}

// 结果分析类
class ResultAnalyzer {
  constructor(results, config) {
    this.results = results
    this.config = config
  }

  // 基础统计
  getBasicStats() {
    const total = this.results.length
    const success = this.results.filter((r) => r.success).length
    const failed = total - success
    const successRate = total > 0 ? (success / total) * 100 : 0

    return {
      total,
      success,
      failed,
      successRate: Utils.formatNumber(successRate, 2),
    }
  }

  // 响应时间统计
  getResponseTimeStats() {
    const responseTimes = this.results.map((r) => r.responseTime)
    const sorted = responseTimes.slice().sort((a, b) => a - b)

    if (sorted.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      }
    }

    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const p50 = Utils.calculatePercentile(sorted, 50)
    const p90 = Utils.calculatePercentile(sorted, 90)
    const p95 = Utils.calculatePercentile(sorted, 95)
    const p99 = Utils.calculatePercentile(sorted, 99)

    return {
      avg: Utils.formatNumber(avg, 2),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50,
      p90,
      p95,
      p99,
    }
  }

  // 错误分析
  getErrorAnalysis() {
    const errors = this.results.filter((r) => !r.success)
    const errorTypes = {}

    errors.forEach((error) => {
      const type = error.error || 'Unknown'
      errorTypes[type] = (errorTypes[type] || 0) + 1
    })

    return {
      totalErrors: errors.length,
      errorTypes,
      errorRate:
        this.results.length > 0
          ? Utils.formatNumber((errors.length / this.results.length) * 100, 2)
          : 0,
    }
  }

  // 性能评估
  getPerformanceAssessment() {
    const basicStats = this.getBasicStats()
    const responseTimeStats = this.getResponseTimeStats()
    const errorAnalysis = this.getErrorAnalysis()

    const thresholds = this.config.analysis || {
      responseTimeThresholds: {
        excellent: 1000,
        good: 3000,
        acceptable: 5000,
        poor: 10000,
      },
      successRateThresholds: {
        excellent: 99,
        good: 95,
        acceptable: 90,
        poor: 80,
      },
    }

    // 响应时间评估
    const avgResponseTime = parseFloat(responseTimeStats.avg)
    let responseTimeGrade = 'poor'
    if (avgResponseTime <= thresholds.responseTimeThresholds.excellent) {
      responseTimeGrade = 'excellent'
    } else if (avgResponseTime <= thresholds.responseTimeThresholds.good) {
      responseTimeGrade = 'good'
    } else if (
      avgResponseTime <= thresholds.responseTimeThresholds.acceptable
    ) {
      responseTimeGrade = 'acceptable'
    }

    // 成功率评估
    const successRate = parseFloat(basicStats.successRate)
    let successRateGrade = 'poor'
    if (successRate >= thresholds.successRateThresholds.excellent) {
      successRateGrade = 'excellent'
    } else if (successRate >= thresholds.successRateThresholds.good) {
      successRateGrade = 'good'
    } else if (successRate >= thresholds.successRateThresholds.acceptable) {
      successRateGrade = 'acceptable'
    }

    return {
      responseTime: {
        value: avgResponseTime,
        grade: responseTimeGrade,
        threshold: thresholds.responseTimeThresholds,
      },
      successRate: {
        value: successRate,
        grade: successRateGrade,
        threshold: thresholds.successRateThresholds,
      },
      overall: this.getOverallGrade(responseTimeGrade, successRateGrade),
    }
  }

  // 获取综合评级
  getOverallGrade(responseTimeGrade, successRateGrade) {
    const grades = { excellent: 4, good: 3, acceptable: 2, poor: 1 }
    const avgGrade = (grades[responseTimeGrade] + grades[successRateGrade]) / 2

    if (avgGrade >= 3.5) return 'excellent'
    if (avgGrade >= 2.5) return 'good'
    if (avgGrade >= 1.5) return 'acceptable'
    return 'poor'
  }

  // 生成详细报告
  generateReport() {
    const basicStats = this.getBasicStats()
    const responseTimeStats = this.getResponseTimeStats()
    const errorAnalysis = this.getErrorAnalysis()
    const performance = this.getPerformanceAssessment()

    return {
      basicStats,
      responseTimeStats,
      errorAnalysis,
      performance,
      timestamp: new Date().toISOString(),
      config: this.config,
    }
  }

  // 打印彩色报告
  printColoredReport() {
    const report = this.generateReport()

    console.log(chalk.cyan('\n' + '='.repeat(80)))
    console.log(chalk.cyan('📊 详细分析报告'))
    console.log(chalk.cyan('='.repeat(80)))

    // 基础统计
    console.log(chalk.yellow('\n📈 基础统计:'))
    console.log(`  总请求数: ${chalk.green(report.basicStats.total)}`)
    console.log(`  成功请求: ${chalk.green(report.basicStats.success)}`)
    console.log(`  失败请求: ${chalk.red(report.basicStats.failed)}`)
    console.log(`  成功率: ${chalk.green(report.basicStats.successRate + '%')}`)

    // 响应时间
    console.log(chalk.yellow('\n⏱️  响应时间统计:'))
    console.log(`  平均: ${chalk.green(report.responseTimeStats.avg + 'ms')}`)
    console.log(`  最小: ${chalk.green(report.responseTimeStats.min + 'ms')}`)
    console.log(`  最大: ${chalk.red(report.responseTimeStats.max + 'ms')}`)
    console.log(`  P50: ${chalk.green(report.responseTimeStats.p50 + 'ms')}`)
    console.log(`  P90: ${chalk.green(report.responseTimeStats.p90 + 'ms')}`)
    console.log(`  P95: ${chalk.green(report.responseTimeStats.p95 + 'ms')}`)
    console.log(`  P99: ${chalk.red(report.responseTimeStats.p99 + 'ms')}`)

    // 错误分析
    if (report.errorAnalysis.totalErrors > 0) {
      console.log(chalk.yellow('\n❌ 错误分析:'))
      console.log(`  总错误数: ${chalk.red(report.errorAnalysis.totalErrors)}`)
      console.log(
        `  错误率: ${chalk.red(report.errorAnalysis.errorRate + '%')}`
      )

      if (Object.keys(report.errorAnalysis.errorTypes).length > 0) {
        console.log('  错误类型分布:')
        Object.entries(report.errorAnalysis.errorTypes).forEach(
          ([type, count]) => {
            console.log(`    ${chalk.red(type)}: ${count}`)
          }
        )
      }
    }

    // 性能评估
    console.log(chalk.yellow('\n🎯 性能评估:'))
    const responseTimeColor = this.getGradeColor(
      report.performance.responseTime.grade
    )
    const successRateColor = this.getGradeColor(
      report.performance.successRate.grade
    )
    const overallColor = this.getGradeColor(report.performance.overall)

    console.log(
      `  响应时间评级: ${responseTimeColor(
        report.performance.responseTime.grade.toUpperCase()
      )}`
    )
    console.log(
      `  成功率评级: ${successRateColor(
        report.performance.successRate.grade.toUpperCase()
      )}`
    )
    console.log(
      `  综合评级: ${overallColor(report.performance.overall.toUpperCase())}`
    )

    console.log(chalk.cyan('\n' + '='.repeat(80)))
  }

  // 获取评级颜色
  getGradeColor(grade) {
    const colors = {
      excellent: chalk.green,
      good: chalk.blue,
      acceptable: chalk.yellow,
      poor: chalk.red,
    }
    return colors[grade] || chalk.white
  }

  // 保存报告到文件
  async saveReport(outputDir, filename, testId = null) {
    Utils.createDir(outputDir)

    const report = this.generateReport()
    if (testId) {
      report.testId = testId
    }
    const filepath = path.join(outputDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
    console.log(chalk.green(`\n详细报告已保存到: ${filepath}`))

    // 如果有失败请求，单独保存失败分析报告
    const failedResults = this.results.filter((result) => !result.success)
    if (failedResults.length > 0) {
      // 从文件名中提取时间戳，如果没有则生成新的
      const timestamp =
        filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/)?.[1] ||
        new Date().toISOString().replace(/[:.]/g, '-')

      const failedFilename = `failed-analysis-${timestamp}.json`
      const failedFilepath = path.join(outputDir, failedFilename)

      const failedAnalysis = {
        testId: testId,
        summary: {
          totalFailed: failedResults.length,
          totalRequests: this.results.length,
          failureRate:
            ((failedResults.length / this.results.length) * 100).toFixed(2) +
            '%',
          timestamp: new Date().toISOString(),
        },
        errorAnalysis: this.getErrorAnalysis(),
        failedRequests: failedResults.map((result) => ({
          requestId: result.requestId,
          responseTime: result.responseTime,
          status: result.status,
          error: result.error,
          timestamp: new Date().toISOString(),
        })),
        recommendations: this.generateFailureRecommendations(failedResults),
      }

      fs.writeFileSync(failedFilepath, JSON.stringify(failedAnalysis, null, 2))
      console.log(chalk.red(`\n失败分析报告已保存到: ${failedFilepath}`))
    }

    return filepath
  }

  // 生成失败建议
  generateFailureRecommendations(failedResults) {
    const recommendations = []
    const errorAnalysis = this.getErrorAnalysis()

    // 分析最常见的错误类型
    if (errorAnalysis.errorTypes) {
      const mostCommonError = Object.entries(errorAnalysis.errorTypes).sort(
        (a, b) => b[1] - a[1]
      )[0]
      if (mostCommonError) {
        const [errorType, count] = mostCommonError

        if (
          errorType.includes('timeout') ||
          errorType.includes('ECONNABORTED')
        ) {
          recommendations.push({
            type: 'timeout',
            description: '检测到超时错误',
            suggestion: '建议增加请求超时时间，或减少并发数',
            count: count,
          })
        }

        if (errorType.includes('429') || errorType.includes('rate limit')) {
          recommendations.push({
            type: 'rate_limit',
            description: '检测到速率限制错误',
            suggestion: '建议降低并发数或增加请求间隔',
            count: count,
          })
        }

        if (
          errorType.includes('500') ||
          errorType.includes('502') ||
          errorType.includes('503')
        ) {
          recommendations.push({
            type: 'server_error',
            description: '检测到服务器错误',
            suggestion: '服务器可能过载，建议减少并发数',
            count: count,
          })
        }

        if (errorType.includes('401') || errorType.includes('403')) {
          recommendations.push({
            type: 'auth_error',
            description: '检测到认证错误',
            suggestion: '检查API密钥和权限配置',
            count: count,
          })
        }
      }
    }

    // 分析响应时间
    const avgResponseTime = this.getResponseTimeStats().avg
    if (parseFloat(avgResponseTime) > 10000) {
      recommendations.push({
        type: 'slow_response',
        description: '响应时间过长',
        suggestion: '建议优化网络连接或减少请求负载',
        avgResponseTime: avgResponseTime + 'ms',
      })
    }

    return recommendations
  }
}

// 场景运行器
class ScenarioRunner {
  constructor(config) {
    this.config = config
  }

  // 运行指定场景
  async runScenario(scenarioName, customConfig = {}) {
    const scenarioConfig = this.config.scenarios[scenarioName]

    if (!scenarioConfig) {
      throw new Error(`场景 '${scenarioName}' 不存在`)
    }

    const mergedConfig = {
      ...this.config.default,
      ...scenarioConfig,
      ...customConfig,
    }

    console.log(chalk.blue(`\n🎬 运行场景: ${scenarioName}`))
    console.log(chalk.gray(`并发数: ${mergedConfig.concurrent}`))
    console.log(chalk.gray(`请求数: ${mergedConfig.requests || '基于时间'}`))
    console.log(chalk.gray(`持续时间: ${mergedConfig.duration || 'N/A'}秒`))

    return mergedConfig
  }

  // 列出可用场景
  listScenarios() {
    console.log(chalk.cyan('\n📋 可用测试场景:'))
    Object.entries(this.config.scenarios).forEach(([name, config]) => {
      console.log(chalk.green(`  ${name}:`))
      console.log(`    并发数: ${config.concurrent}`)
      console.log(`    请求数: ${config.requests || '基于时间'}`)
      console.log(`    持续时间: ${config.duration || 'N/A'}秒`)
      console.log('')
    })
  }
}

module.exports = {
  Utils,
  ResultAnalyzer,
  ScenarioRunner,
}
