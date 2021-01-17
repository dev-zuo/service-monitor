# service-monitor

Node.js service monitor

## 创建过程

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
