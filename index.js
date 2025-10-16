#!/usr/bin/env node

const chalk = require('chalk')
const { program } = require('commander')
const PressureTester = require('./pressureTest')
const config = require('./config')
const { Utils, ResultAnalyzer, ScenarioRunner } = require('./utils')

// 简单的单次测试函数
async function runSimpleTest() {
  console.log(chalk.blue('🚀 开始简单测试...'))

  const tester = new PressureTester({
    concurrent: 100,
    requests: 200,
    interval: 100,
    timeout: 30000,

    // concurrent: 10, // 并发数
    // duration: 0, // 持续时间（秒），0表示使用请求数模式
    // requests: 100, // 总请求数
    // timeout: 30000, // 请求超时时间（毫秒）
    // interval: 1000, // 请求间隔（毫秒）
  })

  try {
    const stats = await tester.run()

    // 使用结果分析器生成详细报告
    const analyzer = new ResultAnalyzer(tester.results, config)
    analyzer.printColoredReport()

    // 显示失败请求统计
    const failedResults = tester.results.filter((result) => !result.success)
    if (failedResults.length > 0) {
      console.log(chalk.red('\n❌ 失败请求统计:'))
      console.log(
        chalk.red(
          `  失败数量: ${failedResults.length}/${tester.results.length}`
        )
      )
      console.log(
        chalk.red(
          `  失败率: ${(
            (failedResults.length / tester.results.length) *
            100
          ).toFixed(2)}%`
        )
      )
      console.log(chalk.yellow('  详细失败日志已保存到单独的文件中'))
    }

    return stats
  } catch (error) {
    console.error(chalk.red('测试失败:'), error.message)
    process.exit(1)
  }
}

// 命令行程序
program.name('ai-test').description('OpenAI格式接口压测工具').version('1.0.0')

// 简单测试命令
program
  .command('simple')
  .description('运行简单测试（5并发，20请求）')
  .action(runSimpleTest)

// 场景测试命令
program
  .command('scenario <name>')
  .description('运行指定场景测试')
  .option('-c, --concurrent <number>', '覆盖并发数')
  .option('-r, --requests <number>', '覆盖请求数')
  .option('-d, --duration <number>', '覆盖持续时间')
  .option('-t, --timeout <number>', '覆盖超时时间（毫秒）')
  .option('-i, --interval <number>', '覆盖请求间隔（毫秒）')
  .option('--rate <number>', '设置每秒请求数（速率限制模式）')
  .action(async (scenarioName, options) => {
    try {
      const runner = new ScenarioRunner(config)

      // 如果用户输入 'list'，显示可用场景
      if (scenarioName === 'list') {
        runner.listScenarios()
        return
      }

      const customConfig = {}
      if (options.concurrent)
        customConfig.concurrent = parseInt(options.concurrent)
      if (options.requests) customConfig.requests = parseInt(options.requests)
      if (options.duration) customConfig.duration = parseInt(options.duration)
      if (options.timeout) customConfig.timeout = parseInt(options.timeout)
      if (options.interval) customConfig.interval = parseInt(options.interval)
      if (options.rate) customConfig.rate = parseInt(options.rate)

      const testConfig = await runner.runScenario(scenarioName, customConfig)

      const tester = new PressureTester(testConfig)
      const stats = await tester.run()

      const analyzer = new ResultAnalyzer(tester.results, config)
      analyzer.printColoredReport()

      // 显示失败请求统计
      const failedResults = tester.results.filter((result) => !result.success)
      if (failedResults.length > 0) {
        console.log(chalk.red('\n❌ 失败请求统计:'))
        console.log(
          chalk.red(
            `  失败数量: ${failedResults.length}/${tester.results.length}`
          )
        )
        console.log(
          chalk.red(
            `  失败率: ${(
              (failedResults.length / tester.results.length) *
              100
            ).toFixed(2)}%`
          )
        )
        console.log(chalk.yellow('  详细失败日志已保存到单独的文件中'))
      }
    } catch (error) {
      console.error(chalk.red('场景测试失败:'), error.message)
      process.exit(1)
    }
  })

// 自定义测试命令
program
  .command('custom')
  .description('运行自定义参数测试')
  .option('-c, --concurrent <number>', '并发数', '10')
  .option('-r, --requests <number>', '总请求数', '100')
  .option('-d, --duration <number>', '持续时间（秒）', '0')
  .option('-t, --timeout <number>', '请求超时时间（毫秒）', '300000')
  .option('-i, --interval <number>', '请求间隔（毫秒）', '1000')
  .option('--no-save', '不保存结果')
  .option('-o, --output <dir>', '结果输出目录', './results')
  .action(async (options) => {
    const testConfig = {
      concurrent: parseInt(options.concurrent),
      requests: parseInt(options.requests),
      duration: parseInt(options.duration),
      timeout: parseInt(options.timeout),
      interval: parseInt(options.interval),
      saveResults: options.save,
      outputDir: options.output,
    }

    try {
      const tester = new PressureTester(testConfig)
      const stats = await tester.run()

      const analyzer = new ResultAnalyzer(tester.results, config)
      analyzer.printColoredReport()

      // 显示失败请求统计
      const failedResults = tester.results.filter((result) => !result.success)
      if (failedResults.length > 0) {
        console.log(chalk.red('\n❌ 失败请求统计:'))
        console.log(
          chalk.red(
            `  失败数量: ${failedResults.length}/${tester.results.length}`
          )
        )
        console.log(
          chalk.red(
            `  失败率: ${(
              (failedResults.length / tester.results.length) *
              100
            ).toFixed(2)}%`
          )
        )
        console.log(chalk.yellow('  详细失败日志已保存到单独的文件中'))
      }
    } catch (error) {
      console.error(chalk.red('自定义测试失败:'), error.message)
      process.exit(1)
    }
  })

// 配置验证命令
program
  .command('validate')
  .description('验证配置文件')
  .action(() => {
    console.log(chalk.blue('🔍 验证配置文件...'))

    const errors = Utils.validateConfig(config)

    if (errors.length === 0) {
      console.log(chalk.green('✅ 配置验证通过'))
      console.log(chalk.gray(`API域名: ${config.api.baseURL}`))
      console.log(chalk.gray(`模型名称: ${config.api.model}`))
      console.log(
        chalk.gray(`API密钥: ${config.api.apiKey.substring(0, 10)}...`)
      )
    } else {
      console.log(chalk.red('❌ 配置验证失败:'))
      errors.forEach((error) => {
        console.log(chalk.red(`  - ${error}`))
      })
      process.exit(1)
    }
  })

// 如果没有提供命令，显示帮助信息
if (require.main === module) {
  if (process.argv.length <= 2) {
    console.log(chalk.cyan('🤖 AI接口压测工具'))
    console.log(chalk.gray('使用 --help 查看所有可用命令'))
    console.log('')
    console.log(chalk.yellow('快速开始:'))
    console.log(chalk.green('  npm run test          # 运行简单测试'))
    console.log(chalk.green('  node index.js simple  # 运行简单测试'))
    console.log(chalk.green('  node index.js scenario list  # 查看可用场景'))
    console.log(chalk.green('  node index.js validate # 验证配置'))
  }

  program.parse()
}

module.exports = {
  runSimpleTest,
  PressureTester,
  config,
  Utils,
  ResultAnalyzer,
  ScenarioRunner,
}
