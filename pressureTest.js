#!/usr/bin/env node

const axios = require('axios')
const chalk = require('chalk')
const cliProgress = require('cli-progress')
const { program } = require('commander')
const fs = require('fs')
const path = require('path')
const config = require('./config')

// 信号量类，用于控制并发数量
class Semaphore {
  constructor(max) {
    this.max = max
    this.current = 0
    this.queue = []
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.current < this.max) {
        this.current++
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release() {
    this.current--
    if (this.queue.length > 0) {
      const resolve = this.queue.shift()
      this.current++
      resolve()
    }
  }
}

// 从配置文件读取API配置
const CONFIG = config.api

// 从配置文件读取默认测试配置
const DEFAULT_CONFIG = config.default

// 测试消息模板 - 2000-3000 token左右的内容
const TEST_MESSAGES = [
  {
    role: 'user',
    content: `请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。`,
  },
  {
    role: 'user',
    content: `请详细解释人工智能的发展历程、核心技术原理以及未来发展趋势。

人工智能（Artificial Intelligence，AI）作为计算机科学的一个重要分支，自20世纪50年代诞生以来，经历了多次发展浪潮。从最初的符号主义方法到现在的深度学习和神经网络，AI技术在各个领域都取得了突破性进展。

首先，让我们回顾一下AI的发展历程。1950年，英国数学家艾伦·图灵提出了著名的"图灵测试"，为判断机器是否具备智能提供了标准。1956年，在美国达特茅斯学院召开的会议上，"人工智能"这一术语被正式提出，标志着AI学科的诞生。

在早期发展阶段，研究者们主要关注符号推理和专家系统。这些系统通过预定义的规则和知识库来模拟人类的推理过程。虽然在某些特定领域取得了成功，但由于缺乏学习能力和泛化能力，这些系统的应用范围相对有限。

随着计算能力的提升和大数据时代的到来，机器学习技术开始兴起。特别是深度学习的突破，使得AI在图像识别、语音处理、自然语言处理等领域取得了前所未有的成就。卷积神经网络（CNN）在计算机视觉领域的成功应用，循环神经网络（RNN）和长短期记忆网络（LSTM）在序列数据处理中的优异表现，以及Transformer架构在自然语言处理中的革命性进展，都推动了AI技术的快速发展。

目前，AI技术已经在医疗、金融、教育、交通、制造业等多个行业得到广泛应用。从自动驾驶汽车到智能医疗诊断，从金融风险评估到个性化推荐系统，AI正在改变我们的生活方式和工作方式。

展望未来，AI技术将继续向更智能、更通用、更安全的方向发展。通用人工智能（AGI）的追求、人机协作模式的探索、AI伦理和安全问题的解决，都将成为未来AI发展的重要方向。

请基于以上背景，详细分析AI技术对现代社会的影响，以及我们如何更好地利用AI技术来推动社会进步和人类福祉。`,
  },
  {
    role: 'user',
    content: `请详细分析区块链技术的原理、应用场景以及面临的挑战。

区块链技术作为近年来最具颠覆性的技术创新之一，自2008年中本聪提出比特币概念以来，已经发展成为涵盖数字货币、智能合约、去中心化应用等多个领域的综合性技术体系。

从技术原理角度来看，区块链本质上是一个分布式账本技术。它通过密码学算法、共识机制、时间戳等技术手段，构建了一个去中心化、不可篡改、透明可追溯的数据存储和传输系统。每个区块都包含了前一个区块的哈希值，形成了链式结构，任何对历史数据的修改都会导致后续所有区块的哈希值发生变化，从而被系统检测出来。

共识机制是区块链技术的核心组成部分，常见的共识算法包括工作量证明（PoW）、权益证明（PoS）、委托权益证明（DPoS）等。这些机制确保了网络中的节点能够就区块链的状态达成一致，防止双重支付等恶意行为。

智能合约的引入进一步扩展了区块链的应用范围。智能合约是一种自动执行的计算机程序，它能够在满足预定条件时自动执行相应的操作，无需第三方干预。这为去中心化应用（DApp）的开发提供了基础。

在应用场景方面，区块链技术已经在多个领域展现出巨大潜力。在金融领域，除了数字货币之外，区块链还被应用于跨境支付、供应链金融、保险理赔等场景。在供应链管理中，区块链能够提供完整的商品追溯信息，确保产品质量和安全。在数字身份认证方面，区块链可以为用户提供去中心化的身份管理解决方案。

然而，区块链技术也面临着诸多挑战。首先是可扩展性问题，现有的区块链网络在处理大量交易时往往面临性能瓶颈。其次是能源消耗问题，特别是采用PoW共识机制的区块链网络，其能源消耗量巨大。此外，监管政策的不确定性、技术标准的缺失、用户教育的不足等问题也制约着区块链技术的广泛应用。

请基于以上分析，探讨区块链技术在未来十年的发展趋势，以及如何解决当前面临的技术和制度挑战。`,
  },
  {
    role: 'user',
    content: `请详细阐述量子计算的基本原理、发展现状以及未来应用前景。

量子计算作为下一代计算技术的代表，基于量子力学的基本原理，有望在特定问题上实现指数级的计算加速，从而在密码学、材料科学、药物发现、人工智能等领域产生革命性影响。

量子计算的核心是量子比特（qubit），与经典比特只能处于0或1两种状态不同，量子比特可以同时处于0和1的叠加态。这种叠加性质使得n个量子比特可以同时表示2^n种状态，为并行计算提供了基础。此外，量子比特之间还可以产生纠缠现象，即两个或多个量子比特之间存在强烈的量子关联，改变其中一个量子比特的状态会瞬间影响其他纠缠的量子比特。

量子计算的关键操作包括量子门操作和量子测量。量子门是作用在量子比特上的基本操作，类似于经典计算中的逻辑门。通过组合不同的量子门，可以构建复杂的量子算法。量子测量则用于读取量子比特的状态，但测量过程会破坏量子叠加态，这是量子计算的一个重要限制。

目前，量子计算的发展仍处于早期阶段，主要面临量子退相干、量子纠错、可扩展性等挑战。量子退相干是指量子系统与环境相互作用导致量子叠加态消失的过程，这是实现量子计算的主要障碍。为了解决这个问题，研究者们开发了各种量子纠错技术，包括量子纠错码和容错量子计算等。

在硬件实现方面，目前有多种量子比特实现方案，包括超导量子比特、离子阱量子比特、拓扑量子比特等。谷歌、IBM、微软、阿里巴巴等科技公司都在积极投入量子计算研发，并推出了各自的量子计算平台。

量子计算的应用前景非常广阔。在密码学领域，量子计算可能会威胁现有的公钥密码系统，但也为量子密码学的发展提供了机遇。在材料科学中，量子计算可以帮助模拟复杂的量子系统，加速新材料的发现和设计。在药物发现方面，量子计算可以模拟分子间的相互作用，提高药物研发的效率。在人工智能领域，量子机器学习算法有望在模式识别、优化问题等方面取得突破。

请分析量子计算技术发展面临的主要挑战，以及如何推动量子计算从实验室走向实际应用。`,
  },
  {
    role: 'user',
    content: `请详细分析云计算技术的发展历程、核心技术架构以及未来发展趋势。

云计算作为21世纪最重要的信息技术之一，通过将计算资源、存储资源、网络资源等虚拟化并集中管理，为用户提供了按需获取、弹性扩展、按使用量付费的IT服务模式。这种模式不仅降低了企业的IT成本，还提高了资源的利用效率，推动了数字化转型的进程。

云计算的发展可以追溯到20世纪60年代的分时系统，但真正意义上的云计算概念是在21世纪初提出的。2006年，亚马逊推出了弹性计算云（EC2）服务，标志着云计算商业化的开始。随后，谷歌、微软、IBM等科技巨头纷纷进入云计算市场，推动了云计算技术的快速发展。

从技术架构角度来看，云计算通常采用分层架构，包括基础设施即服务（IaaS）、平台即服务（PaaS）和软件即服务（SaaS）三个层次。IaaS层提供虚拟化的计算、存储和网络资源，用户可以在这些基础设施上部署和运行自己的应用程序。PaaS层提供开发和部署应用程序的平台环境，包括操作系统、开发工具、数据库等。SaaS层则直接提供应用程序服务，用户无需关心底层的技术实现。

虚拟化技术是云计算的核心技术之一，它通过软件模拟硬件功能，将物理资源抽象为逻辑资源，实现了资源的灵活分配和管理。容器技术的兴起进一步简化了应用程序的部署和管理，Docker、Kubernetes等容器编排工具成为了云原生应用开发的重要工具。

云计算还涉及多项关键技术，包括分布式计算、负载均衡、自动化运维、安全防护等。分布式计算确保了云服务的可靠性和可扩展性，负载均衡技术提高了系统的性能和稳定性，自动化运维降低了运维成本，安全防护技术保障了用户数据的安全。

在部署模式方面，云计算包括公有云、私有云、混合云和边缘云等。公有云由第三方云服务提供商运营，用户通过互联网访问服务；私有云为企业内部使用，提供更高的安全性和控制能力；混合云结合了公有云和私有云的优势；边缘云则将计算能力推向网络边缘，降低了延迟，提高了响应速度。

云计算的应用已经渗透到各个行业，包括互联网、金融、制造、教育、医疗等。企业通过云服务实现了业务的快速部署和扩展，降低了IT成本，提高了运营效率。特别是在疫情期间，云计算为远程办公、在线教育、电子商务等提供了重要支撑。

展望未来，云计算技术将继续向智能化、自动化、安全化方向发展。人工智能与云计算的深度融合将产生智能云服务，自动化运维将进一步提高云服务的效率，量子计算、5G等新技术的应用将为云计算带来新的发展机遇。

请分析云计算技术面临的主要挑战，以及如何推动云计算向更智能、更安全、更高效的方向发展。`,
  },
  {
    role: 'user',
    content: `请详细探讨5G技术的发展现状、技术特点以及对未来社会的影响。

5G（第五代移动通信技术）作为新一代移动通信标准，不仅在传输速度上实现了大幅提升，更重要的是在连接密度、延迟控制、可靠性等方面都有了质的飞跃，为物联网、人工智能、自动驾驶、虚拟现实等新兴技术的发展提供了强有力的网络支撑。

从技术特点来看，5G采用了多项创新技术。首先是毫米波技术，5G可以使用更高的频段（包括毫米波频段），这大大增加了可用频谱资源，为高速数据传输提供了基础。其次是大规模MIMO（多输入多输出）技术，通过在基站部署大量天线，可以实现空间复用和波束赋形，提高频谱利用率和信号质量。

网络切片技术是5G的另一个重要特性，它允许在同一物理网络上创建多个虚拟网络，每个切片可以针对不同的应用场景进行优化。例如，为自动驾驶汽车提供超低延迟的网络切片，为物联网设备提供大连接的网络切片。

边缘计算与5G的结合也是重要的发展方向。通过将计算能力下沉到网络边缘，可以显著降低数据传输延迟，提高响应速度，这对于自动驾驶、工业自动化等对实时性要求较高的应用场景具有重要意义。

5G的应用场景非常广泛。在工业领域，5G支持工业4.0的实现，通过高速、低延迟的网络连接，实现智能制造、远程监控、预测性维护等应用。在医疗领域，5G支持远程手术、远程诊断、医疗数据传输等应用，特别是在疫情期间，5G支持的远程医疗发挥了重要作用。

在交通领域，5G为自动驾驶提供了必要的网络基础设施，车辆可以通过5G网络与道路基础设施、其他车辆进行实时通信，提高行驶安全性。在娱乐领域，5G支持4K/8K视频传输、云游戏、虚拟现实等应用，为用户提供更加沉浸式的体验。

然而，5G技术的发展也面临着一些挑战。首先是基础设施建设成本高昂，需要部署大量基站和光纤网络。其次是频谱资源有限，需要合理分配和管理。此外，5G网络的安全性、隐私保护等问题也需要重点关注。

从社会影响角度来看，5G技术将推动数字化转型，改变人们的生活方式和工作方式。它将加速物联网的发展，实现万物互联的愿景。同时，5G也将推动新兴产业的兴起，创造新的就业机会和商业模式。

请分析5G技术发展面临的主要挑战，以及如何推动5G技术在更多领域实现商业化应用。`,
  },
]

class PressureTester {
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.results = []
    this.startTime = null
    this.endTime = null
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      timeout: 0,
      errors: 0,
      responseTimes: [],
    }

    // 生成当前测试的唯一时间戳
    this.testTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.testId = `test-${this.testTimestamp}`

    // 创建axios实例
    this.client = axios.create({
      baseURL: CONFIG.baseURL,
      timeout: this.config.timeout,
      headers: {
        Authorization: `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // 生成随机测试消息
  getRandomMessage() {
    return TEST_MESSAGES[Math.floor(Math.random() * TEST_MESSAGES.length)]
  }

  // 发送单个请求
  async sendRequest(requestId) {
    const startTime = Date.now()
    const message = this.getRandomMessage()

    // 添加调试日志（每100个请求记录一次）
    if (requestId % 100 === 0) {
      console.log(
        chalk.yellow(
          `📤 发送请求 ${requestId}, 当前统计: 成功=${this.stats.success}, 失败=${this.stats.failed}`
        )
      )
    }

    try {
      const response = await this.client.post(CONFIG.endpoint, {
        model: CONFIG.model,
        messages: [message],
        max_tokens: 2000, // 增加输出token数量以匹配长输入
        temperature: 0.7,
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 线程安全的统计更新
      this.updateStats(true, responseTime)

      return {
        requestId,
        success: true,
        responseTime,
        status: response.status,
        data: response.data,
        error: null,
      }
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 线程安全的统计更新
      this.updateStats(false, responseTime, error)

      return {
        requestId,
        success: false,
        responseTime,
        status: error.response?.status || 0,
        data: null,
        error: error.message,
      }
    }
  }

  // 线程安全的统计更新方法
  updateStats(success, responseTime, error = null) {
    this.stats.total++
    this.stats.responseTimes.push(responseTime)

    if (success) {
      this.stats.success++
    } else {
      this.stats.failed++
      if (error && error.code === 'ECONNABORTED') {
        this.stats.timeout++
      } else {
        this.stats.errors++
      }
    }
  }

  // 速率限制请求控制 - 每秒发送固定数量的请求
  async runRateLimitedRequests(rate, totalRequests) {
    // 创建进度条
    const progressBar = new cliProgress.SingleBar({
      format:
        chalk.cyan('速率测试') +
        ' |{bar}| {percentage}% | {value}/{total} 请求 | {duration_formatted} | {status}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    })

    progressBar.start(totalRequests, 0, {
      duration_formatted: '00:00',
      status: '准备中...',
    })

    const startTime = Date.now()
    let completedRequests = 0
    const requestInterval = 1000 / rate // 每个请求之间的间隔（毫秒）

    // 发送请求的函数
    const sendRequestWithRateLimit = async (requestId) => {
      // 计算这个请求应该何时发送
      const scheduledTime = startTime + (requestId - 1) * requestInterval
      const now = Date.now()

      // 如果还没到发送时间，等待
      if (scheduledTime > now) {
        await new Promise((resolve) => setTimeout(resolve, scheduledTime - now))
      }

      const result = await this.sendRequest(requestId)
      this.results.push(result)
      completedRequests++

      // 更新进度条
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const duration_formatted = `${Math.floor(elapsed / 60)
        .toString()
        .padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`
      const successRate =
        this.stats.total > 0
          ? ((this.stats.success / this.stats.total) * 100).toFixed(1)
          : 0

      progressBar.update(completedRequests, {
        duration_formatted,
        status: `成功率: ${successRate}% | 成功: ${this.stats.success} | 失败: ${this.stats.failed} | 速率: ${rate}/s`,
      })
    }

    // 并发发送请求（但通过时间控制速率）
    const promises = []
    for (let i = 1; i <= totalRequests; i++) {
      promises.push(sendRequestWithRateLimit(i))
    }

    await Promise.all(promises)
    progressBar.stop()
  }

  // 并发请求控制 - 使用信号量控制真正的并发
  async runConcurrentRequests(concurrent, totalRequests) {
    // 创建进度条
    const progressBar = new cliProgress.SingleBar({
      format:
        chalk.cyan('进度') +
        ' |{bar}| {percentage}% | {value}/{total} 请求 | {duration_formatted} | {status}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    })

    progressBar.start(totalRequests, 0, {
      duration_formatted: '00:00',
      status: '准备中...',
    })

    const startTime = Date.now()
    let completedRequests = 0

    // 创建请求队列
    const requestQueue = []
    for (let i = 1; i <= totalRequests; i++) {
      requestQueue.push(i)
    }

    // 信号量控制并发
    const semaphore = new Semaphore(concurrent)

    // 处理所有请求
    const promises = requestQueue.map(async (requestId) => {
      await semaphore.acquire()
      try {
        // 请求间隔 - 在信号量内部，确保真正的并发控制
        if (this.config.interval > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.interval)
          )
        }

        const result = await this.sendRequest(requestId)
        this.results.push(result)

        completedRequests++

        // 更新进度条
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const duration_formatted = `${Math.floor(elapsed / 60)
          .toString()
          .padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`
        const successRate =
          this.stats.total > 0
            ? ((this.stats.success / this.stats.total) * 100).toFixed(1)
            : 0

        progressBar.update(completedRequests, {
          duration_formatted,
          status: `成功率: ${successRate}% | 成功: ${this.stats.success} | 失败: ${this.stats.failed}`,
        })
      } finally {
        semaphore.release()
      }
    })

    await Promise.all(promises)
    progressBar.stop()
  }

  // 时间限制测试 - 使用信号量控制真正的并发
  async runDurationTest(concurrent, duration) {
    // 创建进度条
    const progressBar = new cliProgress.SingleBar({
      format:
        chalk.cyan('时间测试') +
        ' |{bar}| {percentage}% | {value}/{total} 秒 | {requests} 请求 | {status}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    })

    progressBar.start(duration, 0, {
      requests: 0,
      status: '准备中...',
    })

    const startTime = Date.now()
    const endTime = Date.now() + duration * 1000
    let requestId = 0

    // 信号量控制并发
    const semaphore = new Semaphore(concurrent)

    // 持续发送请求直到时间结束
    const sendRequests = async () => {
      while (Date.now() < endTime) {
        requestId++
        await semaphore.acquire()

        // 异步处理请求，不等待完成
        this.sendRequest(requestId)
          .then((result) => {
            this.results.push(result)
            semaphore.release()
          })
          .catch((error) => {
            // 即使请求失败，也需要释放信号量
            // 注意：这里不应该调用updateStats，因为sendRequest内部已经调用了
            semaphore.release()
          })

        // 请求间隔
        if (this.config.interval > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.interval)
          )
        }
      }
    }

    // 更新进度条
    const updateProgress = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      const successRate =
        this.stats.total > 0
          ? ((this.stats.success / this.stats.total) * 100).toFixed(1)
          : 0

      progressBar.update(elapsed, {
        requests: this.stats.total,
        status: `成功率: ${successRate}% | 成功: ${this.stats.success} | 失败: ${this.stats.failed}`,
      })

      if (elapsed < duration) {
        setTimeout(updateProgress, 1000)
      }
    }

    // 启动请求发送和进度更新
    const requestsPromise = sendRequests()
    updateProgress()

    await requestsPromise

    // 等待所有正在进行的请求完成
    while (semaphore.current > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    progressBar.stop()
  }

  // 计算统计数据
  calculateStats() {
    const responseTimes = this.stats.responseTimes
    const sorted = responseTimes.sort((a, b) => a - b)

    return {
      total: this.stats.total,
      success: this.stats.success,
      failed: this.stats.failed,
      timeout: this.stats.timeout,
      errors: this.stats.errors,
      successRate:
        this.stats.total > 0
          ? ((this.stats.success / this.stats.total) * 100).toFixed(2)
          : 0,
      avgResponseTime:
        responseTimes.length > 0
          ? (
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            ).toFixed(2)
          : 0,
      minResponseTime: sorted.length > 0 ? sorted[0] : 0,
      maxResponseTime: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      p50: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0,
      p90: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.9)] : 0,
      p95: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0,
      p99: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0,
      qps: this.stats.total / ((this.endTime - this.startTime) / 1000),
    }
  }

  // 保存结果
  async saveResults(stats) {
    if (!this.config.saveResults) return

    // 创建输出目录
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true })
    }

    // 使用当前测试的时间戳
    const timestamp = this.testTimestamp

    // 保存完整结果
    const filename = `pressure-test-${timestamp}.json`
    const filepath = path.join(this.config.outputDir, filename)

    const report = {
      testId: this.testId,
      config: this.config,
      stats,
      results: this.results,
      startTime: this.startTime ? new Date(this.startTime).toISOString() : null,
      endTime: this.endTime ? new Date(this.endTime).toISOString() : null,
      duration:
        this.endTime && this.startTime ? this.endTime - this.startTime : 0,
      timestamp: new Date().toISOString(),
    }

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
    console.log(chalk.green(`\n📊 测试结果已保存到: ${filepath}`))
    console.log(chalk.gray(`   测试ID: ${this.testId}`))

    // 调试信息：显示统计对比
    console.log(chalk.yellow(`\n🔍 统计调试信息:`))
    console.log(chalk.gray(`   stats.total: ${stats.total}`))
    console.log(chalk.gray(`   stats.success: ${stats.success}`))
    console.log(chalk.gray(`   stats.failed: ${stats.failed}`))
    console.log(chalk.gray(`   results.length: ${this.results.length}`))
    console.log(
      chalk.gray(
        `   results成功数: ${this.results.filter((r) => r.success).length}`
      )
    )
    console.log(
      chalk.gray(
        `   results失败数: ${this.results.filter((r) => !r.success).length}`
      )
    )

    // 保存所有请求的详细日志（成功和失败）
    const allRequestsFilename = `all-requests-${timestamp}.json`
    const allRequestsFilepath = path.join(
      this.config.outputDir,
      allRequestsFilename
    )

    const allRequestsReport = {
      testId: this.testId,
      summary: {
        totalRequests: this.results.length,
        successRequests: this.results.filter((r) => r.success).length,
        failedRequests: this.results.filter((r) => !r.success).length,
        successRate:
          this.results.length > 0
            ? (
                (this.results.filter((r) => r.success).length /
                  this.results.length) *
                100
              ).toFixed(2) + '%'
            : '0%',
        timestamp: new Date().toISOString(),
      },
      allRequests: this.results.map((result) => ({
        requestId: result.requestId,
        success: result.success,
        responseTime: result.responseTime,
        status: result.status,
        error: result.error,
        timestamp: new Date().toISOString(),
      })),
      successRequests: this.results
        .filter((r) => r.success)
        .map((result) => ({
          requestId: result.requestId,
          responseTime: result.responseTime,
          status: result.status,
          timestamp: new Date().toISOString(),
        })),
      failedRequests: this.results
        .filter((r) => !r.success)
        .map((result) => ({
          requestId: result.requestId,
          responseTime: result.responseTime,
          status: result.status,
          error: result.error,
          timestamp: new Date().toISOString(),
        })),
    }

    fs.writeFileSync(
      allRequestsFilepath,
      JSON.stringify(allRequestsReport, null, 2)
    )
    console.log(chalk.blue(`\n📝 所有请求日志已保存到: ${allRequestsFilepath}`))
    console.log(
      chalk.gray(`   成功请求: ${allRequestsReport.summary.successRequests}`)
    )
    console.log(
      chalk.gray(`   失败请求: ${allRequestsReport.summary.failedRequests}`)
    )

    // 保存失败日志
    const failedResults = this.results.filter((result) => !result.success)
    if (failedResults.length > 0) {
      const failedFilename = `failed-requests-${timestamp}.json`
      const failedFilepath = path.join(this.config.outputDir, failedFilename)

      const failedReport = {
        testId: this.testId,
        summary: {
          totalFailed: failedResults.length,
          totalRequests: this.results.length,
          failureRate:
            ((failedResults.length / this.results.length) * 100).toFixed(2) +
            '%',
          timestamp: new Date().toISOString(),
        },
        failedRequests: failedResults.map((result) => ({
          requestId: result.requestId,
          responseTime: result.responseTime,
          status: result.status,
          error: result.error,
          timestamp: new Date().toISOString(),
        })),
        errorAnalysis: this.analyzeErrors(failedResults),
      }

      fs.writeFileSync(failedFilepath, JSON.stringify(failedReport, null, 2))
      console.log(chalk.red(`\n❌ 失败请求日志已保存到: ${failedFilepath}`))
      console.log(
        chalk.red(
          `   失败请求数量: ${failedResults.length}/${this.results.length}`
        )
      )
    }

    // 保存成功请求日志
    const successResults = this.results.filter((result) => result.success)
    if (successResults.length > 0) {
      const successFilename = `success-requests-${timestamp}.json`
      const successFilepath = path.join(this.config.outputDir, successFilename)

      const successReport = {
        testId: this.testId,
        summary: {
          totalSuccess: successResults.length,
          totalRequests: this.results.length,
          successRate:
            ((successResults.length / this.results.length) * 100).toFixed(2) +
            '%',
          avgResponseTime:
            successResults.reduce((sum, r) => sum + r.responseTime, 0) /
            successResults.length,
          minResponseTime: Math.min(
            ...successResults.map((r) => r.responseTime)
          ),
          maxResponseTime: Math.max(
            ...successResults.map((r) => r.responseTime)
          ),
          timestamp: new Date().toISOString(),
        },
        successRequests: successResults.map((result) => ({
          requestId: result.requestId,
          responseTime: result.responseTime,
          status: result.status,
          timestamp: new Date().toISOString(),
        })),
      }

      fs.writeFileSync(successFilepath, JSON.stringify(successReport, null, 2))
      console.log(chalk.green(`\n✅ 成功请求日志已保存到: ${successFilepath}`))
      console.log(
        chalk.green(
          `   成功请求数量: ${successResults.length}/${this.results.length}`
        )
      )
    }

    // 保存测试摘要
    const summaryFilename = `test-summary-${timestamp}.json`
    const summaryFilepath = path.join(this.config.outputDir, summaryFilename)

    const summary = {
      testId: this.testId,
      timestamp: new Date().toISOString(),
      config: {
        concurrent: this.config.concurrent,
        requests: this.config.requests,
        duration: this.config.duration,
        interval: this.config.interval,
        timeout: this.config.timeout,
      },
      results: {
        total: stats.total,
        success: stats.success,
        failed: stats.failed,
        successRate: stats.successRate + '%',
        avgResponseTime: stats.avgResponseTime + 'ms',
        qps: stats.qps.toFixed(2),
      },
      files: {
        fullReport: filename,
        allRequests: allRequestsFilename,
        successLog:
          successResults.length > 0
            ? `success-requests-${timestamp}.json`
            : null,
        failedLog:
          failedResults.length > 0 ? `failed-requests-${timestamp}.json` : null,
        summary: summaryFilename,
      },
    }

    fs.writeFileSync(summaryFilepath, JSON.stringify(summary, null, 2))
    console.log(chalk.blue(`\n📋 测试摘要已保存到: ${summaryFilepath}`))
  }

  // 分析错误类型
  analyzeErrors(failedResults) {
    const errorTypes = {}
    const statusCodes = {}

    failedResults.forEach((result) => {
      // 统计错误类型
      const errorType = result.error || 'Unknown Error'
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1

      // 统计状态码
      const statusCode = result.status || 0
      statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1
    })

    return {
      errorTypes,
      statusCodes,
      mostCommonError: Object.entries(errorTypes).sort(
        (a, b) => b[1] - a[1]
      )[0],
      mostCommonStatus: Object.entries(statusCodes).sort(
        (a, b) => b[1] - a[1]
      )[0],
    }
  }

  // 打印测试报告
  printReport(stats) {
    console.log(chalk.cyan('\n' + '='.repeat(60)))
    console.log(chalk.cyan('📊 压测结果报告'))
    console.log(chalk.cyan('='.repeat(60)))

    console.log(chalk.yellow('\n📈 基本统计:'))
    console.log(`  总请求数: ${chalk.green(stats.total)}`)
    console.log(`  成功请求: ${chalk.green(stats.success)}`)
    console.log(`  失败请求: ${chalk.red(stats.failed)}`)
    console.log(`  超时请求: ${chalk.red(stats.timeout)}`)
    console.log(`  错误请求: ${chalk.red(stats.errors)}`)
    console.log(`  成功率: ${chalk.green(stats.successRate)}%`)

    console.log(chalk.yellow('\n⏱️  响应时间统计 (毫秒):'))
    console.log(`  平均响应时间: ${chalk.green(stats.avgResponseTime)}ms`)
    console.log(`  最小响应时间: ${chalk.green(stats.minResponseTime)}ms`)
    console.log(`  最大响应时间: ${chalk.red(stats.maxResponseTime)}ms`)
    console.log(`  P50 (中位数): ${chalk.green(stats.p50)}ms`)
    console.log(`  P90: ${chalk.green(stats.p90)}ms`)
    console.log(`  P95: ${chalk.green(stats.p95)}ms`)
    console.log(`  P99: ${chalk.green(stats.p99)}ms`)

    console.log(chalk.yellow('\n🚀 性能指标:'))
    console.log(`  QPS (每秒请求数): ${chalk.green(stats.qps.toFixed(2))}`)

    console.log(chalk.yellow('\n🔧 测试配置:'))
    console.log(`  并发数: ${chalk.green(this.config.concurrent)}`)
    console.log(`  请求间隔: ${chalk.green(this.config.interval)}ms`)
    console.log(`  超时时间: ${chalk.green(this.config.timeout)}ms`)
    console.log(`  目标域名: ${chalk.green(CONFIG.baseURL)}`)
    console.log(`  模型名称: ${chalk.green(CONFIG.model)}`)

    console.log(chalk.cyan('\n' + '='.repeat(60)))
  }

  // 运行压测
  async run() {
    console.log(chalk.blue('🚀 开始接口压测...'))
    console.log(chalk.gray(`目标域名: ${CONFIG.baseURL}`))
    console.log(chalk.gray(`模型名称: ${CONFIG.model}`))
    console.log(chalk.gray(`并发数: ${this.config.concurrent}`))
    console.log(chalk.gray(`超时时间: ${this.config.timeout}ms`))

    if (this.config.rate > 0) {
      console.log(chalk.gray(`速率限制: ${this.config.rate} 请求/秒`))
    } else {
      console.log(chalk.gray(`请求间隔: ${this.config.interval}ms`))
    }

    if (this.config.duration > 0) {
      console.log(chalk.gray(`持续时间: ${this.config.duration}秒`))
    } else {
      console.log(chalk.gray(`总请求数: ${this.config.requests}`))
    }

    console.log('')

    this.startTime = Date.now()

    try {
      if (this.config.duration > 0) {
        await this.runDurationTest(this.config.concurrent, this.config.duration)
      } else if (this.config.rate > 0) {
        // 使用速率限制模式
        await this.runRateLimitedRequests(
          this.config.rate,
          this.config.requests
        )
      } else {
        // 使用并发控制模式
        await this.runConcurrentRequests(
          this.config.concurrent,
          this.config.requests
        )
      }
    } catch (error) {
      console.error(chalk.red('压测过程中发生错误:'), error.message)
    }

    this.endTime = Date.now()
    const stats = this.calculateStats()

    this.printReport(stats)
    await this.saveResults(stats)

    return stats
  }
}

// 命令行参数解析
program
  .name('pressure-test')
  .description('OpenAI格式接口压测工具')
  .version('1.0.0')

program
  .option('-c, --concurrent <number>', '并发数', '10')
  .option('-d, --duration <number>', '持续时间（秒）', '0')
  .option('-r, --requests <number>', '总请求数', '100')
  .option('-t, --timeout <number>', '请求超时时间（毫秒）', '30000')
  .option('-i, --interval <number>', '请求间隔（毫秒）', '1000')
  .option('--no-save', '不保存结果')
  .option('-o, --output <dir>', '结果输出目录', './results')
  .action(async (options) => {
    const config = {
      concurrent: parseInt(options.concurrent),
      duration: parseInt(options.duration),
      requests: parseInt(options.requests),
      timeout: parseInt(options.timeout),
      interval: parseInt(options.interval),
      saveResults: options.save,
      outputDir: options.output,
    }

    const tester = new PressureTester(config)
    await tester.run()
  })

// 如果直接运行此脚本
if (require.main === module) {
  program.parse()
}

module.exports = PressureTester
