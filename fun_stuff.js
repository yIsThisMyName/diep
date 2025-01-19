document.body.onmousedown=function(){
    if(event.button === 4){
        extern.onKeyDown(64);
    }
}
document.body.onmouseup = function() {
    if(event.button === 4){
        extern.onKeyUp(64);
    }
}
console.log("stupid script");
