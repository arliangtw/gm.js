// ==UserScript==
// @name        jkForum
// @namespace   diywork.info
// @description jkForumOnly
// @version     0.1
// @grant       none
// @include     http://www.jkforum.net/forum*.html
// @include     http://www.jkforum.net/forum*.php
// ==/UserScript==

console.log("jkForum's Jquery Version is " + jQuery.fn.jquery);
if (typeof jQuery === 'undefined') {  
    alert("this no Jquery");
}

