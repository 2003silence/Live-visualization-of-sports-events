# 体育赛事直播可视化系统
npm run dev
## 项目简介
本项目是一个面向篮球赛事的直播可视化系统，通过图形化和动画的形式为用户提供实时的赛事直播服务。系统将文字形式的比赛事件流转换为动态的可视化展示，让用户能够更直观地了解比赛进程。

## 功能特性
1. 赛事信息显示
   - 显示比赛双方的球队名称和队标
   - 实时显示比赛时间和比分
   - 展示双方球队的技术统计数据
     - 2分球得分
     - 3分球得分
     - 罚球得分
     - 犯规数
     - 盖帽数
     - 篮板数等

2. 比赛事件可视化
   - 球权转换动画
   - 投篮动作展示
   - 进球效果
   - 犯规示意
   - 盖帽动画
   - 球出界提示等

3. 球员数据统计
   - 实时更新每位球员的技术数据
   - 提供详细的球员数据查看界面
   - 数据包括：得分、篮板、助攻、抢断、盖帽等

4. 多场比赛切换
   - 支持用户切换观看不同的比赛
   - 保存每场比赛的进程状态

## 技术架构
- 前端：React + TypeScript
- 动画引擎：PixiJS
- 状态管理：Redux
- 样式处理：Styled-components
- 构建工具：Vite

## 项目结构 
src/
├── components/
│   ├── GameViewer.tsx      # 比赛场景渲染组件
│   ├── StatsViewer.tsx     # 技术统计显示组件
│   ├── GameControl.tsx     # 比赛控制组件（播放、暂停等）
│   ├── GameProgress.tsx    # 比赛进度条组件
│   ├── Loading.tsx         # 加载提示组件
│   └── TechnicalStats.tsx  # 技术统计详情组件
├── core/
│   ├── renderer/
│   │   └── GameRenderer.ts # 游戏渲染核心
│   └── parser/
│       └── EventParser.ts  # 事件解析器
├── data/
│   └── gameData.ts         # 比赛数据
├── types/
│   ├── index.ts            # 类型定义
│   └── gsap.d.ts          # GSAP动画库类型定义
├── utils/
│   └── createBasketballTexture.ts # 篮球纹理创建工具
├── App.tsx                 # 主应用组件
└── main.tsx               # 应用入口