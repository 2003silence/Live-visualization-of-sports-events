# 体育赛事直播可视化系统

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