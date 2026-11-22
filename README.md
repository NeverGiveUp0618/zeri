# 择日题库

现站只提供原教材配套做题，不以自编课程为学习主线。入口保持 https://nevergiveup0618.github.io/zeri/ 。

## 做题方式

- 按《择日合集》内原教材、原课时与知识点分类；目前327题、58个有题原章节。
- 每次一题、四选一，答后保留解析，手动下一题；每题可回对应原页，返回不丢题。
- 每组10/20/40题；数量不足按实际出题，不重复凑数。章节练顺序为未做→上次错→最久没练；综合随机混练；学新题按原教材章节顺序推进。
- 答错自动入错题本，可按教材、章节筛选，单题重练或整组重练。本组末尾回炉一次，不重复计入首答成绩。错题连续两个独立组首答正确后转已订正，或由使用者手动切换；历史不删除。
- 支持今日到期复习、做题记录、刷新断点、键盘1—4选项及答后Enter/右箭头下一题。原页放大只在图片容器内滚动。
- 同一全科笔记本可保存解析并回出处。阅读与笔记按钮移入页头，不覆盖题面和答案。

## 内容与构建

- `question-bank/questions.json`：题目源。稳定ID与rev，包含原教材/章节、考点、页码、正解、三个干扰项、解析、原文短依据。
- `question-bank/sources.json`：原课程目录，章ID由原课起始页稳定命名。不用旧34章为原教材章节。
- `question-bank/出题规范.md`：用户的八字日练出题规则在择日题库的执行约束。
- `question-bank/data.js`：构建产物，勿手改。`core.js`管组题、判分、回炉、复习和稳定ID；`app.js`管视图与共享笔记。
- `question-bank/pages/`：147张实际引用原页，1500像素宽WebP；仅查看时加载，浏览过的页面可缓存离线。未上传125.6MB整份PDF或_src文字层。
- `question-bank/page-assets.json`：原页素材尺寸与哈希。

```sh
/Users/xiaojin/.homebrew/bin/python3 build_question_bank.py
/Users/xiaojin/.homebrew/bin/python3 audit_question_bank.py
NODE_PATH=../bazi-course/node_modules node tests_question_bank.js
node tests_question_sw.js
```

有本地`_src/pages.json`时，构建与审计核每题短依据；无源时审计明确说明跳过，不伪称通过。重做原页素材：`build_question_pages.py /绝对路径/原合集.pdf`，需PyMuPDF与Pillow。不按浏览器端数据反写题目JSON，不通过数组下标识别错题，不用自动截断答案消除长度提示。

当前覆盖与未收部分、原文误排、核验结果见[题库复核记录](题库复核记录.md)。没有将全部1832页都编成题；原文争议不设唯一答案。

## 记录与旧站接续

新题库只写`zeri_qbank_v1`，保存按题ID的首答统计、错题、到期、组记录及未完断点；`zeri_`前缀仍在既有guard镜像采集范围。初始化等待镜像恢复，不清旧键，不擅自把旧题作答映射为新题成绩。全科笔记仍用`ygn_v1`。

旧34章、16项目、160题及全部原课程源码保留，旧笔记可由钩子打开`archive-course.html`回原章；主站不列旧课程或速查入口。完整旧站恢复点为`bb63fe6`，本地分支`archive/course-20261121`；详见[旧站接续说明](旧站接续说明.md)。旧课程回归脚本保留供历史维护，不作为本轮新入口的验收脚本。

SW为`zeri-v32-question-bank`，只预缓存新题库核心及可选共享模块；只删除`zeri-`旧缓存，不删个人记录或其他科目缓存。内容或脚本变化必须继续升缓存版本。
