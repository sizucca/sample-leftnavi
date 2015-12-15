$(function(){
  // ------------------------------------------------------------
  // 左ナビゲーション
  // ------------------------------------------------------------
  var Leftnavi = function(){
    this.init();
  };

  // ------------------------------
  // init
  // ------------------------------
  Leftnavi.prototype.init = function(){
    this.isHtmlScroll          = this._checkHtmlScroll();
    this.isDeviceTablet        = this._checkDeviceTablet();

    this.scrollbarWidth        = window.innerWidth - $(window).outerWidth(true);
    this.globalHeaderHeight    = Math.ceil($('#js-global-header').outerHeight()) + 9; // 9px はサイドバー茶色の淵
    this.searchBoxHeight       = Math.ceil($('#js-global-header-search').outerHeight());

    this.BALLOON_OPEN_STATE    = 'is-open';
    this.BALLOON_CLOSE_STATE   = 'is-close';
    this.BODY_NOSCROLL_STATE   = 'is-no-scroll';
    this.PANEL_ACTIVE_STATE    = 'is-active';
    this.BALLOON_PADDING       = 40;
    this.DISPLAY_MARGIN_BOTTOM = 20;
  };

  // ------------------------------
  // タブレットか否か
  // ------------------------------
  Leftnavi.prototype._checkDeviceTablet = function(){
    var ua = navigator.userAgent.toLowerCase();
    if(ua.indexOf('iphone') > 0 ||
      ua.indexOf('ipad') > 0 ||
      ua.indexOf('ipod') > 0 ||
      (ua.indexOf('android') > 0 && ua.indexOf('mobile') > 0)){

      return true;
    }
    else{
      return false;
    }
  };

  // ------------------------------
  // scrollTop に html が使えるか否か
  // ------------------------------
  Leftnavi.prototype._checkHtmlScroll = function(){
    var $html   = $('html');
    var htmlTop = $html.scrollTop();
    var dom     = $('<div>').height(10000).appendTo('body');
    var result  = false;

    // 動くかどうかテスト
    $html.scrollTop(10000);
    result = !!$html.scrollTop();

    // 判定後は、scrollTopの位置を戻して判定に使ったDOMを削除
    $html.scrollTop(htmlTop);
    dom.remove();

    return result;
  };

  // ------------------------------
  // ドリルダウンのセレクタ
  // ------------------------------
  // #js-leftnavi-area-trigger
  // #js-leftnavi-area-anchor
  // #js-leftnavi-area-targets
  // #js-leftnavi-area-balloon
  // #js-leftnavi-area-scroll
  // #js-leftnavi-area-tabs
  // #js-leftnavi-area-panels
  // ------------------------------
  Leftnavi.prototype.drillSelectors = function(name){
    var selectors = {
      trigger: '#js-leftnavi-' + name + '-trigger',
      anchor:  '#js-leftnavi-' + name + '-anchor',
      targets: '#js-leftnavi-' + name + '-targets',
      balloon: '#js-leftnavi-' + name + '-balloon',
      scroll:  '#js-leftnavi-' + name + '-scroll',
      tabs:    '#js-leftnavi-' + name + '-tabs',
      panels:  '#js-leftnavi-' + name + '-panels'
    };
    return selectors;
  };

  // ------------------------------
  // ドリルダウンのオブジェクト
  // ------------------------------
  Leftnavi.prototype.$drillObjects = function(name){
    var objects = {
      trigger: $(this.drillSelectors(name).trigger),
      anchor:  $(this.drillSelectors(name).anchor),
      targets: $(this.drillSelectors(name).targets),
      balloon: $(this.drillSelectors(name).balloon),
      scroll:  $(this.drillSelectors(name).scroll),
      tabs:    $(this.drillSelectors(name).tabs),
      panels:  $(this.drillSelectors(name).panels)
    };
    return objects;
  };

  // ------------------------------
  // ヘッダー領域の高さを計算
  // ------------------------------
  Leftnavi.prototype.getDisplayMarginTop = function(arg, self){
    var height = 0;

    if(arg.scrollTop > self.globalHeaderHeight){
      height = self.searchBoxHeight + self.DISPLAY_MARGIN_BOTTOM;
    }
    else {
      height = self.globalHeaderHeight;
    }
    return Math.ceil(height);
  };

  // ------------------------------
  // 表示領域の高さを計算
  // ------------------------------
  Leftnavi.prototype.getDisplayHeight = function(arg, self){
    var height = arg.windowHeight - (arg.displayMarginTop + self.DISPLAY_MARGIN_BOTTOM);
    return Math.ceil(height);
  };

  // ------------------------------
  // バルーンの高さを計算
  // ------------------------------
  Leftnavi.prototype.getBalloonDisplayHeight = function(arg, leftnavi){
    var height = 0;

    if(arg.displayHeight < leftnavi.balloonHeight){
      height = arg.displayHeight;
    }
    else{
      height = leftnavi.balloonHeight;
    }
    return Math.ceil(height);
  };

  // ------------------------------
  // スクロールバーの可否
  // ------------------------------
  Leftnavi.prototype.getBalloonScrollbarNeed = function(arg, leftnavi, self){
    var scrollbar = false;
    if(leftnavi.balloonHeight > arg.displayHeight){
      scrollbar = true;
    }

    // 隠れタブコンテンツがある場合は、すべてのタブコンテンツの高さをチェック
    else if(leftnavi.$obj.tabs.length){
      var panelFirstHeight = 0;
      var panelMaxHeight   = 0;

      leftnavi.$obj.panels.find('.js-leftnavi-panel').each(function(index, elm){
        if($(elm).hasClass(self.PANEL_ACTIVE_STATE)){
          panelFirstHeight = $(elm).outerHeight();
        }
        if($(elm).outerHeight() > panelMaxHeight){
          panelMaxHeight = $(elm).outerHeight();
        }
      });
      // 隠れタブのコンテンツのMaxの高さが画面に収まらない場合、スクロールバーを表示
      if ((leftnavi.balloonHeight - panelFirstHeight + panelMaxHeight) > arg.displayHeight){
        scrollbar = true;
      }
    }

    else{
      scrollbar = false;
    }
    return scrollbar;
  };

  // ------------------------------
  // バルーンの位置を変更
  // ------------------------------
  Leftnavi.prototype.addBalloonTop = function(arg, leftnavi){
    var top = Math.ceil(leftnavi.balloonTop - arg.scrollTop - arg.displayMarginTop);
    var hiddenHeight = 0;

    if(arg.displayHeight - top < arg.balloonDisplayHeight){
      hiddenHeight = arg.displayHeight - (top + arg.balloonDisplayHeight);
    }
    leftnavi.$obj.balloon.css({marginTop: hiddenHeight});
  };

  // ------------------------------
  // スクロールバーを付与（ jquery.mCustomScrollbar 使用）
  // ------------------------------
  Leftnavi.prototype.addScrollber = function(arg, leftnavi, self){
    var height = 0;
    if(arg.scrollbarNeed){
      height = arg.scrollbarHeight - self.BALLOON_PADDING;

      leftnavi.$obj.scroll.mCustomScrollbar({
        set_height: height,
        theme: 'tb',
        scrollInertia: 100,
        contentTouchScroll: true,
        advanced: {
          updateOnContentResize: true,
          autoExpandHorizontalScroll: true
        }
      });
    }
  };

  // ------------------------------
  // スクロールバーを削除（ jquery.mCustomScrollbar 使用）
  // ------------------------------
  Leftnavi.prototype.destroyScrollber = function(leftnavi){
    leftnavi.$obj.scroll.mCustomScrollbar('destroy');
    leftnavi.$obj.scroll.css({height: 'auto'});
  };

  // ------------------------------
  // バルーンの起点が画面外の場合、画面内に移動
  // ------------------------------
  Leftnavi.prototype.moveBalloonStart = function(leftnavi, self){
    if(leftnavi.triggerTop < scrollTop + displayMarginTop){
      $(self.isHtmlScroll ? 'html' : 'body').animate({
        scrollTop: leftnavi.triggerTop - displayMarginTop
      }, 200);
    }
    else if(leftnavi.triggerBottom > scrollTop + windowHeight){
      $(self.isHtmlScroll ? 'html' : 'body').animate({
        scrollTop: leftnavi.triggerBottom - windowHeight + self.searchBoxHeight
      }, 200);
    }
  };

  // ------------------------------
  // バルーン開閉
  // ------------------------------
  Leftnavi.prototype.toggleBalloon = function(leftnavi, self){
    var mouseenterTimer = false;
    var mouseleaveTimer = false;

    // タブレットの場合
    if(self.isDeviceTablet){
      $(document).on('click', function(elm){
        if(!leftnavi.$obj.targets.hasClass(self.BALLOON_OPEN_STATE) &&
          $(elm.target).closest(leftnavi.selector.anchor).length){

          self.moveBalloonStart(leftnavi, self);
          leftnavi.$obj.targets.addClass(self.BALLOON_OPEN_STATE);
          return false;
        }
      });
      $(document).on('touchend', function(elm){
        if(leftnavi.$obj.targets.hasClass(self.BALLOON_OPEN_STATE) &&
          !$(elm.target).closest(leftnavi.selector.targets).length){

          leftnavi.$obj.targets.removeClass(self.BALLOON_OPEN_STATE);
          return false;
        }
      });
    }

    // タブレット以外の場合（PC）
    else{
      leftnavi.$obj.trigger.on({
        'mouseenter.hover': function(){
          $('body').addClass(self.BODY_NOSCROLL_STATE).css({'margin-right': self.scrollbarWidth});
          mouseenterTimer = setTimeout(function(){
            self.moveBalloonStart(leftnavi, self);
            leftnavi.$obj.targets.addClass(self.BALLOON_OPEN_STATE).removeClass(self.BALLOON_CLOSE_STATE);
          }, 150);
          clearTimeout(mouseleaveTimer);
        },
        'mouseleave.hover': function(){
          $('body').removeClass(self.BODY_NOSCROLL_STATE).css({'margin-right': 0});
          mouseleaveTimer = setTimeout(function(){
            leftnavi.$obj.targets.addClass(self.BALLOON_CLOSE_STATE).removeClass(self.BALLOON_OPEN_STATE);
          }, 200);
          clearTimeout(mouseenterTimer);
        }
      });
      leftnavi.$obj.anchor.on('click', function(){
        return false;
      });
    }
  };

  // ------------------------------
  // スクロール処理
  // ------------------------------
  Leftnavi.prototype.onScrollWindow = function(arg, argLeftnavis, self){
    var scrollTimer  = false;
    var length       = argLeftnavis.length;
    var preMarginTop = arg.preMarginTop;

    $(window).on('load scroll', function(){
      if(scrollTimer !== false){
        clearTimeout(scrollTimer);
      }
      scrollTimer = setTimeout(function(){

        // スクロールが終わったら、現在地からヘッダー領域の高さを判断
        scrollTop = $(window).scrollTop();
        displayMarginTop = self.getDisplayMarginTop({
          scrollTop: scrollTop
        }, self);

        // ヘッダー領域の高さが変わっていたら、バルーンの高さを再計算
        if(displayMarginTop !== preMarginTop){
          preMarginTop = displayMarginTop;

          // 表示領域の高さ
          displayHeight = self.getDisplayHeight({
            windowHeight:     windowHeight,
            displayMarginTop: displayMarginTop
          }, self);

          // バルーンの高さを計算
          for(var i = 0; i < length; i++){
            if(argLeftnavis[i].$obj.trigger.length){

              // スクロールバーを削除
              self.destroyScrollber(argLeftnavis[i]);

              // バルーンの高さを計算
              argLeftnavis[i].balloonHeight = argLeftnavis[i].$obj.balloon.outerHeight();
              balloonDisplayHeight = self.getBalloonDisplayHeight({
                displayHeight: displayHeight
              }, argLeftnavis[i]);

              // スクロールバーが必要か不要か判断
              scrollbarNeed = self.getBalloonScrollbarNeed({
                displayHeight: displayHeight
              }, argLeftnavis[i], self);

              // スクロールバーを付与
              self.addScrollber({
                scrollbarNeed:  scrollbarNeed,
                scrollbarHeight: balloonDisplayHeight
              }, argLeftnavis[i], self);
            }
          }
        }

        // 位置を変更
        for(var j = 0; j < length; j++){
          if(argLeftnavis[j].$obj.trigger.length){
            self.addBalloonTop({
              scrollTop:            scrollTop,
              displayMarginTop:     displayMarginTop,
              displayHeight:        displayHeight,
              balloonDisplayHeight: balloonDisplayHeight
            }, argLeftnavis[j]);
          }
        }

      }, 500);
    });
  };

  // ------------------------------
  // リサイズ処理
  // ------------------------------
  Leftnavi.prototype.onResizeWindow = function(arg, argLeftnavis, self){
    var resizeTimer     = false;
    var length          = argLeftnavis.length;
    var preWindowHeight = arg.preWindowHeight;

    $(window).on('resize', function() {
      if(resizeTimer !== false){
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(function(){

        // リサイズが終わったら、高さを再取得
        windowHeight = window.innerHeight ? window.innerHeight : $(window).height();

        // Windowの高さが変わっていたら、バルーンの位置と高さを再計算
        if(windowHeight !== preWindowHeight){
          preWindowHeight = windowHeight;

          // 表示領域の高さ
          displayHeight = self.getDisplayHeight({
            windowHeight:     windowHeight,
            displayMarginTop: displayMarginTop
          }, self);

          // バルーンの高さを計算
          for(var i = 0; i < length; i++){
            if(argLeftnavis[i].$obj.trigger.length){

              // スクロールバーを削除
              self.destroyScrollber(argLeftnavis[i]);

              // バルーンの高さを計算
              argLeftnavis[i].balloonHeight = argLeftnavis[i].$obj.balloon.outerHeight();
              balloonDisplayHeight = self.getBalloonDisplayHeight({
                displayHeight: displayHeight
              }, argLeftnavis[i]);

              // スクロールバーが必要か不要か判断
              scrollbarNeed = self.getBalloonScrollbarNeed({
                displayHeight: displayHeight
              }, argLeftnavis[i], self);

              // スクロールバーを付与
              self.addScrollber({
                scrollbarNeed:  scrollbarNeed,
                scrollbarHeight: balloonDisplayHeight
              }, argLeftnavis[i], self);
            }
          }

          // 位置を変更
          for(var j = 0; j < length; j++){
            if(argLeftnavis[j].$obj.trigger.length){
              self.addBalloonTop({
                scrollTop:            scrollTop,
                displayMarginTop:     displayMarginTop,
                displayHeight:        displayHeight,
                balloonDisplayHeight: balloonDisplayHeight
              }, argLeftnavis[j]);
            }
          }
        }

      }, 500);
    });
  };

  // ------------------------------
  // 実行
  // ------------------------------
  var list = new Leftnavi();

  // バルーンのオブジェクト
  var leftnavis = [
    {
      id:   'area',
      $obj: list.$drillObjects('area')
    },
    {
      id:   'genre',
      $obj: list.$drillObjects('genre')
    }
  ];

  // スクロールの位置
  var scrollTop = $(window).scrollTop();

  // ブラウザの高さ
  var windowHeight = window.innerHeight ? window.innerHeight : $(window).height();

  // ヘッダー領域の高さ
  var displayMarginTop = list.getDisplayMarginTop({
    scrollTop: scrollTop
  }, list);

  // 表示領域の高さ
  var displayHeight = list.getDisplayHeight({
    windowHeight:     windowHeight,
    displayMarginTop: displayMarginTop
  }, list);

  // バルーン毎の処理
  for(var i = 0, len = leftnavis.length; i < len; i++){
    if(leftnavis[i].$obj.trigger.length && leftnavis[i].$obj.balloon.length){

      // trigger
      leftnavis[i].triggerTop    = leftnavis[i].$obj.trigger.offset().top;
      leftnavis[i].triggerBottom = leftnavis[i].triggerTop + leftnavis[i].$obj.trigger.outerHeight();

      // selector
      leftnavis[i].selector = list.drillSelectors(leftnavis[i].id);

      // バルーンの高さを取得
      leftnavis[i].balloonHeight = leftnavis[i].$obj.targets.outerHeight();
      var balloonDisplayHeight = list.getBalloonDisplayHeight({
        displayHeight: displayHeight
      }, leftnavis[i]);

      // スクロールバーが必要か不要か判断
      var scrollbarNeed = list.getBalloonScrollbarNeed({
        displayHeight: displayHeight
      }, leftnavis[i], list);

      // スクロールバーを付与
      list.addScrollber({
        scrollbarNeed:  scrollbarNeed,
        scrollbarHeight: balloonDisplayHeight
      }, leftnavis[i], list);

      // バルーンの位置を計算して付与
      leftnavis[i].balloonTop = leftnavis[i].$obj.balloon.offset().top;
      list.addBalloonTop({
        scrollTop:            scrollTop,
        displayMarginTop:     displayMarginTop,
        displayHeight:        displayHeight,
        balloonDisplayHeight: balloonDisplayHeight
      }, leftnavis[i]);

      // バルーンの開閉イベント付与
      list.toggleBalloon(leftnavis[i], list);
    }
  }

  // スクロール処理
  list.onScrollWindow({
    preMarginTop:  displayMarginTop
  }, leftnavis, list);

  // リサイズ処理
  list.onResizeWindow({
    preWindowHeight:  windowHeight
  }, leftnavis, list);

});
