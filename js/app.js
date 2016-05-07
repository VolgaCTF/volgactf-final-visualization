var app = {
    
    options: {
        url: '',
        testData: '{"" : ""}',
        players: ['player1','player2','player3','player4','player5','player6', 'player7', 'player8'],        
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

            game.physics.startSystem(Phaser.Physics.ARCADE);

            //game.add.tileSprite(0, 0, game.width, game.height, 'space');

            emitter = game.add.emitter(game.world.centerX, game.world.centerY, 400);

            emitter.makeParticles( [ 'fire1', 'fire2', 'fire3', 'smoke' ] );

            emitter.gravity = 200;
            emitter.setAlpha(1, 0, 3000);
            emitter.setScale(0.8, 0, 0.8, 0, 3000);

            emitter.start(false, 3000, 5);

            sprite = game.add.sprite(0, 300, 'ball', 0);

            game.physics.arcade.enable(sprite);

            game.physics.arcade.gravity.y = 150;
            game.physics.arcade.checkCollision.left = false;
            game.physics.arcade.checkCollision.right = false;

            sprite.body.setSize(80, 80, 0, 0);
            sprite.body.collideWorldBounds = true;
            sprite.body.bounce.set(1);
            sprite.body.velocity.set(300, 200);

            sprite.inputEnabled = true;

            sprite.input.enableDrag();
            sprite.events.onDragStart.add(onDragStart, this);
            sprite.events.onDragStop.add(onDragStop, this);

            sprite.animations.add('pulse');
            sprite.play('pulse', 30, true);

            sprite.anchor.set(0.5);
            
            //create players
            for(var pl = 0; pl < self.options.players.length; pl++){
                
                var player = new Phaser.Rectangle(0, 0, 50, 50);
                game.debug.geom(player,'#0fffff');
                createText(16 + (pl * 100), 16, self.options.players[pl]);
                
            }
            ////////////////

        }

        function update() {

            var px = sprite.body.velocity.x;
            var py = sprite.body.velocity.y;

            px *= -1;
            py *= -1;

            emitter.minParticleSpeed.set(px, py);
            emitter.maxParticleSpeed.set(px, py);

            emitter.emitX = sprite.x;
            emitter.emitY = sprite.y;

            // emitter.forEachExists(game.world.wrap, game.world);
            game.world.wrap(sprite, 64);

        }

        function onDragStart() {
            sprite.body.moves = false;
        }

        function onDragStop() {
            sprite.body.moves = true;
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
            text.setShadow(2, 2, 'rgba(0, 0, 0, 0.7)', 2);

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
    
}

window.onload = function(){
    
    app.init();
    
}