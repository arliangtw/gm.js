// ==UserScript==
// @name        eyny
// @namespace   diywor.info
// @description test
// @version     1
// @grant       none
// @include        http://www.marathonsworld.com/app/training.php?*
// @require        http://ajax.aspnetcdn.com/ajax/jquery/jquery-1.7.2.js
// ==/UserScript==

console.log("Eyby -> jquery:"+ $.fn.jquery);

$('#wp').width('100%');
$('.xst,#wp').css('font-size' , '20px');
$('#moderate table').find('tr').each(
   function(idx,obj){
      $(obj).find('td.by:eq(1)').hide();
      $(obj).find('th')
        .width('90%')
        .one("mouseover.my",
        function(eventObject){
           console.log(eventObject);
        }
      );
});

