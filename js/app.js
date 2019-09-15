var screenWidth = document.documentElement.clientWidth;
var screenHeight = document.documentElement.clientHeight;

var teamSpriteWidth = 64;
var teamSpriteHeight = 64;

var teamStateGap = 5;
var stateStateGap = 2;
var stateLabelGap = 5;

var stateItemGap = 2;
var stateItemWidth = 10;
var stateItemHeight = 10;

var stateHeight = stateItemHeight * 2 + stateStateGap;

var fontSize = 15;
var fontName = 'Courier';

var xGapStart = teamSpriteWidth / 2 + 5;
var xGapEnd = teamSpriteWidth / 2 + 5;
var yGapStart = teamSpriteWidth / 2 + teamStateGap + stateHeight + stateLabelGap + fontSize + 10;
var yGapEnd = teamSpriteWidth / 2 + teamStateGap + stateHeight + stateLabelGap + fontSize + 10;

var fireballSpriteWidth = 128;
var fireballSpriteHeight = 128;

var unratedVersion = (new URL(window.location.href)).searchParams.get('unrated') === 'yes'

function getServiceSpriteName(serviceId) {
    if (unratedVersion) {
        return 'unrated'
    }
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
        return 'bottomRight';
    } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        return 'bottomLeft';
    } else if (angle >= Math.PI && angle < (3 * Math.PI / 2)) {
        return 'topLeft';
    } else if (angle >= (3 * Math.PI / 2) && angle < (2 * Math.PI)) {
        return 'topRight';
    } else {
        return 'unknown';
    }
}

function getRandomInt (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var app = {
    fireActionsCache: [],
    explosionComplete: [],
    legendElements: [],
    teamServicePushStateElements: [],
    teamServicePullStateElements: [],
    options: {
        width: screenWidth,
        height: screenHeight
    },

    init: function() {
        var self = app;
        var game = new Phaser.Game(self.options.width, self.options.height, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {
            if (unratedVersion) {
                game.load.spritesheet('unrated', 'assets/particles/unrated.png', fireballSpriteWidth, fireballSpriteHeight);
            }
            game.load.spritesheet('bubble', 'assets/particles/bubble.png', teamSpriteWidth, teamSpriteHeight);
            game.load.spritesheet('red', 'assets/particles/red.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('yellow', 'assets/particles/yellow.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('blue', 'assets/particles/blue.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('green', 'assets/particles/green.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('white', 'assets/particles/white.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('cyan', 'assets/particles/cyan.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('purple', 'assets/particles/purple.png', fireballSpriteWidth, fireballSpriteHeight);
            game.load.spritesheet('explosion', 'assets/sprites/explosion.png', 64, 64, 24);
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

            game.physics.startSystem(Phaser.Physics.ARCADE);

            filter = new Phaser.Filter(game, null, fragmentSrc);
            filter.setResolution(self.options.width, self.options.height);

            sprite = game.add.sprite();
            sprite.width = self.options.width;
            sprite.height = self.options.height;

            sprite.filters = [ filter ];

            self.options.teams.forEach(function(team, ndx, arr) {
                team.position = calculatePosition(ndx, arr.length);
                var quadrant = getQuadrant(ndx, arr.length);
                var player = game.add.sprite(team.position.x - teamSpriteWidth / 2, team.position.y - teamSpriteHeight / 2, 'bubble');

                initServices(team, quadrant);

                var text = game.add.text(0, 0, team.name);
                text.font = fontName;
                text.fontSize = fontSize;
                text.fill = '#ffffff';

                var teamLabelX = team.position.x;
                var teamLabelY = team.position.y;
                switch (quadrant) {
                    case 'bottomLeft':
                        teamLabelX = team.position.x - teamSpriteWidth / 2;
                        teamLabelY = team.position.y + teamSpriteHeight / 2 + teamStateGap + stateHeight + stateLabelGap;
                        break;
                    case 'bottomRight':
                        teamLabelX = team.position.x + teamSpriteWidth / 2 - text.width;
                        teamLabelY = team.position.y + teamSpriteHeight / 2 + teamStateGap + stateHeight + stateLabelGap;
                        break;
                    case 'topLeft':
                        teamLabelX = team.position.x - teamSpriteWidth / 2;
                        teamLabelY = team.position.y - teamSpriteHeight / 2 - teamStateGap - stateHeight - stateLabelGap - text.height;
                        break;
                    case 'topRight':
                        teamLabelX = team.position.x + teamSpriteWidth / 2 - text.width;
                        teamLabelY = team.position.y - teamSpriteHeight / 2 - teamStateGap - stateHeight - stateLabelGap - text.height;
                        break;
                    default:
                        break;
                }

                text.x = Math.round(teamLabelX);
                text.y = Math.round(teamLabelY);
            });

            initLegend();

            fetch('/api/team/service/push-states')
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
                    onTeamServicePushStateChange(params.team_id, params.service_id, params.state);
                });
            });

            fetch('/api/team/service/pull-states')
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
                    onTeamServicePullStateChange(params.team_id, params.service_id, params.state);
                });
            });

            var eventSource = new window.EventSource('/stream/');
            eventSource.addEventListener('log', function (e) {
                var data = JSON.parse(e.data);
                if (data.type === 31) {
                    onTeamServicePushStateChange(data.params.team_id, data.params.service_id, data.params.state);
                } else if (data.type === 32) {
                    onTeamServicePullStateChange(data.params.team_id, data.params.service_id, data.params.state);
                } else if (data.type === 4) {
                    onAttack(data.params.actor_team_id, data.params.target_team_id, data.params.target_service_id);
                }
            })
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
                    color: getUpColor(service.id)
                });
                self.legendElements.push({
                    sprite: sprite2,
                    color: getDownColor(service.id)
                })
                var text = game.add.text(Math.round(itemPositionX + gapWidth * 2 + itemWidth * 2), Math.round(itemPositionY), service.name);
                text.font = fontName;
                text.fontSize = fontSize;
                text.fill = '#ffffff';
            });
        }

        function initServices(team, quadrant) {
            var totalServices = self.options.services.length

            var stateTotalWidth = totalServices * stateItemWidth + (totalServices - 1) * stateItemGap

            var startX = team.position.x
            var startY = team.position.y

            switch (quadrant) {
                case 'topLeft':
                    startX = team.position.x - teamSpriteWidth / 2
                    startY = team.position.y - teamSpriteHeight / 2 - teamStateGap - stateHeight
                    break
                case 'bottomLeft':
                    startX = team.position.x - teamSpriteWidth / 2
                    startY = team.position.y + teamSpriteHeight / 2 + teamStateGap
                    break
                case 'topRight':
                    startX = team.position.x + teamSpriteWidth / 2 - stateTotalWidth
                    startY = team.position.y - teamSpriteHeight / 2 - teamStateGap - stateHeight
                    break
                case 'bottomRight':
                    startX = team.position.x + teamSpriteWidth / 2 - stateTotalWidth
                    startY = team.position.y + teamSpriteHeight / 2 + teamStateGap
                    break
                default:
                    break;
            }

            self.options.services.forEach(function(service, ndx) {
                var itemPositionX = startX + ndx * stateItemWidth + ndx * stateItemGap;
                var pushItemPositionY = startY
                self.teamServicePushStateElements.push({
                    teamId: team.id,
                    serviceId: service.id,
                    sprite: new Phaser.Rectangle(itemPositionX, pushItemPositionY, stateItemWidth, stateItemHeight),
                    color: getDownColor(service.id)
                });
                var pullItemPositionY = startY + stateItemHeight + stateStateGap
                self.teamServicePullStateElements.push({
                    teamId: team.id,
                    serviceId: service.id,
                    sprite: new Phaser.Rectangle(itemPositionX, pullItemPositionY, stateItemWidth, stateItemHeight),
                    color: getDownColor(service.id)
                });
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

                    var explosion = game.add.sprite(x + teamSpriteWidth / 2, y + teamSpriteHeight / 2, 'explosion');
                    var explosionAnimation = explosion.animations.add('go off');
                    explosionAnimation.killOnComplete = true;
                    explosionAnimation.onComplete.add(function () {
                        self.explosionComplete.push(this);
                    }, explosion)
                    explosion.animations.play('go off', 30, false);
                }
            });

            self.explosionComplete.forEach(function (sprite, key) {
                sprite.destroy();
                self.explosionComplete.splice(key, 1);
            })

            filter.update(game.input.activePointer);
        }

        function onAttack (actorId, targetId, targetServiceId) {
            var actorTeam = self.options.teams.find(function (team) {
                return team.id === actorId;
            });

            var targetTeam = self.options.teams.find(function(team) {
                return team.id === targetId;
            });

            var sourcePos = {
                x: actorTeam.position.x - fireballSpriteWidth / 2,
                y: actorTeam.position.y - fireballSpriteHeight / 2
            };
            var targetPos = {
                x: targetTeam.position.x - fireballSpriteWidth / 2,
                y: targetTeam.position.y - fireballSpriteHeight / 2
            };

            var spriteName = getServiceSpriteName(targetServiceId);

            var strikeLenX = targetPos.x - sourcePos.x
            var strikeLenY = targetPos.y - sourcePos.y
            var strikeLen = Math.sqrt(strikeLenX * strikeLenX + strikeLenY * strikeLenY)

            var velocity = getRandomInt(6, 10);

            var angleSin = strikeLenY / strikeLen;
            var angleCos = strikeLenX / strikeLen;

            var shiftX = angleCos * velocity;
            var shiftY = angleSin * velocity;

            var fireAct = {
                sprite: game.add.sprite(sourcePos.x, sourcePos.y, spriteName),
                targetPosition: {
                    x: targetPos.x,
                    y: targetPos.y
                },
                posVariable: {
                    x: shiftX,
                    y: shiftY
                }
            };
            self.fireActionsCache.push(fireAct);
        }

        function onTeamServicePushStateChange(teamId, serviceId, serviceState){
            for (var i = 0; i < self.teamServicePushStateElements.length; ++i) {
                if (self.teamServicePushStateElements[i].teamId === teamId && self.teamServicePushStateElements[i].serviceId === serviceId) {
                    self.teamServicePushStateElements[i].color = (serviceState === 1) ? getUpColor(serviceId) : getDownColor(serviceId)
                }
            }
        }

        function onTeamServicePullStateChange(teamId, serviceId, serviceState){
            for (var i = 0; i < self.teamServicePullStateElements.length; ++i) {
                if (self.teamServicePullStateElements[i].teamId === teamId && self.teamServicePullStateElements[i].serviceId === serviceId) {
                    self.teamServicePullStateElements[i].color = (serviceState === 1) ? getUpColor(serviceId) : getDownColor(serviceId)
                }
            }
        }

        function render() {
            for (var i = 0; i < app.legendElements.length; ++i) {
                game.debug.geom(app.legendElements[i].sprite, app.legendElements[i].color);
            }
            for (var i = 0; i < app.teamServicePushStateElements.length; ++i) {
                game.debug.geom(app.teamServicePushStateElements[i].sprite, app.teamServicePushStateElements[i].color);
            }
            for (var i = 0; i < app.teamServicePullStateElements.length; ++i) {
                game.debug.geom(app.teamServicePullStateElements[i].sprite, app.teamServicePullStateElements[i].color);
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
                id: serviceData.id,
                name: serviceData.name
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
                    id: teamData.id,
                    name: teamData.name
                };
            });

            app.options.services = servicesOptions;
            app.options.teams = teamsOptions;
            app.init();
        });
    });
}