# 择日学习

现有 GitHub Pages 项目，在原有查、算、练上新增 `course.html` 系统课程。保持原站玄黑鎏金、历史存储键与易术堂入口。

## 课程内容源

- `content/教材/{初级,中级,高级}/`：34章教材，后续直接维护 Markdown。
- `content/题目/`：160道客观题，按章节放 JSON；题干必须给足局部判断所需条件，不问未提供案例的实际结果。
- `content/课程目录.json`：固定章节ID、顺序、目标、出处与关联速查。
- `content/案例.json`：8项完整、部分、空间/规则或格局示意，缺柱留空；不补造公历与实用反馈。
- `content/二十四山原表.json`：据合集p1601–1628提取，仅整理断行；与另一版本p1631–1669及通则有异文时待核，不作已审定自动算法。
- `content/学习路线.md`：范围、顺序、排除项与后续深化事项。

原始PDF、全部页文本、分册哈希盘点和本轮编写底稿留 `_src/`，不提交、不发布。分册共31份PDF，按文件哈希去重25份，另98份DOCX；盘点不等于每份文档已经逐字消化。当前课程并非1832页全部细则的最终定稿，原图、异文及更多非奇门高级案例须持续深化。

## 构建与检查

```sh
/Users/xiaojin/.homebrew/bin/python3 build_course.py
/Users/xiaojin/.homebrew/bin/python3 audit_course.py
/Users/xiaojin/.homebrew/bin/python3 audit_rules.py
NODE_PATH=../bazi-course/node_modules node tests_check.js
NODE_PATH=../bazi-course/node_modules node tests_course.js
NODE_PATH=../bazi-course/node_modules node tests_course_notes.js
node tests_course_sw.js
NODE_PATH=../bazi-course/node_modules node tests_review.js
```

`build_course.py` 用标准库生成 `data-course.js`、精确到山的 `data-mountain.js` 和可下载的 `course-textbook.md`，不要直接改产物。`audit_course.py` 有本地 `_src/pages.json` 时逐页核引文与原表；无源时明确报告不能执行该层。

章末题只考资料明确规则及给足输入的局部应用。手算练习标明是演算，不冒充原课真实个案。争议处不设唯一答案。答案不应持续成为最长选项。

## 进度与全科笔记本

课程存储统一用 `zeri_` 前缀，已进入易术堂既有备份和进度镜像的采集范围：

- `zeri_course_v1`：手动已读、最近章节。
- `zeri_course_answers_v1`：章末题客观作答。
- `zeri_course_positions_v1`：阅读位置。

课程支持导出及导入学习记录；导入合并既有已读与作答记录。初始化先等待共享guard的镜像恢复。

全科笔记仍用共享 `ygn_v1`，不另建笔记本。`YGN_HOOK` 保存课程ID及实际小节；返回时先展开折叠小节，再由共享模块按文本指纹定位。原表保存山名，能回对应坐山。旧速查页能转接课程笔记来源，课程页也能返回旧知识卡来源。

课程CORE资源与共享笔记/阅读模块分别预缓存，共享资源失败不妨碍核心缓存安装。清缓存仅处理 `zeri-` 自身版本，不清其他科目。线上更新需提升 `sw.js` 缓存版本。

## 本轮验证范围

已执行结构、页序与短引核对、盘面月时干配对、逐山文本保真、真实共享笔记模块联调、课程路由与作答、SW离线回落回归。已用独立无头Chrome检查360/390/768/1280宽度及150%页面缩放，16种组合无页面横向溢出，并查看手机与桌面截图。详情见[复查报告](复查报告.md)；不冒称实体手机验收。


2026-11-19逐章改写复核已覆盖第1—34章；8个小节标题与题目ID保持。见[逐章复核记录](逐章复核记录.md)与[题目复核问题清单](题目复核问题清单.md)。本轮160题JSON未改，保留5处范围、术语或回查位置待处理；SW为v21。
