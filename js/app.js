var app = {
    
    fireActionsCache: [],
    
    options: {
        url: 'ws://ololo',
        testData: '{"" : ""}',
        players: ['player1','player2','player3','player4','player5','player6', 'player7', 'player8'],        
        disablePlayers: [],        
        playersOptions: [
            {name: 'PLAYER1', position: {x: 200, y: 75 }},            
            {name: 'PLAYER2', position: {x: 600, y: 75 }},            
            {name: 'PLAYER3', position: {x: 700, y: 225 }},            
            {name: 'PLAYER4', position: {x: 700, y: 375 }},            
            {name: 'PLAYER5', position: {x: 600, y: 525 }},            
            {name: 'PLAYER6', position: {x: 200, y: 525 }},            
            {name: 'PLAYER7', position: {x: 100, y: 375 }},            
            {name: 'PLAYER8', position: {x: 100, y: 225 }},            
        ]
    },
    
    init: function(){
        
        var self = this,
            data = self.options.testData;
            
        var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {

            game.load.spritesheet('ball', 'assets/particles/plasmaball.png', 128, 128);

        }

        var sprite;
        var emitter;
        var path;
        var index;
        var ff;

        function create() {

            var fragmentSrc = [

                "precision mediump float;",

                "uniform float     time;",
                "uniform vec2      resolution;",

                "#define PI 0.01",

                "void main( void ) {",

                    "vec2 p = ( gl_FragCoord.xy / resolution.xy ) - 0.5;",

                    "float sx = 0.2*sin( 25.0 * p.y - time * 5.);",

                    "float dy = 0.9/ ( 50. * abs(p.y - sx));",

                    "gl_FragColor = vec4( (p.x + 0.5) * dy, 0.5 * dy, dy-1.65, 5.0 );",

                "}"
            ];

            filter = new Phaser.Filter(game, null, fragmentSrc);
            filter.setResolution(800, 600);

            sprite = game.add.sprite();
            sprite.width = 800;
            sprite.height = 600;

            sprite.filters = [ filter ];
            
            //create players
            self.options.playersOptions.forEach(function(playerItem){
                                
                var player = game.add.sprite(playerItem.position.x, playerItem.position.y, 'ball');
                //var playerSprite = game.add.sprite(0,100,player);
                //console.log(playerSprite);
                //game.debug.geom(player,'#0fffff');
                createText(playerItem.position.x - 40, playerItem.position.y - 55, playerItem.name);
                //createText(16 + (pl * 100), 16, self.options.players[pl]);
                
            });
            ////////////////
            
            
            //fireAction
            setTimeout(function(){
                
                //ff = game.add.sprite(300, 300, 'ball');
                
                //game.debug.geom(ff,'#fff');
                
                fireAction(self.options.playersOptions[0], self.options.playersOptions[2]);
                
                
                //console.log(ff);
                
            }, 3000);    
        }

        function update() {
            //console.log(self.fireActionsCache);
            self.fireActionsCache.forEach(function(actCacheItem, key){
                
               var pos = actCacheItem.sprite.position;
               //var py = actCacheItem.sprite.body.velocity.y;
               //actCacheItem.sprite()
               pos.setTo(pos.x + actCacheItem.posVariable.x, pos.y + actCacheItem.posVariable.y);
                console.log(parseInt(pos.x, 10));
                //ffff
                if(parseInt(pos.x, 10) >= 500 
                && parseInt(pos.x, 10) <= 700){
                    actCacheItem.sprite.destroy();
                    self.fireActionsCache.splice(key, 1);
                }
              // actCacheItem.sprite.setTo(px + 1);
               //px.set(px) += 1;
               //py *= -10;
               //game.world.wrap(actCacheItem.sprite, 64);
                
            });
            
            //ff.scale.x *= ff.scale.x;
            
            filter.update(game.input.activePointer);

            //var px = sprite.body.velocity.x;
            //var py = sprite.body.velocity.y;

            //px *= -1;
            //py *= -1;

            //emitter.minParticleSpeed.set(px, py);
            //emitter.maxParticleSpeed.set(px, py);

            //emitter.emitX = sprite.x;
            //emitter.emitY = sprite.y;

            // emitter.forEachExists(game.world.wrap, game.world);
            //game.world.wrap(sprite, 64);

        }
        
        //fireAction
        function fireAction(sourceObj, targetObj){
            
            var sPos = sourceObj.position;
            var tPos = targetObj.position;
            
            var fireAct = {
                sprite: game.add.sprite(sPos.x, sPos.y, 'ball'),
                targetPosition: {x: tPos.x, y: tPos.y},
                posVariable: {x: (tPos.x - sPos.x) / 120, 
                              y: (tPos.y - sPos.y) / 120}   
            };
            
            //fireAct.sprite.anchor.setTo(0.5, 0.5);
            //fireAct.sprite.scale.setTo(2, 2);
            
            //game.debug.geom(fireAct.sprite,'#fff');
            
            self.fireActionsCache.push(fireAct);
                                        
        }
        ////////////
        
        function connectToSocket(){
            
            var socket = new WebSocket(self.options.url);
            
            socket.onopen = function() {
                console.log("Соединение установлено.");
            };

            socket.onclose = function(event) {
            if (event.wasClean) {
                console.log('Соединение закрыто');
            } else {
                console.log('Обрыв соединения');
            }
                console.log('Код: ' + event.code + ' причина: ' + event.reason);
            };

            socket.onmessage = function(event) {
                console.log("Получены данные " + event.data);
            };

            socket.onerror = function(error) {
                console.log("Ошибка " + error.message);
            };
        }
        
        function createText(x, y, string) {

            var text = game.add.text(x, y, string);
            // text.anchor.set(0.5);
            // text.align = 'center';

            //  Font style
            text.font = 'Arial Black';
            text.fontSize = 20;
            // text.fontWeight = 'bold';
            text.fill = '#ffffff';
            //text.setShadow(2, 2, 'rgba(0, 0, 0, 0.7)', 2);

            return text;

        }


        function render() {

            // game.debug.bodyInfo(sprite, 32, 32);

        }
            
        
    },
    
    // Метод для получения данных о состоянии игры
    getData: function(callback){
      
      var self = this,
          url = options.url;
          
      if(url != ''){
          $.get(url).done(function(data){
             
              callback(data);
              
          });          
      }   
        
    },
    
    socketConnection: function(){
        
        var self = this;
        
        
        
    }
    
}

window.onload = function(){
    
    app.init();
    
}