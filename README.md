# service-monitor

Web Service monitor by Node.js

## 该项目创建过程思路
### 初始化文件目录
```bash
# 创建 src、test 目录
mkdir src
mkdir test
# 创建 package.json
npm init
# 引入 eslint
npm install eslint --save-dev
./node_modules/.bin/eslint --init
# ✔ How would you like to use ESLint? · style
# ✔ What type of modules does your project use? · commonjs
# ✔ Which framework does your project use? · none
# ✔ Does your project use TypeScript? · No / Yes
# ✔ Where does your code run? · browser
# ✔ How would you like to define a style for your project? · guide
# ✔ Which style guide do you want to follow? · airbnb
# ✔ What format do you want your config file to be in? · JavaScript
# Checking peerDependencies of eslint-config-airbnb-base@latest
# The config that you've selected requires the following dependencies:
```

安装了 eslint，为什么还需要装 prettier 呢？

- EditorConfig: 跨编辑器和 IDE 编写代码，保持一致的简单编码风格；
- Prettier: 专注于代码格式化的工具，美化代码；
- ESLint：作代码质量检测、编码风格约束等；

参考: [eslint 保存自动修复\_代码规范之理解 ESLint、Prettier、EditorConfig](https://blog.csdn.net/weixin_39860260/article/details/112362260)

比如可以使用 prettier 来强制末尾不加分号(semi)，仅能使用单引号，间隔使用两个空格等

```js
const a = 1;

function abc() {
  let b = 1;
  console.log("sdfsdf");
  console.log("sdfsdf");
}

abc();

let b = 1;
```

引入 prettier

```bash
npm install prettier --save-dev
# 使用 prettier 修复 npx prettier --write .
# 它关闭所有不必要的或可能与Prettier冲突的ESLint规则
npm install eslint-config-prettier --save-dev
touch .prettierrc.js # 写入一些 prettier 规则
# .eslintrc.js 中配置插件 extends: ['plugin:prettier/recommended'],
npm install eslint-plugin-prettier --save-dev
# 这样 eslint + pritter 就生效了
```

Prettier ESLint (and other linters)

If you use ESLint, install eslint-config-prettier to make ESLint and Prettier play nice with each other. It turns off all ESLint rules that are unnecessary or might conflict with Prettier. There’s a similar config for Stylelint: stylelint-config-prettier

如果使用ESLint，请安装eslint-config- prettier，以使ESLint和Prettier相互配合。它关闭所有不必要的或可能与Prettier冲突的ESLint规则。Stylelint有一个类似的配置：stylelint-config-prettier

(See Prettier vs. Linters to learn more about formatting vs linting, Integrating with Linters for more in-depth information on configuring your linters, and Related projects for even more integration possibilities, if needed.)


[Prettier vs. Linters](https://prettier.io/docs/en/comparison.html)
How does it compare to ESLint/TSLint/stylelint, etc.?
Linters have two categories of rules:

Formatting rules: eg: max-len, no-mixed-spaces-and-tabs, keyword-spacing, comma-style…

Prettier alleviates the need for this whole category of rules! Prettier is going to reprint the entire program from scratch in a consistent way, so it’s not possible for the programmer to make a mistake there anymore :)

Code-quality rules: eg no-unused-vars, no-extra-bind, no-implicit-globals, prefer-promise-reject-errors…

Prettier does nothing to help with those kind of rules. They are also the most important ones provided by linters as they are likely to catch real bugs with your code!

In other words, use **Prettier for formatting** and **linters for catching bugs!**

### 开始写代码
我们想要封装一个库，来实现这个功能。首先写一个使用示例

```js
const ServiceMonitor = require('../src/index')

const serviceMonitor = new ServiceMonitor({
  interval: 10, // 循环间隔，默认 10 分钟
  // 邮件配置
})

// 添加测试接口
serviceMonitor.use()

// 添加测试网站
serviceMonitor.use()

// 开始监听测试，如果发现错误发送邮件
serviceMonitor.monitor()
```
想要达到的效果是：
1. 每天测试该接口或服务是否正常，如果异常则发送邮件提示
2. 为确保监听服务是在跑着的，而且很稳定，每天早、中、晚发送服务正常报告邮件。
3. 可以通过网页，在线实时测试服务是否正常。可以看到当前监听的服务、测试结果等。


### 核心思路
测试方法
- 测试接口，发送 http 请求，比对结果
- 测试网页是否可访问，发送 GET 请求，比对返回文本是否匹配

结果收集上报
- 为了方便查看结果，由于需要可以把所有测试结果上报（发邮件）或显示在页面上
- 由于请求都是异步的，需要都使用 Promise 封装。待全部测试完成后，resolve 对应的结果。如果超时，reject 并返回部分结果。
