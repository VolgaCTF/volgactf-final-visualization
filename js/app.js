var screenWidth = document.documentElement.clientWidth;
var screenHeight = document.documentElement.clientHeight;

var xGapStart = 75;
var xGapEnd = 75;
var yGapStart = 75;
var yGapEnd = 75;

var teamSpriteWidth = 64;
var teamSpriteHeight = 64;

var fireballSpriteWidth = 128;
var fireballSpriteHeight = 128;

var fontSize = 18;
var labelYGap = 5;

function getServiceSpriteName(serviceId) {
    switch (serviceId) {
        case 1: return 'red';
        case 2: return 'yellow';
        case 3: return 'blue';
        case 4: return 'green';
        case 5: return 'purple';
        case 6: return 'cyan';
        default: return 'white';
    }
}

function getUpColor(serviceId) {
    switch (serviceId) {
        case 1: return '#f00';
        case 2: return '#ff0';
        case 3: return '#00f';
        case 4: return '#0f0';
        case 5: return '#f0f';
        case 6: return '#0ff';
        default: return '#fff';
    }
}

function getDownColor(serviceId) {
    switch (serviceId) {
        case 1: return '#400';
        case 2: return '#440';
        case 3: return '#004';
        case 4: return '#040';
        case 5: return '#404';
        case 6: return '#044';
        default: return '#444';
    }
}

function calculatePosition (teamNumber, numberOfTeams) {
    var t = 2 * Math.PI * teamNumber / numberOfTeams;
    var a = (screenWidth - xGapStart - xGapEnd) / 2;
    var b = (screenHeight - yGapStart - yGapEnd) / 2;
    var x = a * Math.cos(t);
    var y = b * Math.sin(t);
    return {
        x: x + xGapStart + a,
        y: y + yGapStart + b
    };
}

function getQuadrant (teamNumber, numberOfTeams) {
    var angle = 2 * Math.PI * teamNumber / numberOfTeams;
    if (angle >= 0.0 && angle < (Math.PI / 2)) {
        return 'topRight';
    } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        return 'topLeft';
    } else if (angle >= Math.PI && angle < (3 * Math.PI / 2)) {
        return 'bottomLeft';
    } else if (angle >= (3 * Math.PI / 2) && angle < (2 * Math.PI)) {
        return 'bottomRight';
    } else {
        return 'unknown';
    }
}

var app = {
    fireActionsCache: [],
    legendElements: [],
    options: {
        width: screenWidth,
        height: screenHeight
    },

    init: function() {
        var self = app;
        var game = new Phaser.Game(self.options.width, self.options.height, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {
            game.load.spritesheet('bubble', 'assets/particles/bubble.png', teamSpriteWidth, teamSpriteHeight);
            game.load.spritesheet('red', 'assets/particles/red.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('yellow', 'assets/particles/yellow.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('blue', 'assets/particles/blue.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('green', 'assets/particles/green.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('white', 'assets/particles/white.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('cyan', 'assets/particles/cyan.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('purple', 'assets/particles/purple.png', fireballSpriteWidth, fireballSpriteHeight);
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

                    "float sx = 0.2*sin( 25.0 * p.y - time * 2.);",

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

            // var logo = game.add.sprite(screenWidth / 2 - 256, screenHeight / 2 - 256, 'volgactf');

            self.options.teams.forEach(function(team, ndx, arr) {
                team.position = calculatePosition(ndx, arr.length);
                var quadrant = getQuadrant(ndx, arr.length);

                var player = game.add.sprite(team.position.x - teamSpriteWidth / 2, team.position.y - teamSpriteHeight / 2, 'bubble');

                initServices(team, quadrant);

                var teamLabelX = team.position.x - teamSpriteWidth / 2;
                var teamLabelY;
                switch (quadrant) {
                    case 'bottomLeft':
                    case 'bottomRight':
                        teamLabelY = team.position.y - teamSpriteHeight / 2 - fontSize - labelYGap - 5;
                        break;
                    case 'topLeft':
                    case 'topRight':
                    default:
                        teamLabelY = team.position.y + teamSpriteHeight / 2 + labelYGap + 5;
                        break;
                }

                createText(teamLabelX, teamLabelY, team.name);
            });

            initLegend();

            fetch('/api/team/services')
            .then(function(response) {
                if (response.status >= 200 && response.status < 300) {
                    return response.json();
                } else {
                    var err = new Error(response.statusText);
                    err.response = response;
                    throw err;
                }
            })
            .then(function(data) {
                data.forEach(function(params) {
                    onServiceStateChange(params.team_id, params.service_id, params.state);
                });

                var eventSource = new window.EventSource('/stream/');
                eventSource.addEventListener('log', function (e) {
                    var data = JSON.parse(e.data);
                    if (data.type === 3) {
                        onServiceStateChange(data.params.team_id, data.params.service_id, data.params.state);
                    } else if (data.type === 4) {
                        onAttack(data.params.attack_team_id, data.params.victim_team_id, data.params.service_id);
                    }
                })
            });

            // Test
            // setTimeout(function() {
            //     onAttack(1, 4, 1);
            // }, 3000);

            // setTimeout(function() {
            //     onAttack(3, 4, 2);
            // }, 3500);

            // setTimeout(function() {
            //     onAttack(3, 6, 3);
            // }, 4000);

            // setTimeout(function() {
            //     onAttack(4, 7, 4);
            // }, 4500);

            // setTimeout(function() {
            //     onAttack(3, 8, 5);
            // }, 5500);

            // setTimeout(function() {
            //     onAttack(5, 12, 4);
            // }, 6000);

            // setTimeout(function() {
            //     onAttack(7, 14, 5);
            // }, 6500);

            // setTimeout(function() {
            //     onAttack(8, 1, 1);
            // }, 7000);

            // setTimeout(function() {
            //     onAttack(10, 2, 3);
            // }, 7500);

            // setTimeout(function() {
            //     onAttack(13, 6, 4);
            // }, 8000);


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
            // end test
        }

        function initLegend() {
            var gapHeight = 10;
            var gapWidth = 10;
            var itemHeight = 20;
            var itemWidth = itemHeight;
            var itemPositionX = screenWidth / 2 - 75;
            var itemPositionYStart = screenHeight / 2 - 75;

            self.options.services.forEach(function(service, ndx) {
                var itemPositionY = itemPositionYStart + ndx * (itemHeight + gapHeight);
                var sprite = new Phaser.Rectangle(itemPositionX, itemPositionY, itemWidth, itemHeight);
                var sprite2 = new Phaser.Rectangle(itemPositionX + gapWidth + itemWidth, itemPositionY, itemWidth, itemHeight);
                self.legendElements.push({
                    sprite: sprite,
                    color: getUpColor(service.serviceId)
                });
                self.legendElements.push({
                    sprite: sprite2,
                    color: getDownColor(service.serviceId)
                })
                var text = game.add.text(itemPositionX + gapWidth * 2 + itemWidth * 2, itemPositionY, service.serviceName);
                text.font = 'Arial Black';
                text.fontSize = 14;
                text.fill = '#ffffff';
            });
        }

        function initServices(team, quadrant) {
            var totalHeight = teamSpriteHeight + labelYGap * 2;
            var gapHeight = 5;
            var totalGapHeight = gapHeight * (team.services.length - 1);
            var itemHeight = (totalHeight - totalGapHeight) / team.services.length;
            var itemWidth = itemHeight;
            var marginX = 10;

            team.services.forEach(function(record, ndx) {
                var service = self.options.services.find(function(service) {
                    return service.serviceId === record.serviceId;
                });
                var itemPositionX;
                switch (quadrant) {
                    case 'topLeft':
                    case 'bottomLeft':
                        itemPositionX = team.position.x - teamSpriteWidth / 2 - marginX - itemWidth;
                        break;
                    case 'topRight':
                    case 'bottomRight':
                    default:
                        itemPositionX = team.position.x + teamSpriteWidth / 2 + marginX;
                        break;
                }
                var itemPositionY = team.position.y - teamSpriteHeight / 2 - labelYGap + ndx * (itemHeight + gapHeight);
                record.sprite = new Phaser.Rectangle(itemPositionX, itemPositionY, itemWidth, itemHeight);
                game.debug.geom(record.sprite, (record.serviceState === 1) ? getUpColor(service.serviceId) : getDownColor(service.serviceId));
            });
        }

        function update() {
            self.fireActionsCache.forEach(function(actCacheItem, key){
                var pos = actCacheItem.sprite.position;

                pos.setTo(pos.x + actCacheItem.posVariable.x, pos.y + actCacheItem.posVariable.y);

                var x = parseInt(pos.x, 10);
                var y = parseInt(pos.y, 10);

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

            var sourcePos = {
                x: sourceObj.position.x - fireballSpriteWidth / 2,
                y: sourceObj.position.y - fireballSpriteHeight / 2
            };
            var targetPos = {
                x: targetObj.position.x - fireballSpriteWidth / 2,
                y: targetObj.position.y - fireballSpriteHeight / 2
            };

            var spriteName = getServiceSpriteName(serviceId);
            var fireAct = {
                sprite: game.add.sprite(sourcePos.x, sourcePos.y, spriteName),
                targetPosition: {
                    x: targetPos.x,
                    y: targetPos.y
                },
                posVariable: {
                    x: (targetPos.x - sourcePos.x) / 120,
                    y: (targetPos.y - sourcePos.y) / 120
                }
            };
            self.fireActionsCache.push(fireAct);
        }

        function onServiceStateChange(teamId, serviceId, serviceState){
            var team = self.options.teams.find(function(team) {
                return team.teamId === teamId;
            });

            var record = team.services.find(function(rec) {
                return rec.serviceId === serviceId;
            });

            record.serviceState = serviceState;

            self.options.teams.forEach(function(team, ndx, arr) {
                var quadrant = getQuadrant(ndx, arr.length);
                initServices(team, quadrant);
            });
        }

        function createText(x, y, textStr) {
            var text = game.add.text(x, y, textStr);
            // text.anchor.set(0.5);
            // text.align = 'center';

            //  Font style
            text.font = 'Arial Black';
            text.fontSize = fontSize;
            // text.fontWeight = 'bold';
            text.fill = '#ffffff';
            //text.setShadow(2, 2, 'rgba(0, 0, 0, 0.7)', 2);

            return text;
        }

        function render() {
            for (var i = 0; i < app.legendElements.length; ++i) {
                game.debug.geom(app.legendElements[i].sprite, app.legendElements[i].color);
            }

        }
    }
}

window.onload = function() {
    fetch('/api/services')
    .then(function(response) {
        if (response.status >= 200 && response.status < 300) {
            return response.json();
        } else {
            var err = new Error(response.statusText);
            err.response = response;
            throw err;
        }
    })
    .then(function(servicesData) {
        var servicesOptions = servicesData.map(function(serviceData) {
            return {
                serviceId: serviceData.id,
                serviceName: serviceData.name
            };
        });

        fetch('/api/teams')
        .then(function(response) {
            if (response.status >= 200 && response.status < 300) {
                return response.json();
            } else {
                var err = new Error(response.statusText);
                err.response = response;
                throw err;
            }
        })
        .then(function(teamsData) {
            var teamsOptions = teamsData.map(function(teamData) {
                return {
                    teamId: teamData.id,
                    services: servicesData.map(function(serviceData) {
                        return {
                            serviceId: serviceData.id,
                            serviceState: 2,
                            sprite: null
                        };
                    }),
                    name: teamData.name
                };
            });

            app.options.services = servicesOptions;
            app.options.teams = teamsOptions;
            app.init();
        });
    });
}