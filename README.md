# AI接口压测工具

一个专为OpenAI格式API设计的接口压测工具，支持多种测试场景和详细的性能分析。

## 🚀 功能特性

- **多种测试模式**: 支持并发数控制、时间限制、请求数限制
- **丰富的测试场景**: 预定义多种测试场景（轻量、中等、高负载、压力测试等）
- **实时进度显示**: 彩色进度条和实时统计信息
- **详细结果分析**: 响应时间统计、成功率分析、错误分析
- **结果保存**: 自动保存测试结果到JSON文件
- **性能评估**: 自动评级系统（优秀/良好/可接受/较差）
- **灵活配置**: 支持命令行参数和配置文件

## 📦 安装

```bash
# 安装依赖
npm install

# 或者使用yarn
yarn install
```

## ⚙️ 配置

项目已预配置了你的API信息：

- **域名**: `openai.com`
- **模型**: `deepseek-v3-1-250821`
- **API密钥**: 已配置（请在`config.js`中查看）

如需修改配置，请编辑 `config.js` 文件。

## 🎯 快速开始

### 1. 验证配置
```bash
node index.js validate
```

### 2. 运行简单测试
```bash
# 使用npm脚本
npm run test

# 或直接运行
node index.js simple
```

### 3. 查看可用测试场景
```bash
node index.js scenario list
```

### 4. 运行场景测试
```bash
# 轻量级测试
node index.js scenario light

# 中等负载测试
node index.js scenario medium

# 高负载测试
node index.js scenario heavy

# 压力测试
node index.js scenario stress

# 时间限制测试（60秒）
node index.js scenario duration
```

## 📋 命令详解

### 简单测试
```bash
node index.js simple
```
- 并发数: 5
- 请求数: 20
- 间隔: 1000ms

### 场景测试
```bash
node index.js scenario <场景名> [选项]
```

**可用场景:**
- `light`: 轻量级测试（5并发，50请求）
- `medium`: 中等负载测试（20并发，200请求）
- `heavy`: 高负载测试（50并发，500请求）
- `stress`: 压力测试（100并发，1000请求）
- `duration`: 时间限制测试（10并发，60秒）

**选项:**
- `-c, --concurrent <number>`: 覆盖并发数
- `-r, --requests <number>`: 覆盖请求数
- `-d, --duration <number>`: 覆盖持续时间

**示例:**
```bash
# 运行轻量级测试，但使用10并发
node index.js scenario light -c 10

# 运行中等负载测试，但只发100个请求
node index.js scenario medium -r 100
```

### 自定义测试
```bash
node index.js custom [选项]
```

**选项:**
- `-c, --concurrent <number>`: 并发数（默认: 10）
- `-r, --requests <number>`: 总请求数（默认: 100）
- `-d, --duration <number>`: 持续时间（秒）（默认: 0，表示使用请求数模式）
- `-t, --timeout <number>`: 请求超时时间（毫秒）（默认: 30000）
- `-i, --interval <number>`: 请求间隔（毫秒）（默认: 1000）
- `--no-save`: 不保存结果
- `-o, --output <dir>`: 结果输出目录（默认: ./results）

**示例:**
```bash
# 自定义测试：20并发，200请求，500ms间隔
node index.js custom -c 20 -r 200 -i 500

# 时间限制测试：10并发，持续120秒
node index.js custom -c 10 -d 120

# 快速测试：50并发，1000请求，不保存结果
node index.js custom -c 50 -r 1000 --no-save
```

### 直接使用压测脚本
```bash
node pressureTest.js [选项]
```

**选项:**
- `-c, --concurrent <number>`: 并发数（默认: 10）
- `-r, --requests <number>`: 总请求数（默认: 100）
- `-d, --duration <number>`: 持续时间（秒）（默认: 0）
- `-t, --timeout <number>`: 请求超时时间（毫秒）（默认: 30000）
- `-i, --interval <number>`: 请求间隔（毫秒）（默认: 1000）
- `--no-save`: 不保存结果
- `-o, --output <dir>`: 结果输出目录（默认: ./results）

## 📊 测试报告

### 实时显示
测试过程中会显示：
- 彩色进度条
- 实时成功率
- 成功/失败请求计数
- 已用时间

### 详细报告
测试完成后会显示：
- **基础统计**: 总请求数、成功数、失败数、成功率
- **响应时间统计**: 平均、最小、最大、P50、P90、P95、P99
- **性能指标**: QPS（每秒请求数）
- **错误分析**: 错误类型分布
- **性能评估**: 自动评级（优秀/良好/可接受/较差）

### 结果保存
测试结果会自动保存到 `./results/` 目录下：

**完整结果文件**：
```
pressure-test-YYYY-MM-DDTHH-mm-ss-sssZ.json
```

**失败日志文件**：
```
failed-requests-YYYY-MM-DDTHH-mm-ss-sssZ.json
failed-analysis-YYYY-MM-DDTHH-mm-ss-sssZ.json
```

失败日志文件包含：
- 失败请求的详细信息
- 错误类型分析
- HTTP状态码统计
- 优化建议
- 常见错误模式识别

## 🔧 配置说明

### 主要配置文件: `config.js`

```javascript
module.exports = {
  // API配置
  api: {
    baseURL: 'https://cn-beijing.yuannengai.com',
    apiKey: 'your-api-key',
    model: 'deepseek-v3-1-250821',
    endpoint: '/v1/chat/completions'
  },

  // 测试场景
  scenarios: {
    light: { concurrent: 5, requests: 50, interval: 2000 },
    medium: { concurrent: 20, requests: 200, interval: 500 },
    heavy: { concurrent: 50, requests: 500, interval: 100 },
    stress: { concurrent: 100, requests: 1000, interval: 50 }
  },

  // 性能评估阈值
  analysis: {
    responseTimeThresholds: {
      excellent: 1000,  // 优秀
      good: 3000,       // 良好
      acceptable: 5000, // 可接受
      poor: 10000       // 较差
    }
  }
};
```

## 📈 性能评估标准

### 响应时间评级
- **优秀**: ≤ 1000ms
- **良好**: ≤ 3000ms
- **可接受**: ≤ 5000ms
- **较差**: > 5000ms

### 成功率评级
- **优秀**: ≥ 99%
- **良好**: ≥ 95%
- **可接受**: ≥ 90%
- **较差**: < 90%

### QPS评级
- **优秀**: ≥ 50 QPS
- **良好**: ≥ 20 QPS
- **可接受**: ≥ 10 QPS
- **较差**: < 10 QPS

## 🚨 注意事项

1. **API限制**: 请注意API的速率限制，避免超出限制导致测试失败
2. **网络环境**: 确保网络连接稳定，避免网络问题影响测试结果
3. **资源消耗**: 高并发测试会消耗较多系统资源，请根据机器性能调整参数
4. **结果解读**: 测试结果仅供参考，实际性能可能因网络、服务器负载等因素而变化

## 🔍 故障排除

### 常见问题

1. **连接超时**
   - 检查网络连接
   - 增加超时时间参数 `-t`
   - 减少并发数 `-c`

2. **API密钥错误**
   - 运行 `node index.js validate` 验证配置
   - 检查 `config.js` 中的API密钥

3. **内存不足**
   - 减少并发数
   - 减少总请求数
   - 增加请求间隔

4. **测试结果异常**
   - 检查API服务状态
   - 确认模型名称正确
   - 查看错误日志

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 支持多种测试模式
- 完整的性能分析功能
- 预配置的测试场景

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个工具！

## 📋 失败日志分析

项目提供了专门的失败日志分析工具，帮助您快速定位和解决压测中的问题。

### 分析最新失败日志
```bash
# 使用npm脚本
npm run analyze-latest

# 或直接运行
node analyzeFailures.js latest
```

### 列出所有失败日志
```bash
npm run analyze-list
node analyzeFailures.js list
```

### 分析指定失败日志文件
```bash
node analyzeFailures.js file failed-requests-2025-01-01T10-00-00-000Z.json
```

### 显示失败报告摘要
```bash
npm run analyze-summary
node analyzeFailures.js summary
```

### 失败分析报告内容
- **失败统计**: 失败数量、失败率、总请求数
- **错误分析**: 错误类型分布、HTTP状态码统计
- **优化建议**: 基于错误类型的智能建议
- **详细日志**: 失败请求的完整信息

### 常见错误类型和建议
- **超时错误**: 建议增加超时时间或减少并发数
- **速率限制**: 建议降低并发数或增加请求间隔
- **服务器错误**: 建议减少并发数，服务器可能过载
- **认证错误**: 检查API密钥和权限配置

## 📄 许可证

ISC License
