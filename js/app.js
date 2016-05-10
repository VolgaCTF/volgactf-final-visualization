var screenWidth = document.documentElement.clientWidth;
var screenHeight = document.documentElement.clientHeight;

var xGapStart = 25;
var xGapEnd = 175;
var yGapStart = 25;
var yGapEnd = 150;

function calculatePosition (width, height, xGapStart, xGapEnd, yGapStart, yGapEnd, teamNumber, numberOfTeams) {
    var t = 2 * Math.PI * teamNumber / numberOfTeams
    var a = (width - xGapStart - xGapEnd) / 2
    var b = (height - yGapStart - yGapEnd) / 2
    var x = a * Math.cos(t)
    var y = b * Math.sin(t)
    return {
        x: x + xGapStart + a,
        y: y + yGapStart + b
    }
}

function getServices () {
    return [
        {
            serviceId: 1,
            serviceState: 'down',
            sprite: null
        },
        {
            serviceId: 2,
            serviceState: 'down',
            sprite: null
        },
        {
            serviceId: 3,
            serviceState: 'down',
            sprite: null
        },
        {
            serviceId: 4,
            serviceState: 'down',
            sprite: null
        }
    ]
}

var app = {
    fireActionsCache: [],
    options: {
        teams: [
            {teamId: 1, services: getServices(), name: 'FTeam', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 0, 9), labelPosition: {x: 20, y: 10} },
            {teamId: 2, services: getServices(), name: 'EpicFairPlay', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 1, 9), labelPosition: {x: -20, y: 10} },
            {teamId: 3, services: getServices(), name: 'Koibasta', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 2, 9), labelPosition: {x: 10, y: 10} },
            {teamId: 4, services: getServices(), name: 'KED', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 3, 9), labelPosition: {x: 40, y: 10} },
            {teamId: 5, services: getServices(), name: 'Пиксели', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 4, 9), labelPosition: {x: 0, y: 10} },
            {teamId: 6, services: getServices(), name: 'Bushwhackers', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 5, 9), labelPosition: {x: -40, y: 10} },
            {teamId: 7, services: getServices(), name: 'UFOlogists', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 6, 9), labelPosition: {x: 0, y: 10} },
            {teamId: 8, services: getServices(), name: 'PWNCult', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 7, 9), labelPosition: {x: 10, y: 10} },
            {teamId: 9, services: getServices(), name: 'SiBears', position: calculatePosition(screenWidth, screenHeight, xGapStart, xGapEnd, yGapStart, yGapEnd, 8, 9), labelPosition: {x: 20, y: 10} }
        ],
        services: [
            {serviceId: 1, serviceName: 'digidocs', upColor: '#f00', downColor: '#600' },
            {serviceId: 2, serviceName: 'mobile-profile', upColor: '#ff0', downColor: '#660' },
            {serviceId: 3, serviceName: 'sociality', upColor: '#00f', downColor: '#006' },
            {serviceId: 4, serviceName: 'weather', upColor: '#0f0', downColor: '#060' }
        ],
        width: screenWidth,
        height: screenHeight
    },

    //initServices: function(){}

    init: function(){

        var self = this;

        var game = new Phaser.Game(self.options.width, self.options.height, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {
            game.load.spritesheet('ball', 'assets/particles/plasmaball.png', 128, 128);
            game.load.spritesheet('red', 'assets/particles/red.png', 128, 128);
            game.load.spritesheet('yellow', 'assets/particles/yellow.png', 128, 128);
            game.load.spritesheet('blue', 'assets/particles/blue.png', 128, 128);
            game.load.spritesheet('green', 'assets/particles/green.png', 128, 128);
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
            self.options.teams.forEach(function(team){

                var player = game.add.sprite(team.position.x, team.position.y, 'ball');

                initServices(team);

                //filterL = game.add.filter('LightBeam', 800, 600);
                //player.filters = [filterL];

                createText(team.position.x + team.labelPosition.x, team.position.y - team.labelPosition.y, team.name);
            });
            ////////////////
            //onAction DEMO - TEST

            var eventSource = new window.EventSource('/stream/')
            eventSource.addEventListener('log', function (e) {
                let data = JSON.parse(e.data)
                if (data.type === 3) {
                    console.log(data)
                    onServiceStateChange(data.params.team_id, data.params.service_id, data.params.state)
                } else if (data.type === 4) {
                    console.log(data)
                    onAttack(data.params.attack_team_id, data.params.victim_team_id, data.params.service_id)
                }
            })


            // setTimeout(function() {
            //     onAttack(1, 4, 1);
            //     // setTimeout(function(){
            //     //     onServiceStateChange({teamId: 2, serviceId: 3, state: 'down'});
            //     // }, 6000);
            // }, 3000);

            // setTimeout(function() {
            //     onAttack(3, 4, 2);
            // }, 3500);

            // setTimeout(function() {
            //     onAttack(3, 6, 3);
            // }, 4000);
            // /////////////////////

            // setTimeout(function() {
            //     onAttack(4, 7, 4);
            // }, 4500);

            // setTimeout(function() {
            //     onServiceStateChange(1, 1, 'up');
            //     onServiceStateChange(1, 2, 'up');
            //     onServiceStateChange(1, 3, 'up');
            //     onServiceStateChange(1, 4, 'up');
            // }, 2000)

            // setTimeout(function() {
            //     onServiceStateChange(5, 1, 'up');
            //     onServiceStateChange(5, 2, 'up');
            //     onServiceStateChange(5, 3, 'up');
            //     onServiceStateChange(5, 4, 'up');
            // }, 4000)
        }

        function initServices(team) {
            //console.log(game);
            team.services.forEach(function(record) {
                var service = self.options.services.find(function(service) {
                    return service.serviceId === record.serviceId;
                });
                if (!record.sprite) {
                    record.sprite = new Phaser.Rectangle(team.position.x + 130, team.position.y + 25 + (record.serviceId - 1) * 20, 15, 15);
                }
                game.debug.geom(record.sprite, (record.serviceState === 'up') ? service.upColor : service.downColor);
                //game.debug.renderRectangle(serviceObj.sprite,'#0fffff');
                //console.log(serviceObj.sprite);

            });
        }

        function update() {
            self.fireActionsCache.forEach(function(actCacheItem, key){
                var pos = actCacheItem.sprite.position;

                pos.setTo(pos.x + actCacheItem.posVariable.x, pos.y + actCacheItem.posVariable.y);

                var x = parseInt(pos.x, 10)
                var y = parseInt(pos.y, 10)

                if (Math.abs(x - actCacheItem.targetPosition.x) < 10 && Math.abs(y - actCacheItem.targetPosition.y) < 10) {
                    actCacheItem.sprite.destroy();
                    self.fireActionsCache.splice(key, 1);
                }
            });

            filter.update(game.input.activePointer);

        }

        function onAttack (attackerId, victimId, serviceId) {
            var sourceObj = self.options.teams.find(function (team) {
                return team.teamId === attackerId;
            });

            var targetObj = self.options.teams.find(function(team) {
                return team.teamId === victimId;
            });

            //console.log(targetObj.services[serviceId].sprite);
            //fix fixed service id
            var sPos = sourceObj.position;
            var tPos = targetObj.position;

            var spriteName = 'ball'
            switch (serviceId) {
                case 1: spriteName = 'red'; break;
                case 2: spriteName = 'yellow'; break;
                case 3: spriteName = 'blue'; break;
                case 4: spriteName = 'green'; break;
                default: break
            }

            var fireAct = {
                sprite: game.add.sprite(sPos.x, sPos.y, spriteName),
                targetPosition: {x: tPos.x, y: tPos.y},
                posVariable: {x: (tPos.x - sPos.x) / 120,
                              y: (tPos.y - sPos.y) / 120}
            };
            self.fireActionsCache.push(fireAct);
        }
        ////////////

        // Смена статуса сервиса
        function onServiceStateChange(teamId, serviceId, serviceState){
            var team = self.options.teams.find(function(team) {
                return team.teamId === teamId;
            });

            var record = team.services.find(function(rec) {
                return rec.serviceId === serviceId;
            });

            record.serviceState = serviceState

            self.options.teams.forEach(function(team) {
                initServices(team)
            })
        }
        ///////////////

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
    }
}

window.onload = function(){

    app.init();

}