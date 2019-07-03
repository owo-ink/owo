/* 方法合集 */
var _owo = {
  /* 对象合并方法 */
  assign: function(a, b) {
    var newObj = {}
    for (var key in a){
      newObj[key] = a[key]
    }
    for (var key in b){
      newObj[key] = b[key]
    }
    return newObj
  },
  /* 运行页面初始化方法 */
  runCreated: function (pageFunction, entryDom) {
    pageFunction.created.apply(_owo.assign(pageFunction, {
      $el: entryDom,
      data: pageFunction.data,
      activePage: window.owo.activePage
    }))
  },
  /* 注册事件监听 */
  registerEvent: function (pageFunction, entryDom) {
    // 判断是否包含事件监听
    if (pageFunction.event) {
      if (!window.owo.state.event) window.owo.state.event = {}
      for (const iterator in pageFunction.event) {
        if (!window.owo.state.event[iterator]) window.owo.state.event[iterator] = []
        window.owo.state.event[iterator].push({
          dom: entryDom,
          pageName: window.owo.activePage,
          fun: pageFunction.event[iterator],
          script: pageFunction
        })
      }
    }
  }
}


if (!document.getElementsByClassName) {
  /* 解决低版本浏览器没有getElementsByClassName的问题 */
  document.getElementsByClassName = function (className, element) {
    var children = (element || document).getElementsByTagName('*');
    var elements = new Array();
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var classNames = child.className.split(' ');
      for (var j = 0; j < classNames.length; j++) {
        if (classNames[j] == className) {
          elements.push(child);
          break;
        }
      }
    }
    return elements;
  };
}

/* 运行页面所属的方法 */
_owo.handlePage = function (pageName, entryDom) {
  _owo.handleEvent(entryDom, null , entryDom)
  /* 判断页面是否有自己的方法 */
  var newPageFunction = window.owo.script[pageName]
  if (!newPageFunction) return
  // console.log(newPageFunction)
  // 如果有created方法则执行
  if (newPageFunction.created) {
    _owo.runCreated(newPageFunction, entryDom)
  }

  // 注册事件监听
  _owo.registerEvent(newPageFunction, entryDom)
  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    if (templateScript.created) {
      // 获取到当前配置页的DOM
      // 待修复,临时获取方式,这种方式获取到的dom不准确
      var domList = document.querySelectorAll('[template="' + key +'"]')
      // 有时候在更改html时会将某些块进行删除
      if (domList.length == 0) {
        console.info('无法找到页面组件:' + key)
      }
      // console.log(domList.length)
      for (var ind = 0; ind < domList.length; ind++) {
        _owo.runCreated(templateScript, domList[ind])
        
        // 注册事件监听
        _owo.registerEvent(templateScript, domList[ind])
      }
    }
    
  }
}

/* owo事件处理 */
// 参数1: 当前正在处理的dom节点
// 参数2: 当前正在处理的模块名称
// 参数3: 当前正在处理的模块根dom
_owo.handleEvent = function (tempDom, templateName, entryDom) {
  var activePage = window.owo.script[owo.activePage]
  
  if (tempDom.attributes) {
    for (let ind = 0; ind < tempDom.attributes.length; ind++) {
      var attribute = tempDom.attributes[ind]
      // 判断是否为owo的事件
      // ie不支持startsWith
      if (attribute.name[0] == '@') {
        var eventName = attribute.name.slice(1)
        var eventFor = attribute.textContent
        switch (eventName) {
          case 'show' : {
            // 初步先简单处理吧
            var temp = eventFor.replace(/ /g, '')
            // 取出条件
            var condition = temp.split("==")
            if (activePage.data[condition[0]] != condition[1]) {
              tempDom.style.display = 'none'
            }
            break
          }
          default: {
            // 处理事件 使用bind防止闭包
            tempDom["on" + eventName] = function(event) {
              // 判断页面是否有自己的方法
              var newPageFunction = window.owo.script[window.owo.activePage]
              // console.log(this.attributes)
              if (this.templateName !== owo.activePage) {
                // 如果模板注册到newPageFunction中，那么证明模板没有script那么直接使用eval执行
                if (newPageFunction.template) {
                  newPageFunction = newPageFunction.template[this.templateName]
                }
              }
              // 待优化可以单独提出来
              // 取出参数
              var parameterArr = []
              var parameterList = this.eventFor.match(/[^\(\)]+(?=\))/g)
              
              if (parameterList && parameterList.length > 0) {
                // 参数列表
                parameterArr = parameterList[0].split(',')
                // 进一步处理参数
                
                for (var i = 0; i < parameterArr.length; i++) {
                  var parameterValue = parameterArr[i].replace(/(^\s*)|(\s*$)/g, "")
                  // console.log(parameterValue)
                  // 判断参数是否为一个字符串
                  
                  if (parameterValue.charAt(0) === '"' && parameterValue.charAt(parameterValue.length - 1) === '"') {
                    parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1)
                  }
                  if (parameterValue.charAt(0) === "'" && parameterValue.charAt(parameterValue.length - 1) === "'") {
                    parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1)
                  }
                  // console.log(parameterArr[i])
                }
                this.eventFor = this.eventFor.replace('(' + parameterList + ')', '')
              } else {
                // 解决 @click="xxx()"会造成的问题
                this.eventFor = this.eventFor.replace('()', '')
              }
              // console.log(newPageFunction)
              // 如果有方法,则运行它
              if (newPageFunction[this.eventFor]) {
                // 绑定window.owo对象
                // console.log(tempDom)
                // 待测试不知道这样合并会不会对其它地方造成影响
                newPageFunction.$el = this.entryDom
                newPageFunction.$event = event
                newPageFunction[this.eventFor].apply(newPageFunction, parameterArr)
              } else {
                // 如果没有此方法则交给浏览器引擎尝试运行
                eval(this.eventFor)
              }
            }.bind({
              eventFor,
              templateName,
              entryDom,
              tempDom
            })
          }
        }
      }
    }
  }
  
  // 判断是否有子节点需要处理
  if (tempDom.children) {
    // 递归处理所有子Dom结点
    for (var i = 0; i < tempDom.children.length; i++) {
      // 获取子节点实例
      var childrenDom = tempDom.children[i]

      // 每个子节点均要判断是否为模块
      if (childrenDom.attributes['template'] && childrenDom.attributes['template'].textContent) {
        // 如果即将遍历进入模块 设置即将进入的模块为当前模块
        // 获取模块的模块名
        templateName = childrenDom.attributes['template'].textContent
        _owo.handleEvent(childrenDom, templateName, childrenDom)
      } else {
        _owo.handleEvent(childrenDom, templateName, entryDom)
      }
    }
  } else {
    console.info('元素不存在子节点!')
    console.info(tempDom)
  }
}