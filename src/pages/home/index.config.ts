export default definePageConfig({
  navigationBarTitleText: '首页',
  // 需配合 index.tsx 里的 usePullDownRefresh，否则下拉会卡住
  enablePullDownRefresh: true,
});
