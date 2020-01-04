
_owo.getarg = function (url) { // 获取URL #后面内容
  if (!url) return null
  var arg = url.split("#");
  return arg[1] ? arg[1].split('?')[0] : null
}

// 页面资源加载完毕事件
_owo.showPage = function() {
  owo.entry = document.querySelector('[template]').getAttribute('template')
  // 取出URL地址判断当前所在页面
  var pageArg = _owo.getarg(window.location.hash)
  /* if="this.config.route && this.config.route.startAtHome"
  if (pageArg !== null) {
    window.location.href = ''
    return
  }
  end */
  /* if="this.config.phoneEnter"
  // 手机进入特制页
  if (_owo.isMobi) {owo.entry = owo.phoneEnter}
  end */

  // 计算$dom
  for(var page in owo.script) {
    var idList = document.querySelectorAll('.owo[template="' + page + '"] [id]')
    owo.script[page].$dom = {}
    for (var ind = 0; ind < idList.length; ind++) {
      owo.script[page].$dom[idList[ind].getAttribute('id')] = idList[ind]
    }
  }

  // 从配置项中取出程序入口
  var page = pageArg ? pageArg : owo.entry
  if (page) {
    var entryDom = document.querySelector('.owo[template="' + page + '"]')
    if (!entryDom) {
      console.error('入口文件设置错误,错误值为: ', page)
      entryDom = document.querySelector('.owo')
      page = entryDom.getAttribute('template')
      window.location.replace('#' + page)
      return
    }
    // 显示主页面
    entryDom.style.display = 'block'
    window.owo.activePage = page
    _owo.handlePage(owo.script[page], entryDom)
    _owo.handleEvent(entryDom, owo.script[page])
    // 处理插件
    var plugList = document.getElementsByClassName('owo-plug')
    for (var ind = 0; ind < plugList.length; ind++) {
      var plugEL = plugList[ind]
      var plugName = plugEL.getAttribute('template')
      _owo.handlePage(owo.script[plugName], plugEL)
      _owo.handleEvent(plugEL, owo.script[plugName])
    }

    // 路由列表
    var viewList = entryDom.querySelectorAll('[view]')
    // 获取url参数
    owo.state.urlVariable = _owo.getQueryVariable()
    for (let index = 0; index < viewList.length; index++) {
      const viewItem = viewList[index];
      var viewName = viewItem.getAttribute('view')
      var viewValue = owo.state.urlVariable['view-' + viewName]
      console.log(viewValue)
      if (viewValue) {
        _owo.showViewName(viewItem, viewValue)
      } else {
        _owo.showViewIndex(viewItem, 0)
      }
    }
    
  } else {
    console.error('未设置程序入口!')
  }
  /* if="this.config.pageList.find(function(element) {return element.isPlug;})"
  for (var key in owo.script) {
    if (owo.script[key].type == 'plug') {
      owo.script[key].$el = document.querySelector('.owo-plug[template="' + key + '"]')
      _owo.runCreated(owo.script[key])
    }
  }
  end */
  // 设置当前页面为活跃页面
  owo.state.newUrlParam = _owo.getarg(document.URL)
}

/*
  页面跳转方法
  参数1: 需要跳转到页面名字
  参数2: 离开页面动画
  参数3: 进入页面动画
*/
owo.go = function (pageName, inAnimation, outAnimation, backInAnimation, backOutAnimation, noBack, param) {
  // console.log(owo.script[pageName])
  if (!owo.script[pageName]) {
    console.error("导航到不存在的页面: " + pageName)
    return
  }
  owo.script[pageName]._animation = {
    "in": inAnimation,
    "out": outAnimation,
    "forward": true
  }
  var paramString = ''
  if (param && typeof param == 'object') {
    paramString += '?'
    // 生成URL参数
    for (var paramKey in param) {
      paramString += paramKey + '=' + param[paramKey] + '&'
    }
    // 去掉尾端的&
    paramString = paramString.slice(0, -1)
  }
  // 如果有返回动画那么设置返回动画
  if (backInAnimation && backOutAnimation) {
    owo.script[owo.activePage]._animation = {
      "in": backInAnimation,
      "out": backOutAnimation,
      "forward": false
    }
  }
  if (noBack) {
    location.replace(paramString + "#" + pageName)
  } else {
    window.location.href = paramString + "#" + pageName
  }
}

// url发生改变事件
_owo.hashchange = function (e) {
  // 这样处理而不是直接用event中的URL，是因为需要兼容IE
  owo.state.oldUrlParam = owo.state.newUrlParam;
  owo.state.newUrlParam = _owo.getarg(document.URL); 
  // console.log(owo.state.oldUrlParam, owo.state.newUrlParam)
  // 如果旧页面不存在则为默认页面
  if (!owo.state.oldUrlParam) owo.state.oldUrlParam = owo.entry;
  var newUrlParam = owo.state.newUrlParam;

  // 如果没有跳转到任何页面则跳转到主页
  if (newUrlParam === undefined) {
    newUrlParam = owo.entry;
  }

  // 如果没有发生页面跳转则不需要进行操作
  // 进行页面切换
  switchPage(owo.state.oldUrlParam, newUrlParam);
}

// ios的QQ有BUG 无法触发onhashchange事件
if(/iPhone\sOS.*QQ[^B]/.test(navigator.userAgent)) {window.onpopstate = _owo.hashchange;} else {window.onhashchange = _owo.hashchange;}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)