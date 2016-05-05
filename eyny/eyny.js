// ==UserScript==
// @name        eyny
// @namespace   diywork.info
// @description eynyOnly
// @version     1.0
// @grant       none
// @include     http://www*.eyny.com/forum*.html
// @include     http://www*.eyny.com/forum*.php
// ==/UserScript==

var myFun = {
   byId : function(Name,rootDoom) {
      if ('getElementById' in Object(rootDoom))
         return rootDoom.getElementById(Name);
      else
         return document.getElementById(Name); 
   },

   byTag : function(Name,rootDoom) {
      if ('getElementsByTagName' in Object(rootDoom))
         return rootDoom.getElementsByTagName(Name);
      else
	      return document.getElementsByTagName(Name); 
   },

   byClass : function(Name,rootDoom) {
      if ('getElementsByClassName' in Object(rootDoom))
         return rootDoom.getElementsByClassName(Name);
	   else
	      return document.getElementsByClassName(Name); 
   },

   byName : function(Name,rootDoom) {
      if ('getElementsByName' in Object(rootDoom))
         return rootDoom.getElementsByName(Name);
      else
         return document.getElementsByName(Name); 
   },

   toArray : function(iterable) {
      if (!iterable) return [];
      if ('toArray' in Object(iterable)) return iterable.toArray();
      var length = iterable.length || 0, results = new Array(length);
      while (length--) results[length] = iterable[length];
      return results;
   },

   isElement : function(o) {
      return (
               typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
               o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
      );
   },

   isNode : function(o) {
      return (
               typeof Node === "object" ? o instanceof Node : 
               o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
      );      
   },

   isCss : function(o) {
      return (
               typeof CSS2Properties === "function" ? o instanceof CSS2Properties :
               'getPropertyValue' in Object(o) && 'getPropertyCSSValue' in Object(o)
      );
       
   },

   getValue : function(o) {
      if ('value' in Object(o))
         return o.value;

      if (typeof(o) === 'string')
         return o;

      if (typeof(o) === 'number')
         return o;

      if (myFun.isElement(o))
         console.log("getValue get a Element");

      if (myFun.isNode(o))
         console.log("getValue get a Node");
      
      if (typeof(o) === "undefined")
         console.log("getValue get a undefined");   

      console.log(o);

      return o;
   },

   getCssProperty(obj, property) {
      if ( myFun.isElement(obj) ) {
         return window.getComputedStyle(obj,null).getPropertyValue(property);
      }else{
         return null;
      }      
   },

   iconClick : function(event) {
      try {
         var iconObj = event.target;
         //遮蓋螢幕
         if (myFun.isElement(myFun.transDiv)){
            myFun.transDiv.style.display = "inline";
         }
         myFun.showWait();
         
         myFun.linkIndex = iconObj.name.substring("showPopupContainer_".length,iconObj.name.length);
         var httpRequest = new XMLHttpRequest();
         var srcLink = myFun.linkArray[myFun.linkIndex][0];
         var docURL = document.URL.substr(0,document.URL.lastIndexOf("/"));
         if (docURL && srcLink.search(docURL) == -1) {
            if (docURL.endsWith("/"))
               srcLink = docURL + srcLink;
            else
               srcLink = docURL + "/" + srcLink;
         }
         console.log("goto:"+ srcLink);
         httpRequest.overrideMimeType('text/html');
         httpRequest.onreadystatechange = function() { 
                                             myFun.parser(httpRequest); 
                                       };
         httpRequest.open('GET', srcLink , false);
         httpRequest.send('');

         

      }catch(e){
         console.log("AJAX Fail:"+ e);
      }
    },

    parser : function(httpRequest) {
      if (httpRequest.readyState == 4) {
         if (httpRequest.status == 200) {
            try {
               //HTML Parser
               var doc = document.implementation.createHTMLDocument("eyny");
               doc.documentElement.innerHTML = httpRequest.responseText;
               //找出貼文串
               var postDIVList = myFun.byId("postlist",doc);
               var postDIVListlength = postDIVList.childNodes.length || 0;
               for (var ii= 0 ; ii< postDIVListlength ; ii++ ){
                  var postDIV = postDIVList.childNodes.item(ii);
                  if ( postDIV.nodeName === "DIV" ) {
                     //找出一樓貼文及id
                     var id = postDIV.id;
                     id = id.substr(id.lastIndexOf("_")+1,id.length);
                     //找出貼文的本文
                     var postContext = myFun.byId("postmessage_"+id,doc);
                     if (postContext) {
                        //本文的圖片
                        var imageArray = myFun.toArray(myFun.byTag("img",postContext));
                        myFun.imgArray = [];
                        for (var ii = 0 ; ii < imageArray.length ; ii++){

                           var attrib =   imageArray[ii].getAttributeNode("file")||
                                          imageArray[ii].getAttributeNode("src");
                           if ( typeof(attrib) !== "undefined" ) {
                              // 特定圖案不予列入
                              if (myFun.getValue(attrib).indexOf("torrent.gif") != -1 )
                                 continue;
                              if (myFun.getValue(attrib).indexOf("rar.gif") != -1 )
                                 continue;

                              var width = imageArray[ii].getAttributeNode("width")||
                                          imageArray[ii].width||
                                          imageArray[ii].innerWidth||
                                          "100"; //有些imgTag沒有加width耶, 偏偏又是大圖,只好改為100

                              if (width === "0" && myFun.isCss(imageArray[ii].style))
                                 width = myFun.getCssProperty(imageArray[ii] , "width" );

                              width = Number(myFun.getValue(width).replace(/[^-\d\.]/g,''));
                              if (attrib &&  width > 50) {
                                 myFun.imgArray.push(myFun.getValue(attrib));
                              }else{
                                 console.log("no" + ii +"parser Error, width < 50");
                                 console.log(imageArray[ii]);
                              }

                           }else{
                              console.log("no" + ii +"parser Error, attrib undefined");
                              console.log(imageArray[ii]);
                           }
                        }
                        if (myFun.imgArray && myFun.imgArray.length > 0) {
                           console.log("YA~找到圖片，ShowTime!!");
                           myFun.genImg();
                        }else{
                           console.log("WTF~沒有圖片");
                           myFun.hideWait();
                           myFun.hideImg();
                        }
                     }
                     break;
                  }
               }
            }catch(e){
               console.log("你媽啦！找到資料了, 但是發生錯誤");
               console.log(e);
               myFun.hideWait();
               myFun.hideImg();
            }
         } else {
            console.log("幹！找不到資料");
            myFun.hideWait();
            myFun.hideImg();
         }
      }
    }

    ,

    genImg : function() {
      console.log("genImg");
      try {
         if (myFun.imgArray && myFun.imgArray.length > 0) {
            //歸零
            myFun.PopupContainerContext.scrollBy(0,0);
            //產生img
            if (myFun.isElement(myFun.PopupImg)){
               myFun.PopupContainerContext.removeChild(myFun.PopupImg);
            }  
            myFun.PopupImg = document.createElement("img");
            myFun.PopupImg.style.display = "block";
            myFun.PopupImg.addEventListener("load",myFun.loadImg,false);
            myFun.PopupImg.addEventListener(
                           "error", 
                              function(event){ 
                                 myFun.hideWait();
                                 myFun.hideImg();
                                 console.log("你媽啦！圖床不給看"); 
                                 console.log(event); 
                              }  
                           ,false);
            myFun.PopupImg.src = myFun.imgArray[myFun.imgIndex];
            myFun.PopupContainerContext.appendChild(myFun.PopupImg);         
         }
      }catch(e){
         console.log(e);
      }

    }

    , 
      
    loadImg : function(event) {
      console.log("調整圖片大小");
      var imgObj = event.target;


		//取得瀏覽器視窗高度,沒有px喔
		var h = window.innerHeight;
		//取得瀏覽器視窗寬度,沒有px喔
		var w = window.innerWidth;
      //取得圖片寬度,沒有px喔
		var imgW = imgObj.naturalWidth;
      //取得圖片高度,沒有px喔
		var imgH = imgObj.naturalHeight;
      //計算圖片上下左右margin的寬度,沒有px喔
      var imgMargin = Math.round(w * 0.05);


      //PopupContainerTitle座標
      PopupContainerTitle.style.top = Math.round(imgMargin * 0.5) + "px";
      PopupContainerTitle.textContent = myFun.linkArray[myFun.linkIndex][1];
      PopupContainerTitle.style.left = "0px";
      PopupContainerTitle.style.width = w+"px";
      



      if (myFun.isElement(myFun.PopupContainer)) {
         myFun.PopupContainer.style.left = imgMargin+"px";
         myFun.PopupContainer.style.top = imgMargin+"px";
         myFun.PopupContainer.style.width = w-(imgMargin*2)+"px";
         myFun.PopupContainer.style.height = h-(imgMargin*2)+"px";
      }

      imgObj.style.top = "0px";
      imgObj.align="right";

      if ( imgW >= (w-(imgMargin*2)-myFun.ScrollWidth) ) {
         //圖寬超過範圍要做適當縮放
         console.log("圖寬超過範圍要做適當縮放");
         imgObj.style.width = w-(imgMargin*2)-myFun.ScrollWidth +"px";

         if (myFun.isElement(myFun.PopupContainerContext)) {
            myFun.PopupContainerContext.style.width = w-(imgMargin*2)+myFun.ScrollWidth+"px";
            myFun.PopupContainerContext.style.left = imgMargin + "px";
         }

      } else {
         //圖寬度小於外框
         console.log("圖寬度小於外框");
         imgObj.style.width = imgW+"px";

         if (myFun.isElement(myFun.PopupContainerContext)) {
            myFun.PopupContainerContext.style.width = imgW + myFun.ScrollWidth + "px";
            myFun.PopupContainerContext.style.left = Math.round((w-imgW)/2) + "px";
         }

      }

      if ( imgH > (h-(imgMargin*2)) ) {
         //圖高超過範圍
         console.log("圖高超過範圍");
         myFun.PopupContainerContext.style.height = h-(imgMargin*2) + "px";
         myFun.PopupContainerContext.style.top = imgMargin + "px";
         myFun.PopupContainerContext.style.overflowY = "scroll";

      }else{
         console.log("圖高小於範圍");
         myFun.PopupContainerContext.style.height = imgH + "px";
         myFun.PopupContainerContext.style.top = Math.round((h-imgH)/2) + "px";
         myFun.PopupContainerContext.style.overflowY = "hidden";
      }

      myFun.setIcon();
      myFun.showImg();
      myFun.hideWait();      

    }

    ,

    setIcon : function() {
      console.log("setIcon");

      var IconWidth = 64;

      if (!myFun.isElement(myFun.PopupContainer)) {
         console.log("得不到PopupContainer , setIcon fail");
         return ;
      }

      var left =  Number(myFun.PopupContainer.style.left.replace(/[^-\d\.]/g,''));
      var top = Number(myFun.PopupContainer.style.top.replace(/[^-\d\.]/g,''));
      var width = Number(myFun.PopupContainer.style.width.replace(/[^-\d\.]/g,''));
      var height = Number(myFun.PopupContainer.style.height.replace(/[^-\d\.]/g,''));

      var contextLeft =  Number(myFun.PopupContainerContext.style.left.replace(/[^-\d\.]/g,''));
      var contextTop = Number(myFun.PopupContainerContext.style.top.replace(/[^-\d\.]/g,''));
      var contextWidth = Number(myFun.PopupContainerContext.style.width.replace(/[^-\d\.]/g,''));

		var winH = window.innerHeight;
		var winW = window.innerWidth;
      var xx = 0;
      var yy = 0;

      //Create CloseIcon
      if (myFun.byId("closeIcon")){
         document.body.removeChild(myFun.closeIcon);
         myFun.closeIcon = {};
      }

      xx = contextLeft + contextWidth - (IconWidth/2);
      yy = contextTop - (IconWidth/2);
      myFun.closeIcon  = document.createElement('div');
      myFun.closeIcon.id = "closeIcon";
      myFun.closeIcon.onclick = myFun.hideImg;
      myFun.closeIcon.style= 
         'position:fixed;' + 
         'padding:0px;margin:0px;background:transparent;' + 
         'border:0px; z-index:905;'+
         'background-repeat: no-repeat; background-position: center center;' +
         'background-image:url("' + myFun.close +'");' +
         'width: ' + IconWidth + 'px;height: ' + IconWidth + 'px;' + 'left:' + xx +'px;' + 'top:' + yy + 'px;';
      document.body.appendChild(myFun.closeIcon);


      //Create NextIcon
      if (myFun.byId("nextIcon")){
         document.body.removeChild(myFun.nextIcon);
         myFun.nextIcon = {};
      }

      xx = winW - IconWidth;
      yy = (winH/2) - (IconWidth/2);
      myFun.nextIcon  = document.createElement('div');
      myFun.nextIcon.id = "nextIcon";
      myFun.nextIcon.style=
         'position:fixed;' + 
         'padding:0px;margin:0px;background:transparent;' + 
         'border:0px; z-index:905;'+
         'background-repeat: no-repeat; background-position: center center;' +
         'background-image:url("' + myFun.next +'");' +
         'width: ' + IconWidth + 'px;height: ' + IconWidth + 'px;' + 'left:' + xx +'px;' + 'top:' + yy + 'px;';
      myFun.nextIcon.onclick = myFun.nextImg;
      myFun.nextIcon.style.display = (myFun.imgIndex == (myFun.imgArray.length-1)) ?"none" : "inline";
      document.body.appendChild(myFun.nextIcon);

      //Create PrevIcon
      if (myFun.byId("prevIcon")){
         document.body.removeChild(myFun.prevIcon);
         myFun.prevIcon = {};
      }
      xx = 0;
      yy = (winH/2) - (IconWidth/2);
      myFun.prevIcon  = document.createElement('div');
      myFun.prevIcon.id = "prevIcon";
      myFun.prevIcon.style=
         'position:fixed;' + 
         'padding:0px;margin:0px;background:transparent;' + 
         'border:0px; z-index:905;'+
         'background-repeat: no-repeat; background-position: center center;' +
         'background-image:url("' + myFun.prev +'");' +
         'width: ' + IconWidth + 'px;height: ' + IconWidth + 'px;' + 'left:' + xx +'px;' + 'top:' + yy + 'px;';
      myFun.prevIcon.onclick = myFun.prevImg;
      myFun.prevIcon.style.display = (myFun.imgIndex == 0) ?"none" : "inline";
      document.body.appendChild(myFun.prevIcon);


    }

    ,

    hideImg : function(event) {
      console.log("hideImg");

      document.removeEventListener("scroll" ,myFun.uiEvent, false);
      document.removeEventListener("keydown",myFun.uiEvent, false);

      myFun.imgArray = [];
      myFun.imgIndex = "0";


      if (myFun.isElement(myFun.PopupContainer)) {
         myFun.PopupContainer.style.display = "none";
      }
      if (myFun.isElement(myFun.transDiv)){
         myFun.transDiv.style.display = "none";
      }
      if (myFun.isElement(myFun.closeIcon)){
         myFun.closeIcon.style.display = "none";
      }
      if (myFun.isElement(myFun.nextIcon)){
         myFun.nextIcon.style.display = "none";
      }
      if (myFun.isElement(myFun.prevIcon)){
         myFun.prevIcon.style.display = "none";
      }

    }

    ,

    showImg : function() {
      console.log("showImg");
      try {
         document.addEventListener("wheel" ,myFun.uiEvent, false);
         document.addEventListener("keydown",myFun.uiEvent, false);
      }catch(e){
         console.log(e);
      }

      if (myFun.isElement(myFun.PopupContainer)){
         myFun.PopupContainer.style.display = "inline";
      }
      if (myFun.isElement(myFun.transDiv)){
         myFun.transDiv.style.display = "inline";
      }
      if (myFun.isElement(myFun.closeIcon)){
         myFun.closeIcon.style.display = "inline";
      }
    }

    ,

    nextImg : function(event) {
      console.log("nextImg");
      //1.先隱藏圖片
      if (myFun.isElement(myFun.PopupContainer)) {
         myFun.PopupContainer.style.display = "none";
      }
      //2.出現Wait圖案
      myFun.showWait();
      if (myFun.imgIndex < myFun.imgArray.length-1) {
         myFun.imgIndex ++;
      }
      //3.讀取並秀出下一張圖片
      myFun.genImg();
    }

    ,

    prevImg : function(event) {
      console.log("prevImg");
      //1.先隱藏圖片
      if (myFun.isElement(myFun.PopupContainer)) {
         myFun.PopupContainer.style.display = "none";
      }
      //2.出現Wait圖案
      myFun.showWait();
      if (myFun.imgIndex > 0) {
         myFun.imgIndex --;
      }
      //3.讀取並秀出上一張圖片
      myFun.genImg();
    }

    ,

    uiEvent : function(event) {
      if (event && event instanceof Event) {
         if (event.type == "keydown") {
            if (event.keyCode == "27"){
               console.log("ESC Key");
               myFun.hideImg();
            }

            if (event.keyCode == "39" && 
                myFun.isElement(myFun.nextIcon) && 
                myFun.nextIcon.style.display == "inline")
            {
               console.log("Right Key");
               myFun.nextImg();
            }

            if (event.keyCode == "37" &&
                myFun.isElement(myFun.prevIcon) && 
                myFun.prevIcon.style.display == "inline")
            {
               console.log("Left Key");
               myFun.prevImg();
            }

            if (event.keyCode == "38")
            {
               console.log("Up Key");
               myFun.PopupContainerContext.scrollBy(0,-10);
               event.preventDefault();
            }

            if (event.keyCode == "40")
            {
               console.log("Down Key");
               myFun.PopupContainerContext.scrollBy(0,10);
               event.preventDefault();
            }

            if (event.keyCode == "13")
            {
               console.log("Enter Key");
               //這功能以後再做吧，好累
               //event.preventDefault();
            }

         }
         
         if (event.type == "wheel" ) {
            var scrollY = 0;

            if (event.deltaMode == 00 ) {
               scrollY = event.deltaY;
            }else if (event.deltaMode == 01 ) {
               scrollY = event.deltaY * 10;
            }else if (event.deltaMode == 02 ) {
               if (event.deltaY > 0) 
                  myFun.nextImg();
               else
                  myFun.prevImg();
               return;
            }
            console.log("scrollY add " + scrollY);
            myFun.PopupContainerContext.scrollBy(0,scrollY);
            event.preventDefault();

         }

      }

      
      //return false;

    }
    ,

    showWait : function() {
      console.log("showWait");
      if (myFun.byId("waitDiv")){
         document.body.removeChild(myFun.waitDiv);
         myFun.waitDiv = {};
      }

      myFun.waitDiv = document.createElement("div"); 
      myFun.waitDiv.id = "waitDiv";
      myFun.waitDiv.style = 
         'position:fixed;top:0px;left:0px;'+
         'width:'+window.innerWidth+'px;' + 'height:'+window.innerHeight+'px;' +
         'padding:0px;margin:0px;background:transparent;' + 
         'border:0px; z-index:905;'+
         'display: inline;'+
         'background-repeat: no-repeat; background-attachment: fixed;  background-position: center center;' +
         'background-image: url('+myFun.wait+');';
     document.body.appendChild(myFun.waitDiv);

    }

    ,

    hideWait : function() {
      console.log("hideWait");
      if (myFun.byId("waitDiv")) {
         document.body.removeChild(myFun.byId("waitDiv"));
         myFun.waitDiv = {};
      }

    }

    ,

    imgArray : [],
    imgIndex : "0",
    linkArray : [],
    linkIndex : "0",
    transDiv : {},
    PopupContainer : {},
    PopupContainerTitle : {},
    PopupContainerContext : {},
    closeIcon : {},
    nextIcon : {},
    prevIcon : {},
    PopupImg : {},
    waitDiv : {},
    ScrollWidth : 18,

    eye : "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDYxLjg2NCA2MS44NjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYxLjg2NCA2MS44NjQ7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8Zz4KCQk8ZyBpZD0ic3VuX2dsYXNzZXMiPgoJCQk8Zz4KCQkJCTxwYXRoIGQ9Ik00My45OTgsMjAuMDA4Yy00LjU3NiwwLjMyOC05LjMxMiwyLjExNS0xNC40NzksMS43NzFjLTMuODU0LTAuMjYxLTcuODI3LTEuNDk2LTExLjQyMS0xLjc3MSAgICAgIGMtMi40NDEtMC4xODYtNi4xNjEsMC04LjA0MywwLjE2MWMtMy41NTcsMC4zMDUtOC45NTQsMC44OTEtOS44MTIsMy4zOGMtMS4wMDcsMi45MjUsMS4zOTgsMy45MTcsMS45MzEsNS4xNDcgICAgICBjMC43NzEsMS43ODcsMC42ODUsMy42MzQsMS4yODYsNS4xNDZjMC41NiwxLjM5OCwxLjI4OSwyLjkzMywyLjI1Miw0LjE4NmMzLjQ2Nyw0LjUxMSwxMy4zNzEsNC45NTQsMTcuODU1LDEuMjg3ICAgICAgYzEuNDE4LTEuMTYyLDIuODk1LTMuNjA1LDMuODYtNS43OTFjMC42NzktMS41MzgsMS40NDEtNi4xMTMsMy41MzgtNi4xMTNjMS42MDksMCwxLjgyOCwxLjQzOCwyLjI1MywyLjg5NiAgICAgIGMxLjE4NCw0LjA1OSwzLjE1Niw3LjgzMyw1Ljk1MSw5LjY1MWM0LjM3NSwyLjg1LDEyLjEyNSwyLjY0MSwxNS42MDQtMC4zMjJjMi4wOTYtMS43ODMsMy41MjktNC45MjIsNC4zNDUtNy41NjEgICAgICBjMC4zMjEtMS4wNDcsMC4yMDYtMi4zNzgsMC42NDUtMy4zNzhjMC42NTUtMS41MDEsMi4yNDMtMS43NzYsMi4wOTItNC4xODVDNjEuNTY1LDE5Ljk2NSw0OS42ODIsMTkuNjAxLDQzLjk5OCwyMC4wMDh6ICAgICAgIE0yMi4yODIsMzcuMzgyYy0zLjE0LDIuNjIyLTkuNzc1LDMuMDM0LTEzLjE5LDAuNjQ2Yy0yLjA0Ny0xLjQzNi01Ljc4Ny04LjcxLTMuMzc5LTEzLjE5MiAgICAgIGMwLjg1NS0xLjU5MywyLjM5NS0xLjk5Nyw0LjY2NS0yLjI1M2M1Ljg3My0wLjY1OSwxNC43OSwwLjIyMSwxNi4wODcsNC4zNDRDMjcuNjkyLDMwLjgzMywyNC4yMDgsMzUuNzcxLDIyLjI4MiwzNy4zODJ6ICAgICAgIE01Ni43MDYsMjkuODIxYy0wLjI3MiwzLjEzMS0xLjk1OSw3LjIyMS00LjE4NCw4LjM2MmMtNC44NzUsMi41MDktMTEuNTQyLDEuMjgzLTE0LjQ3OS0yLjU3MSAgICAgIGMtMS41MDYtMS45NzktMy40NjctNS44MS0yLjU3My04LjY4OGMwLjkzMy0zLjAxLDUuMzU1LTMuOTkxLDkuNjUtNC4zNDRDNTIuNjkzLDIxLjk2Miw1Ny4zNzQsMjIuMTY5LDU2LjcwNiwyOS44MjF6ICAgICAgIE01MS45MiwyMy43MWMtMC4xMDctMC4yMzQtMC4zODgtMC4zMzYtMC42MjItMC4yMjhjLTAuMjMzLDAuMTA3LTAuMzM2LDAuMzg5LTAuMjI5LDAuNjIzbDMuMDA2LDYuNDUgICAgICBjMC4xMDcsMC4yMzQsMC4zODgsMC4zMzYsMC42MiwwLjIyOWMwLjIzNC0wLjEwOSwwLjMzOC0wLjM4OCwwLjIyOS0wLjYyMkw1MS45MiwyMy43MXogTTUwLjM1OCwyNS4yNzEgICAgICBjLTAuMTA3LTAuMjM0LTAuMzg4LTAuMzM4LTAuNjIyLTAuMjI5Yy0wLjIzMiwwLjEwOS0wLjMzNiwwLjM4OC0wLjIyOCwwLjYyMmwyLjA2Nyw0Ljg5MmMwLjEwNywwLjIzNCwwLjM4OCwwLjMzNiwwLjYyMiwwLjIyOSAgICAgIGMwLjIzMi0wLjEwOSwwLjMzNi0wLjM4OCwwLjIyNy0wLjYyMkw1MC4zNTgsMjUuMjcxeiIgZmlsbD0iIzAwMDAwMCIvPgoJCQk8L2c+CgkJPC9nPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=",

   close : "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjY0cHgiIGhlaWdodD0iNjRweCIgdmlld0JveD0iMCAwIDM0OC4zMzMgMzQ4LjMzNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzQ4LjMzMyAzNDguMzM0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBhdGggZD0iTTMzNi41NTksNjguNjExTDIzMS4wMTYsMTc0LjE2NWwxMDUuNTQzLDEwNS41NDljMTUuNjk5LDE1LjcwNSwxNS42OTksNDEuMTQ1LDAsNTYuODUgICBjLTcuODQ0LDcuODQ0LTE4LjEyOCwxMS43NjktMjguNDA3LDExLjc2OWMtMTAuMjk2LDAtMjAuNTgxLTMuOTE5LTI4LjQxOS0xMS43NjlMMTc0LjE2NywyMzEuMDAzTDY4LjYwOSwzMzYuNTYzICAgYy03Ljg0Myw3Ljg0NC0xOC4xMjgsMTEuNzY5LTI4LjQxNiwxMS43NjljLTEwLjI4NSwwLTIwLjU2My0zLjkxOS0yOC40MTMtMTEuNzY5Yy0xNS42OTktMTUuNjk4LTE1LjY5OS00MS4xMzksMC01Ni44NSAgIGwxMDUuNTQtMTA1LjU0OUwxMS43NzQsNjguNjExYy0xNS42OTktMTUuNjk5LTE1LjY5OS00MS4xNDUsMC01Ni44NDRjMTUuNjk2LTE1LjY4Nyw0MS4xMjctMTUuNjg3LDU2LjgyOSwwbDEwNS41NjMsMTA1LjU1NCAgIEwyNzkuNzIxLDExLjc2N2MxNS43MDUtMTUuNjg3LDQxLjEzOS0xNS42ODcsNTYuODMyLDBDMzUyLjI1OCwyNy40NjYsMzUyLjI1OCw1Mi45MTIsMzM2LjU1OSw2OC42MTF6IiBmaWxsPSIjRkZGRkZGIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==",

   next : "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjY0cHgiIGhlaWdodD0iNjRweCIgdmlld0JveD0iMCAwIDQ1MS44NDYgNDUxLjg0NyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDUxLjg0NiA0NTEuODQ3OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBhdGggZD0iTTM0NS40NDEsMjQ4LjI5MkwxNTEuMTU0LDQ0Mi41NzNjLTEyLjM1OSwxMi4zNjUtMzIuMzk3LDEyLjM2NS00NC43NSwwYy0xMi4zNTQtMTIuMzU0LTEyLjM1NC0zMi4zOTEsMC00NC43NDQgICBMMjc4LjMxOCwyMjUuOTJMMTA2LjQwOSw1NC4wMTdjLTEyLjM1NC0xMi4zNTktMTIuMzU0LTMyLjM5NCwwLTQ0Ljc0OGMxMi4zNTQtMTIuMzU5LDMyLjM5MS0xMi4zNTksNDQuNzUsMGwxOTQuMjg3LDE5NC4yODQgICBjNi4xNzcsNi4xOCw5LjI2MiwxNC4yNzEsOS4yNjIsMjIuMzY2QzM1NC43MDgsMjM0LjAxOCwzNTEuNjE3LDI0Mi4xMTUsMzQ1LjQ0MSwyNDguMjkyeiIgZmlsbD0iI0ZGRkZGRiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=",

   prev : "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjY0cHgiIGhlaWdodD0iNjRweCIgdmlld0JveD0iMCAwIDQ1MS44NDcgNDUxLjg0NyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDUxLjg0NyA0NTEuODQ3OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBhdGggZD0iTTk3LjE0MSwyMjUuOTJjMC04LjA5NSwzLjA5MS0xNi4xOTIsOS4yNTktMjIuMzY2TDMwMC42ODksOS4yN2MxMi4zNTktMTIuMzU5LDMyLjM5Ny0xMi4zNTksNDQuNzUxLDAgICBjMTIuMzU0LDEyLjM1NCwxMi4zNTQsMzIuMzg4LDAsNDQuNzQ4TDE3My41MjUsMjI1LjkybDE3MS45MDMsMTcxLjkwOWMxMi4zNTQsMTIuMzU0LDEyLjM1NCwzMi4zOTEsMCw0NC43NDQgICBjLTEyLjM1NCwxMi4zNjUtMzIuMzg2LDEyLjM2NS00NC43NDUsMGwtMTk0LjI5LTE5NC4yODFDMTAwLjIyNiwyNDIuMTE1LDk3LjE0MSwyMzQuMDE4LDk3LjE0MSwyMjUuOTJ6IiBmaWxsPSIjRkZGRkZGIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==",

  wait : "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDIzNS4zMTkgMjM1LjMxOSIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjM1LjMxOSAyMzUuMzE5IiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgogIDxnPgogICAgPHBhdGggZD0ibTIwMS4wOTQsMjkuOTk3YzIuNjQ5LTAuNjIzIDQuNjIzLTIuOTk2IDQuNjIzLTUuODM1di0xOC4xNjJjMC0zLjMxMy0yLjY4Ny02LTYtNmgtMTY0LjExNGMtMy4zMTMsMC02LDIuNjg3LTYsNnYxOC4xNjNjMCwyLjgzOSAxLjk3NCw1LjIxMiA0LjYyMyw1LjgzNSAxLjgxMiwzMi4zMTQgMTguNTk0LDYxLjkyOCA0NS42ODIsODAuMDc2bDExLjMyNCw3LjU4Ni0xMS4zMjQsNy41ODZjLTI3LjA4OSwxOC4xNDctNDMuODcxLDQ3Ljc2Mi00NS42ODIsODAuMDc2LTIuNjQ5LDAuNjIzLTQuNjIzLDIuOTk2LTQuNjIzLDUuODM1djE4LjE2M2MwLDMuMzEzIDIuNjg3LDYgNiw2aDE2NC4xMTRjMy4zMTMsMCA2LTIuNjg3IDYtNnYtMTguMTYzYzAtMi44MzktMS45NzQtNS4yMTItNC42MjMtNS44MzUtMS44MTItMzIuMzE0LTE4LjU5NC02MS45MjgtNDUuNjgzLTgwLjA3NmwtMTEuMzI0LTcuNTg2IDExLjMyNC03LjU4NmMyNy4wODktMTguMTQ4IDQzLjg3MS00Ny43NjMgNDUuNjgzLTgwLjA3N3ptLTE1OS40OTEtMTcuOTk3aDE1Mi4xMTR2Ni4xNjNoLTE1Mi4xMTR2LTYuMTYzem0xNTIuMTE0LDIxMS4zMTloLTE1Mi4xMTR2LTYuMTYzaDE1Mi4xMTR2Ni4xNjN6bS02My43NDktMTEwLjY0NGMtMS42NjMsMS4xMTQtMi42NjEsMi45ODMtMi42NjEsNC45ODVzMC45OTgsMy44NzEgMi42NjEsNC45ODVsMTguNzY1LDEyLjU3MWMyMy43MSwxNS44ODMgMzguNDksNDEuNzA1IDQwLjMzMyw2OS45NDFoLTE0Mi44MTJjMS44NDMtMjguMjM1IDE2LjYyMy01NC4wNTcgNDAuMzMzLTY5Ljk0MWwxOC43NjUtMTIuNTcxYzEuNjYzLTEuMTE0IDIuNjYxLTIuOTgzIDIuNjYxLTQuOTg1cy0wLjk5OC0zLjg3MS0yLjY2MS00Ljk4NWwtMTguNzY1LTEyLjU3MWMtMjMuNzEtMTUuODg0LTM4LjQ5LTQxLjcwNi00MC4zMzMtNjkuOTQxaDE0Mi44MTJjLTEuODQzLDI4LjIzNi0xNi42MjMsNTQuMDU3LTQwLjMzMyw2OS45NDFsLTE4Ljc2NSwxMi41NzF6IiBmaWxsPSIjRkZGRkZGIi8+CiAgICA8cGF0aCBkPSJtMTMzLjMwNyw4Mi42NmgtMzEuMjk1Yy0yLjQ4NywwLTQuNzE3LDEuNTM1LTUuNjA1LDMuODU4LTAuODg4LDIuMzI0LTAuMjUsNC45NTUgMS42MDQsNi42MTNsMTUuNjQ3LDE0YzEuMTM5LDEuMDE5IDIuNTcsMS41MjggNCwxLjUyOHMyLjg2Mi0wLjUwOSA0LTEuNTI4bDE1LjY0Ny0xNGMxLjg1NC0xLjY1OSAyLjQ5Mi00LjI5IDEuNjA0LTYuNjEzLTAuODg1LTIuMzIzLTMuMTE1LTMuODU4LTUuNjAyLTMuODU4eiIgZmlsbD0iI0ZGRkZGRiIvPgogICAgPHBhdGggZD0ibTExNy40MTQsMTQwLjU4MWwtMTUuMjE4LDkuNzc1Yy0xMy4zMDYsOC45MTQtMjEuMjkyLDIzLjg3Ni0yMS4yOTIsMzkuODkyaDc2LjUxMWMwLTE2LjAxNi03Ljk4Ni0zMC45NzgtMjEuMjkyLTM5Ljg5MmwtMTUuMjE4LTkuNzc1Yy0xLjA3NC0wLjY0NC0yLjQxNi0wLjY0NC0zLjQ5MSwweiIgZmlsbD0iI0ZGRkZGRiIvPgogIDwvZz4KPC9zdmc+Cg=="

};

//整個畫面，讓他暗
myFun.transDiv = document.createElement("div"); 
myFun.transDiv.id = "transDiv";
myFun.transDiv.style=
            'position:fixed;top:0px;left:0px;'+
            'width:'+window.innerWidth+'px;' + 'height:'+window.innerHeight+'px;' +
            'padding:0px;margin:0px;background:#404040;' + 
            'border:0px; z-index:900;'+
            'opacity: 0.9; display: none;';
//            'background-repeat: no-repeat; background-attachment: fixed;  background-position: center center;' +
//            'background-image: url('+myFun.wait+');';

//加入視窗
document.body.appendChild(myFun.transDiv);

//定義彈跳視窗（秀圖區）
myFun.PopupContainer  = document.createElement('div');
myFun.PopupContainer.id = "PopupContainer";
myFun.PopupContainer.style= 
            'position:fixed;' + 
            'padding:0px;margin:0px;background:transparent;' + 
            'border:0px; z-index:901;'+
            'display: none;';
myFun.PopupContainer.innerHTML=
            '<div id="PopupContainerTitle"' +
                  'style="position:fixed;background-color:#404040;color:#FFFFFF;' + 
                  'padding:0px;margin:0px;border:0px;overflow:hidden;text-align:center;"></div>' +
            '<div id="PopupContainerContext" style="position:fixed;padding:0px;margin:0px;border:0px;"></div>';

document.body.appendChild(myFun.PopupContainer);
myFun.PopupContainerContext = myFun.byId("PopupContainerContext");
myFun.PopupContainerTitle = myFun.byId("PopupContainerTitle");


//改善排版
var bodyWP = myFun.byId("wp");
bodyWP.style.width = '100%';
bodyWP.style.borderWidth = '0px';
bodyWP.style.padding = '0px';

var tempArray = myFun.toArray(myFun.byClass("xst"));
for (var ii = 0 ; ii< tempArray.length ; ii++) {
   tempArray[ii].style.fontSize = '20px';
}


//找出每一列內容
var trArray = myFun.toArray( myFun.byTag("tr", myFun.byTag("table",myFun.byId("moderate"))[0]));
myFun.linkArray = new Array(trArray.length);
var findSeparatorLine = false;
for (var ii = 0 ; ii< trArray.length ; ii++) {
   var trObj = trArray[ii];
   var thObj = myFun.byTag("th",trObj)[0];
   var tdArray = myFun.toArray(myFun.byTag("td",trObj));

   //把有用的內容寬度放寬
   if (typeof(thObj) !== 'undefined') {
      thObj.style.width = '60%';
   }

   //執行onmouseout, 把tr的mouseEven拿掉，因為他擋住icon
   if (typeof(trObj.onmouseout) !== 'undefined' && trObj.onmouseout != null) {
      trObj.onmouseout();
      trObj.onmouseout = ""; 
      trObj.onmouseover = "";
   }

   //拿掉網頁快速鍵   
   document.onkeyup = "";

   //公告主題不要預覽圖片
   //不一定會有separatorline, 如果沒有就視為全部主題都沒有公告
   if (trObj.parentNode && trObj.parentNode.nodeName == "TBODY" && trObj.parentNode.id == "separatorline"){
      findSeparatorLine = true;
      console.log("continue");
      continue;
   }

   //從separatorline以後的才需要預覽功能
   if (findSeparatorLine) {
      //定義icon點擊要出現彈跳視窗（秀圖區）
      var showPopupContainerIcon = document.createElement("img");
      showPopupContainerIcon.name = "showPopupContainer_"+ii;
      showPopupContainerIcon.src = myFun.eye;
      showPopupContainerIcon.addEventListener("click",myFun.iconClick,false);


      for (var tt = 0 ; tt< tdArray.length ; tt++) {
         if (tdArray[tt].className == "icn" ){
            tdArray[tt].appendChild(showPopupContainerIcon);
         }
      }

      var aTag = myFun.byTag("a",thObj);
      if (aTag && aTag.length > 1 && typeof(aTag[1].href) != 'undefined' ) { 
         //找出連結
         myFun.linkArray[ii] = new Array(2);
         myFun.linkArray[ii][0] = aTag[1].href;
         if (thObj.textContent){
            myFun.linkArray[ii][1] = thObj.textContent;
         }
      }else{
         console.log('get aTag fail');
      }
   }
}

