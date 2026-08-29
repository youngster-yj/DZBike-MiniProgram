export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/store/menu/index',
    'pages/store/list/index',
    'pages/store/detail/index',
    'pages/activity/menu/index',
    'pages/activity/bike/index',
    'pages/activity/shop/index',
    'pages/activity/collect/index',
    'pages/mine/index',
    'pages/mine/joins/index',
    'pages/mine/favorites/index',
    'pages/complaint/index',
    'pages/map/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '\u8fbe\u5dde\u81ea\u884c\u8f66\u4ff1\u4e50\u90e8',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f1f5f9',
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#3182ce',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '\u9996\u9875',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/store/menu/index',
        text: '\u5546\u54c1',
        iconPath: 'assets/tabbar/goods.png',
        selectedIconPath: 'assets/tabbar/goods-active.png',
      },
      {
        pagePath: 'pages/activity/menu/index',
        text: '\u6d3b\u52a8',
        iconPath: 'assets/tabbar/activity.png',
        selectedIconPath: 'assets/tabbar/activity-active.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '\u6211\u7684',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-active.png',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '\u7528\u4e8e\u5c55\u793a\u95e8\u5e97\u4f4d\u7f6e\u5e76\u63d0\u4f9b\u5bfc\u822a\u670d\u52a1',
    },
    'scope.writePhotosAlbum': {
      desc: '\u7528\u4e8e\u4fdd\u5b58\u5206\u4eab\u6d77\u62a5\u5230\u76f8\u518c',
    },
  },
  requiredPrivateInfos: ['getLocation', 'chooseLocation'],
});
