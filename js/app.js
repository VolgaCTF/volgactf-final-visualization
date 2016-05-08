var app = {
    
    fireActionsCache: [],
    
    options: {
        url: 'ws://ololo',
        testData: '{"" : ""}',
        players: ['player1','player2','player3','player4','player5','player6', 'player7', 'player8'],        
        disablePlayers: [],        
        playersOptions: [
            {name: 'player1', position: {x: 200, y: 75 }},            
            {name: 'player2', position: {x: 600, y: 75 }},            
            {name: 'player3', position: {x: 700, y: 225 }},            
            {name: 'player4', position: {x: 700, y: 375 }},            
            {name: 'player5', position: {x: 600, y: 525 }},            
            {name: 'player6', position: {x: 200, y: 525 }},            
            {name: 'player7', position: {x: 100, y: 375 }},            
            {name: 'player8', position: {x: 100, y: 225 }},            
        ]
    },
    
    init: function(){
        
        var self = this,
            data = self.options.testData;
            
        var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {

            game.load.image('space', 'assets/misc/starfield.jpg');
            game.load.image('fire1', 'assets/particles/fire1.png');
            game.load.image('fire2', 'assets/particles/fire2.png');
            game.load.image('fire3', 'assets/particles/fire3.png');
            game.load.image('smoke', 'assets/particles/smoke-puff.png');

            game.load.spritesheet('ball', 'assets/particles/plasmaball.png', 128, 128);

        }

        var sprite;
        var emitter;
        var path;
        var index;

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
                                
                var player = new Phaser.Circle(playerItem.position.x, playerItem.position.y, 50);
                game.debug.geom(player,'#0fffff');
                createText(playerItem.position.x - 30, playerItem.position.y - 55, playerItem.name);
                //createText(16 + (pl * 100), 16, self.options.players[pl]);
                
            });
            ////////////////
            
            
            //fireAction
            setTimeout(function(){
                
                var ff = new Phaser.Circle(20, 20, 20);
                
                game.debug.geom(ff,'#fff');
                
                //fireAction(self.options.playersOptions[0], self.options.playersOptions[3]);
                
                
                console.log(self.fireActionsCache);
                
            }, 3000);    
        }

        function update() {
            //console.log(self.fireActionsCache);
            self.fireActionsCache.forEach(function(actCacheItem){
                
               var px = actCacheItem.sprite.x;
               var py = actCacheItem.sprite.y;

               //actCacheItem.sprite.setTo(px + 1);
               px *= -1;
               py *= -1;
               //game.world.wrap(actCacheItem.sprite, 64);
                
            });
            
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
            
            var fireAct = {
                sprite: new Phaser.Circle(20, 20, 20),
                targetPosition: {x: 0, y: 20}     
            };
            
            game.debug.geom(fireAct.sprite,'#fff');
            
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