/** Rspress 构建期注入的环境变量（见 @rspress/core 内部对 import.meta.env 的使用） */
declare interface ImportMetaEnv {
  /** 为 llms.txt / SSG markdown 输出渲染页面时为 true */
  readonly SSG_MD?: boolean
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
