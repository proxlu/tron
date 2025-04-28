var map = SplashMap;
var can, c, w, h, cSamp;
var gameplay = false;
var player = {x:0, y:0, d:0, col:""};
var dirqueue = [];

var godmode = false;

var soc = io();

var xDown = null;
var yDown = null;
var xUp = null;
var yUp = null;
var touchActive = false;

function onload(){

    cSamp = document.getElementById("colSample");
    cSamp.style.backgroundColor = rgbToHex();
    player.col = rgbToHex();

    window.addEventListener('keydown',keyListener);
    window.addEventListener('resize',resize);

    can = document.getElementById('gc');
    c = can.getContext('2d');
    resize();
    setInterval(update,200);

    can.addEventListener('touchstart', handleTouchStart, false);
    can.addEventListener('touchmove', handleTouchMove, false);
    can.addEventListener('touchend', handleTouchEnd, false);

    var xDown = null;
    var yDown = null;
}

function handleTouchStart(evt) {
    evt.preventDefault();
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
    touchActive = true;
};

function handleTouchMove(evt) {
    if (!touchActive) return;
    evt.preventDefault();
    
    // Atualiza as coordenadas atuais durante o movimento
    xUp = evt.touches[0].clientX;
    yUp = evt.touches[0].clientY;
};

function handleTouchEnd(evt) {
    if (!touchActive || !xDown || !yDown || !xUp || !yUp) {
        resetTouch();
        return;
    }
    
    evt.preventDefault();
    
    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;
    
    // Limiar mínimo para considerar um swipe (em pixels)
    var threshold = 30;
    
    // Só processa se o movimento foi significativo
    if (Math.abs(xDiff) > threshold || Math.abs(yDiff) > threshold) {
        // Detecta a direção principal do swipe
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                dirqueue.unshift(3); // Swipe para esquerda
            } else {
                dirqueue.unshift(1); // Swipe para direita
            }
        } else {
            if (yDiff > 0) {
                dirqueue.unshift(0); // Swipe para cima
            } else { 
                dirqueue.unshift(2); // Swipe para baixo
            }
        }
    }
    
    resetTouch();
};

function resetTouch() {
    xDown = null;
    yDown = null;
    xUp = null;
    yUp = null;
    touchActive = false;
}

function keyListener(e){
    switch(e.key){
        case 'w': case 'ArrowUp':   dirqueue.unshift(0); break;
        case 'a': case 'ArrowLeft': dirqueue.unshift(3); break;
        case 's': case 'ArrowDown': dirqueue.unshift(2); break;
        case 'd': case 'ArrowRight':dirqueue.unshift(1);
    }
}

function update(){
    //clear();
    //drawMap();
    if(dirqueue.length>0){
        player.d=dirqueue.pop();
    }
    if(gameplay) updatePlayer();
}

function updatePlayer(){
    if(godmode || map[player.x][player.y]=="#666"){
        map[player.x][player.y] = player.col;
        c.fillStyle = player.col;
        c.fillRect(player.x*pixelSizeX, player.y*pixelSizeY, pixelSizeX, pixelSizeY);
        soc.emit('Game_MapUpdate',player);

        switch(player.d){
            case 0: player.y--; break;
            case 1: player.x++; break;
            case 2: player.y++; break;
            case 3: player.x--;
        }

        if(player.x<0) player.x = map.length-1;
        if(player.y<0) player.y = map[0].length-1;
        if(player.x>=map.length) player.x = 0;
        if(player.y>=map[0].length) player.y = 0;
    } else {
        gameplay=false;
        soc.emit("Player_Death");
        document.getElementById('deaths').innerHTML+=`You died!\n`;
    }
}


var pixelSizeX = 5
var pixelSizeY = 5;
function drawMap(){
    for(var i=0; i<map.length; i++){
        for(var j=0; j<map.length; j++){
            c.fillStyle = map[i][j];
            c.fillRect(i*pixelSizeX, j*pixelSizeY, pixelSizeX, pixelSizeY);
        }
    }
}

function resize(){
    clear();
    pixelSizeX = w/map.length;
    pixelSizeY = h/map[0].length;
    drawMap();
}

function clear(){
    w=(can.width = window.innerWidth);
    h=(can.height = window.innerHeight);
}

function hideAllPanes(){
    var panes = document.getElementsByClassName("pane");
    for(var i = 0; i<panes.length; i++){
        panes[i].hidden = true;
    }
}

//Game setup
soc.on('disconnect',()=>{
    hideAllPanes();
    document.getElementById("kickPane").hidden = false;
    soc.reconnects = false;
    soc.disconnect();
})
soc.on('Player_Death',(player)=>{
    document.getElementById('deaths').innerHTML+=`${player.username} died!\n`;
});
soc.on('Game_End',(winner)=>{
    console.log("game end", winner);
    gameplay = false;
    hideAllPanes();
    document.getElementById("endPaneWinner").innerHTML = winner?winner.username:"Nobody";
    document.getElementById("endPane").hidden = false;
    players.forEach(sid=>{
        var tdelm=document.getElementById(`Playerlist_${sid}`).childNodes[1];
        tdelm.innerHTML="No";
        tdelm.style.backgroundColor = "#F00";
    })
    document.getElementById('deaths').innerHTML="";
});
soc.on('Game_MapUpdate', data=>{
    map[data.x][data.y] = data.col;
    c.fillStyle = data.col;
    c.fillRect(data.x*pixelSizeX, data.y*pixelSizeY, pixelSizeX, pixelSizeY);
});
soc.on('Game_Start',()=>{
    hideAllPanes();
    player.x = Math.floor(Math.random()*map.length);
    player.y = Math.floor(Math.random()*map[0].length);
    gameplay = true;
})
soc.on('Game_Map',data=>{
    map=data;
    resize();
})
soc.on('Player_Kick',()=>{
    hideAllPanes();
    document.getElementById("kickPane").hidden = false;
});
soc.on('Player_Votekick',(data)=>{
    var tdelm=document.getElementById(`Playerlist_${data.sid}`).childNodes[2];
    tdelm.innerHTML = data.num;
});
soc.on('Player_Leave', (data)=>{
    var tblelm=document.getElementById(`Playerlist_${data}`);
    tblelm.remove();

    var index = players.indexOf(data);
    if (index !== -1) players.splice(index, 1);
});
soc.on('Player_Ready', (data)=>{
    var tdelm=document.getElementById(`Playerlist_${data}`).childNodes[1];
    tdelm.innerHTML="Yes";
    tdelm.style.backgroundColor = "#0F0";
});
var players = [];
soc.on('Player_Join', (data)=>{
    var tableLine = `<tr id="Playerlist_${data.sid}"><td style="color: ${data.col};">${data.username}</td><td style="background-color: #${data.ready?"0F":"F0"}0;">${data.ready?"Yes":"No"}</td><td>${data.votekick}</td><td><button onclick="kick('${data.sid}',this)">Kick?</button></td></tr>`
    document.getElementById('Playerlist').innerHTML+=tableLine;
    players.push(data.sid);
});

function kick(sid, btn){
    btn.disabled = true;
    soc.emit("Player_Votekick", sid);
}

function joinGame(){
    document.getElementById("setupPane").hidden = true;
    document.getElementById("playersPane").hidden = false;
    var username = cSamp.value;
    var col = rgbToHex();
    console.log(username)
    player.col = col;
    soc.emit('Player_Join', {username, col});
}

function readyUp(){
    document.getElementById('ReadyBtn').disabled = true;
    soc.emit('Player_Ready');
}

function end_restart(){
    hideAllPanes();
    document.getElementById('ReadyBtn').disabled = false;
    document.getElementById('playersPane').hidden = false;
}

//Colour picker
var r = Math.floor(Math.random()*255);
var g = Math.floor(Math.random()*255);
var b = Math.floor(Math.random()*255);

function udc_red(v){
    r=v;
    cSamp.style.backgroundColor = rgbToHex();
}
function udc_blue(v){
    b=v;
    cSamp.style.backgroundColor = rgbToHex();
}
function udc_green(v){
    g=v;
    cSamp.style.backgroundColor = rgbToHex();
}


function componentToHex(c) {
    var hex = c.toString(16);   
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex() {
    return "#" + componentToHex(Math.floor(r)) + componentToHex(Math.floor(g)) + componentToHex(Math.floor(b));
}
