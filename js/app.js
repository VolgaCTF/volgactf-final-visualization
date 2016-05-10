var app = {
    
    fireActionsCache: [],
    
    options: {
        url: 'ws://ololo',
        testData: '{"" : ""}',
        players: ['player1','player2','player3','player4','player5','player6', 'player7', 'player8', 'player9'],        
 //disablePlayers: [],        
        teams: [
            {teamId: 1, name: 'PLAYER1', position: {x: 200, y: 75 }, labelPosition: {x: 0, y: 0}, color: '' },            
            {teamId: 2, name: 'PLAYER2', position: {x: 700, y: 75 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 3, name: 'PLAYER3', position: {x: 800, y: 225 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 4, name: 'PLAYER4', position: {x: 800, y: 375 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 5, name: 'PLAYER5', position: {x: 700, y: 525 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 6, name: 'PLAYER6', position: {x: 200, y: 525 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 7, name: 'PLAYER7', position: {x: 100, y: 375 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 8, name: 'PLAYER8', position: {x: 100, y: 225 }, labelPosition: {x: 0, y: 0}, color: ''},            
            {teamId: 9, name: 'PLAYER9', position: {x: 450, y: 525}, labelPosition: {x: 0, y: 0}, color: ''}
        ],
        services: [
            {serviceId: 0, seviceName: 'Service1', color: 'red'},
            {serviceId: 1, seviceName: 'Service1', color: 'blue'},
            {serviceId: 2, seviceName: 'Service1', color: 'green'},
            {serviceId: 3, seviceName: 'Service1', color: 'silver'},
            {serviceId: 4, seviceName: 'Service1', color: 'yellow'},
            ],
        width: 1000,
        height: 700
    },
    
    //initServices: function(){}

    init: function(){
        
        var self = this,
            data = self.options.testData;
            
        var game = new Phaser.Game(self.options.width, self.options.height, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {

            game.load.spritesheet('ball', 'assets/particles/plasmaball.png', 128, 128);
        }

        var sprite;
        var emitter;
        var path;
        var index;
        var filter;
        var filterL;

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
            
            //add physics
            game.physics.startSystem(Phaser.Physics.ARCADE);

            filter = new Phaser.Filter(game, null, fragmentSrc);
            filter.setResolution(self.options.width, self.options.height);

            sprite = game.add.sprite();
            sprite.width = self.options.width;
            sprite.height = self.options.height;

            sprite.filters = [ filter ];
            
            //create players
            self.options.teams.forEach(function(teamItem){
                                
                var player = game.add.sprite(teamItem.position.x, teamItem.position.y, 'ball');
                
                initServices(teamItem);
                
                //filterL = game.add.filter('LightBeam', 800, 600);
                //player.filters = [filterL];
                
                createText(teamItem.position.x + teamItem.labelPosition.x, teamItem.position.y - teamItem.labelPosition.y, teamItem.name);
                
                
            });
            ////////////////
            
            
            //onAction DEMO - TEST
            setTimeout(function(){
                                
                onAtack(self.options.teams[0], self.options.teams[2], 0);
                
                setTimeout(function(){
                    
                    onServiceStateChange({teamId: 2, serviceId: 3, state: 'down'});        
                    
                }, 6000);
                
            }, 3000);
            /////////////////////
               
        }
        
        function initServices(teamItem){
            
            teamItem.services = [];
            
            var topPaddVar = 0;
            
            //console.log(game);            
            app.options.services.forEach(function(service){
                   
                var serviceObj = {
                    serviceId: service.serviceId, 
                    sprite: new Phaser.Rectangle(teamItem.position.x + 130, teamItem.position.y + topPaddVar, 15, 15),                   
                    state: 'enabled'
                };
                
                topPaddVar += 20;
                
                teamItem.services.push(serviceObj);
                
                game.debug.geom(serviceObj.sprite, service.color);
                //game.debug.renderRectangle(serviceObj.sprite,'#0fffff');
                //console.log(serviceObj.sprite);
                                  
                
            });           
            
        }

        function update() {
            
            self.fireActionsCache.forEach(function(actCacheItem, key){
                
               var pos = actCacheItem.sprite.position;
               
               
               pos.setTo(pos.x + actCacheItem.posVariable.x, pos.y + actCacheItem.posVariable.y);
                
                if (parseInt(pos.x, 10) >= actCacheItem.targetPosition.x) {
                    actCacheItem.sprite.destroy();
                    self.fireActionsCache.splice(key, 1);
                }
                
                
            });
            
            filter.update(game.input.activePointer);
            
        }
        
        //onAtack
        function onAtack(sourceObj, targetObj, serviceId){
            
            //console.log(targetObj.services[serviceId].sprite);
            //fix fixed service id
            var sPos = sourceObj.position;
            var tPos = targetObj.services[serviceId].sprite;
            
            var fireAct = {
                sprite: game.add.sprite(sPos.x, sPos.y, 'ball'),
                targetPosition: {x: tPos.x, y: tPos.y},
                posVariable: {x: (tPos.x - sPos.x) / 120, 
                              y: (tPos.y - sPos.y) / 120}   
            };
                        
            self.fireActionsCache.push(fireAct);
                                        
        }
        ////////////
        
        // Смена статуса сервиса
        function onServiceStateChange(stateObj){
            if(stateObj){
                
                self.options.teams.forEach(function(team){
                   
                    if(team.teamId == stateObj.teamId){
                        
                        if(stateObj.state == 'down'){
                        console.log(team.services[stateObj.serviceId].sprite);
                            //team.services[stateObj.serviceId].sprite.destroy();
                            game.debug.geom(team.services[stateObj.serviceId].sprite, '#000');
                            team.services.splice(stateObj.serviceId, 1);
                            
                        }
                        
                    }    
                    
                });
                
            }        
        }
        ///////////////
        
        // Здесь работа с серваком, вызов статуса и 
        function connectToSocket(){
                        
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