var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req,res)=>{res.sendFile(__dirname+"/cli/index.html");})
app.get('/main.js', (req,res)=>{res.sendFile(__dirname+"/cli/main.js");})
app.get('/SplashMap.js', (req,res)=>{res.sendFile(__dirname+"/cli/SplashMap.js");})
app.get('/main.css', (req,res)=>{res.sendFile(__dirname+"/cli/main.css");})


var players = {};

const MX = 256;
const MY = 117;

var gameMap = [];

io.on('connection', (soc)=>{

    Object.keys(players).forEach(socid=>{soc.emit('Player_Join', players[socid])});

    //TODO if game started, join active game

    soc.on('Player_Join',(data)=>{
        data.sid = soc.id;
        data.votekick = 0;
        data.ready = false;
        players[soc.id]=data;
        soc.broadcast.emit('Player_Join', data);
        soc.emit('Player_Join', data);
    })
    soc.on('Player_Ready',(data)=>{
        players[soc.id].ready=true;

        soc.broadcast.emit('Player_Ready', soc.id);
        soc.emit('Player_Ready', soc.id);
        
        var allReady = true;
        Object.keys(players).forEach(sid=>{
            if(!players[sid].ready) allReady = false;
        });
        if(allReady){ //TODO and game not running
            console.log("Starting Game!");
            //initialise map
            for(var i = 0; i<MX; i++){
                gameMap[i]=[];
                for(var j = 0; j<MY; j++){
                    gameMap[i][j] = "#666";
                }
            }

            Object.keys(players).forEach(sid=>{
                players[sid].dead = false;
                players[sid].ready = false;
            });

            //send Map to players
            soc.broadcast.emit("Game_Map", gameMap);
            soc.emit("Game_Map", gameMap);

            //Tell players to start w/ random location
            soc.broadcast.emit("Game_Start");
            soc.emit("Game_Start");

        }

    })
    soc.on('Game_MapUpdate', data=>{
        gameMap[data.x][data.y] = data.col;
        soc.broadcast.emit("Game_MapUpdate", data);
    });
    soc.on('Player_Votekick', sid=>{
        if(players[sid]){
            players[sid].votekick++;
            if(players[sid].votekick>=Object.keys(players).length/2){
                var kick=io.sockets.connected[sid];
                kick.emit("Player_Kick");
                kick.disconnect();
            } else {
                soc.broadcast.emit('Player_Votekick', {sid, num:players[sid].votekick});
                soc.emit('Player_Votekick', {sid, num:players[sid].votekick});
            }
        }
    })
    soc.on('Player_Death',()=>{
        players[soc.id].dead = true;

        soc.broadcast.emit('Player_Death',players[soc.id])

        var livecount = 0;
        var lastliveSid = false;
        Object.keys(players).forEach(sid=>{
            if(!players[sid].dead){
                livecount++;
                lastliveSid=sid;
            } 
        });
        if(livecount<2){
            var winner=lastliveSid?players[lastliveSid]:false;
            soc.broadcast.emit('Game_End',winner)
            soc.emit('Game_End', winner);
        }
    });
    soc.on('disconnect', ()=>{
        if(players[soc.id]){
            soc.broadcast.emit('Player_Leave', soc.id)
            delete players[soc.id];
        }
    })

    //TODO reset all maps
    //TODO route map updates
    //TODO gamestart/stop
    //TODO 
})

http.listen(8181);
