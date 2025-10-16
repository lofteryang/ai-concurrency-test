#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { program } = require('commander')

// 分析失败日志工具
class FailureAnalyzer {
  constructor(resultsDir) {
    this.resultsDir = resultsDir
  }

  // 查找最新的失败日志文件
  findLatestFailureLog() {
    if (!fs.existsSync(this.resultsDir)) {
      console.log(chalk.red('结果目录不存在'))
      return null
    }

    const files = fs.readdirSync(this.resultsDir)
    const failureFiles = files
      .filter(
        (file) =>
          file.startsWith('failed-requests-') ||
          file.startsWith('failed-analysis-')
      )
      .sort()
      .reverse()

    return failureFiles.length > 0 ? failureFiles[0] : null
  }

  // 根据测试ID查找相关的日志文件
  findLogsByTestId(testId) {
    if (!fs.existsSync(this.resultsDir)) {
      console.log(chalk.red('结果目录不存在'))
      return null
    }

    const files = fs.readdirSync(this.resultsDir)
    const relatedFiles = files.filter(file => 
      file.includes(testId) || 
      (file.startsWith('pressure-test-') && fs.readFileSync(path.join(this.resultsDir, file), 'utf8').includes(testId))
    )

    return relatedFiles
  }

  // 列出所有测试及其相关文件
  listAllTests() {
    if (!fs.existsSync(this.resultsDir)) {
      console.log(chalk.red('结果目录不存在'))
      return
    }

    const files = fs.readdirSync(this.resultsDir)
    const testFiles = files.filter(file => 
      file.startsWith('pressure-test-') || 
      file.startsWith('test-summary-')
    ).sort().reverse()

    if (testFiles.length === 0) {
      console.log(chalk.yellow('没有找到测试文件'))
      return
    }

    console.log(chalk.cyan('\n📁 所有测试记录:'))
    
    const testGroups = {}
    
    testFiles.forEach(file => {
      const filepath = path.join(this.resultsDir, file)
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))
        const testId = data.testId || 'unknown'
        
        if (!testGroups[testId]) {
          testGroups[testId] = {
            timestamp: data.timestamp || data.startTime || 'unknown',
            files: []
          }
        }
        
        testGroups[testId].files.push({
          name: file,
          type: file.startsWith('test-summary-') ? 'summary' : 'full',
          size: (fs.statSync(filepath).size / 1024).toFixed(2) + ' KB'
        })
      } catch (error) {
        console.log(chalk.gray(`  ⚠️  无法读取文件: ${file}`))
      }
    })

    Object.entries(testGroups).forEach(([testId, info], index) => {
      console.log(`\n  ${index + 1}. ${chalk.green(testId)}`)
      console.log(`     时间: ${info.timestamp}`)
      console.log(`     文件:`)
      info.files.forEach(file => {
        const typeColor = file.type === 'summary' ? chalk.blue : chalk.green
        console.log(`       ${typeColor(file.name)} (${file.size})`)
      })
    })
  }

  // 分析失败日志
  analyzeFailureLog(filename) {
    const filepath = path.join(this.resultsDir, filename)

    if (!fs.existsSync(filepath)) {
      console.log(chalk.red(`文件不存在: ${filepath}`))
      return
    }

    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))

      console.log(chalk.cyan('\n' + '='.repeat(80)))
      console.log(chalk.cyan('📋 失败日志分析报告'))
      console.log(chalk.cyan('='.repeat(80)))
      console.log(chalk.gray(`文件: ${filename}`))
      console.log(
        chalk.gray(
          `时间: ${data.summary?.timestamp || data.timestamp || 'N/A'}`
        )
      )

      // 基本统计
      if (data.summary) {
        console.log(chalk.yellow('\n📊 失败统计:'))
        console.log(`  总失败数: ${chalk.red(data.summary.totalFailed)}`)
        console.log(`  总请求数: ${chalk.green(data.summary.totalRequests)}`)
        console.log(`  失败率: ${chalk.red(data.summary.failureRate)}`)
      }

      // 错误分析
      if (data.errorAnalysis) {
        console.log(chalk.yellow('\n❌ 错误分析:'))

        if (data.errorAnalysis.errorTypes) {
          console.log('  错误类型分布:')
          Object.entries(data.errorAnalysis.errorTypes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([errorType, count]) => {
              const percentage = data.summary
                ? ((count / data.summary.totalFailed) * 100).toFixed(1)
                : '0.0'
              console.log(
                `    ${chalk.red(errorType)}: ${count} (${percentage}%)`
              )
            })
        }

        if (data.errorAnalysis.statusCodes) {
          console.log('  HTTP状态码分布:')
          Object.entries(data.errorAnalysis.statusCodes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([statusCode, count]) => {
              const percentage = data.summary
                ? ((count / data.summary.totalFailed) * 100).toFixed(1)
                : '0.0'
              const statusColor = this.getStatusCodeColor(statusCode)
              console.log(
                `    ${statusColor(statusCode)}: ${count} (${percentage}%)`
              )
            })
        }

        if (data.errorAnalysis.mostCommonError) {
          console.log(
            `\n  最常见错误: ${chalk.red(
              data.errorAnalysis.mostCommonError[0]
            )} (${data.errorAnalysis.mostCommonError[1]}次)`
          )
        }

        if (data.errorAnalysis.mostCommonStatus) {
          const statusColor = this.getStatusCodeColor(
            data.errorAnalysis.mostCommonStatus[0]
          )
          console.log(
            `  最常见状态码: ${statusColor(
              data.errorAnalysis.mostCommonStatus[0]
            )} (${data.errorAnalysis.mostCommonStatus[1]}次)`
          )
        }
      }

      // 建议
      if (data.recommendations && data.recommendations.length > 0) {
        console.log(chalk.yellow('\n💡 优化建议:'))
        data.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${chalk.blue(rec.description)}`)
          console.log(`     ${chalk.green('建议')}: ${rec.suggestion}`)
          if (rec.count) console.log(`     数量: ${rec.count}`)
          if (rec.avgResponseTime)
            console.log(`     平均响应时间: ${rec.avgResponseTime}`)
          console.log('')
        })
      }

      // 详细失败请求（仅显示前10个）
      if (data.failedRequests && data.failedRequests.length > 0) {
        console.log(chalk.yellow('\n📝 失败请求详情 (前10个):'))
        data.failedRequests.slice(0, 10).forEach((req, index) => {
          console.log(`  ${index + 1}. 请求ID: ${req.requestId}`)
          console.log(`     响应时间: ${req.responseTime}ms`)
          console.log(
            `     状态码: ${this.getStatusCodeColor(req.status)(req.status)}`
          )
          console.log(`     错误信息: ${chalk.red(req.error)}`)
          console.log('')
        })

        if (data.failedRequests.length > 10) {
          console.log(
            chalk.gray(
              `  ... 还有 ${data.failedRequests.length - 10} 个失败请求`
            )
          )
        }
      }

      console.log(chalk.cyan('\n' + '='.repeat(80)))
    } catch (error) {
      console.log(chalk.red('解析文件失败:'), error.message)
    }
  }

  // 获取状态码颜色
  getStatusCodeColor(statusCode) {
    const code = parseInt(statusCode)
    if (code >= 200 && code < 300) return chalk.green
    if (code >= 300 && code < 400) return chalk.yellow
    if (code >= 400 && code < 500) return chalk.red
    if (code >= 500) return chalk.magenta
    return chalk.gray
  }

  // 列出所有失败日志文件
  listFailureLogs() {
    if (!fs.existsSync(this.resultsDir)) {
      console.log(chalk.red('结果目录不存在'))
      return
    }

    const files = fs.readdirSync(this.resultsDir)
    const failureFiles = files
      .filter(
        (file) =>
          file.startsWith('failed-requests-') ||
          file.startsWith('failed-analysis-')
      )
      .sort()
      .reverse()

    if (failureFiles.length === 0) {
      console.log(chalk.yellow('没有找到失败日志文件'))
      return
    }

    console.log(chalk.cyan('\n📁 失败日志文件列表:'))
    failureFiles.forEach((file, index) => {
      const filepath = path.join(this.resultsDir, file)
      const stats = fs.statSync(filepath)
      const size = (stats.size / 1024).toFixed(2) + ' KB'

      console.log(`  ${index + 1}. ${chalk.green(file)}`)
      console.log(`     大小: ${size}`)
      console.log(`     修改时间: ${stats.mtime.toLocaleString()}`)
      console.log('')
    })
  }

  // 生成失败报告摘要
  generateSummary() {
    const latestFile = this.findLatestFailureLog()
    if (!latestFile) {
      console.log(chalk.yellow('没有找到失败日志文件'))
      return
    }

    const filepath = path.join(this.resultsDir, latestFile)
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))

      console.log(chalk.cyan('\n📊 最新失败报告摘要'))
      console.log(chalk.gray(`文件: ${latestFile}`))

      if (data.summary) {
        console.log(`失败率: ${chalk.red(data.summary.failureRate)}`)
        console.log(
          `失败数量: ${chalk.red(data.summary.totalFailed)}/${chalk.green(
            data.summary.totalRequests
          )}`
        )
      }

      if (data.errorAnalysis?.mostCommonError) {
        console.log(
          `最常见错误: ${chalk.red(data.errorAnalysis.mostCommonError[0])}`
        )
      }

      if (data.recommendations && data.recommendations.length > 0) {
        console.log(chalk.yellow('\n主要建议:'))
        data.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.suggestion}`)
        })
      }
    } catch (error) {
      console.log(chalk.red('读取文件失败:'), error.message)
    }
  }
}

// 命令行程序
program
  .name('analyze-failures')
  .description('分析压测失败日志')
  .version('1.0.0')

program
  .command('latest')
  .description('分析最新的失败日志')
  .option('-d, --dir <directory>', '结果目录', './results')
  .action((options) => {
    const analyzer = new FailureAnalyzer(options.dir)
    const latestFile = analyzer.findLatestFailureLog()

    if (!latestFile) {
      console.log(chalk.yellow('没有找到失败日志文件'))
      return
    }

    analyzer.analyzeFailureLog(latestFile)
  })

program
  .command('list')
  .description('列出所有失败日志文件')
  .option('-d, --dir <directory>', '结果目录', './results')
  .action((options) => {
    const analyzer = new FailureAnalyzer(options.dir)
    analyzer.listFailureLogs()
  })

program
  .command('file <filename>')
  .description('分析指定的失败日志文件')
  .option('-d, --dir <directory>', '结果目录', './results')
  .action((filename, options) => {
    const analyzer = new FailureAnalyzer(options.dir)
    analyzer.analyzeFailureLog(filename)
  })

program
  .command('summary')
  .description('显示最新失败报告摘要')
  .option('-d, --dir <directory>', '结果目录', './results')
  .action((options) => {
    const analyzer = new FailureAnalyzer(options.dir)
    analyzer.generateSummary()
  })

program
  .command('tests')
  .description('列出所有测试记录')
  .option('-d, --dir <directory>', '结果目录', './results')
  .action((options) => {
    const analyzer = new FailureAnalyzer(options.dir)
    analyzer.listAllTests()
  })

program
  .command('test <testId>')
  .description('分析指定测试ID的所有相关日志')
  .option('-d, --dir <directory>', '结果目录', './results')
  .action((testId, options) => {
    const analyzer = new FailureAnalyzer(options.dir)
    const files = analyzer.findLogsByTestId(testId)
    
    if (!files || files.length === 0) {
      console.log(chalk.yellow(`没有找到测试ID为 ${testId} 的相关文件`))
      return
    }
    
    console.log(chalk.cyan(`\n📋 测试 ${testId} 的相关文件:`))
    files.forEach(file => {
      console.log(chalk.green(`  - ${file}`))
    })
    
    // 分析失败日志（如果存在）
    const failureFile = files.find(f => f.startsWith('failed-requests-') || f.startsWith('failed-analysis-'))
    if (failureFile) {
      console.log(chalk.yellow('\n分析失败日志:'))
      analyzer.analyzeFailureLog(failureFile)
    }
  })

// 如果没有提供命令，显示帮助信息
if (require.main === module) {
  if (process.argv.length <= 2) {
    console.log(chalk.cyan('📋 失败日志分析工具'))
    console.log(chalk.gray('使用 --help 查看所有可用命令'))
    console.log('')
    console.log(chalk.yellow('快速开始:'))
    console.log(
      chalk.green('  node analyzeFailures.js latest    # 分析最新失败日志')
    )
    console.log(
      chalk.green('  node analyzeFailures.js list      # 列出所有失败日志')
    )
    console.log(chalk.green('  node analyzeFailures.js summary   # 显示摘要'))
  }

  program.parse()
}

module.exports = FailureAnalyzer
