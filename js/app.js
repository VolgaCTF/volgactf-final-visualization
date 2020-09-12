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
        case 1: return '#600';
        case 2: return '#660';
        case 3: return '#006';
        case 4: return '#060';
        case 5: return '#606';
        case 6: return '#066';
        default: return '#666';
    }
}

function calculatePosition (self, teamNumber, numberOfTeams) {
    var t = 2 * Math.PI * teamNumber / numberOfTeams;
    var a = (self.options.width - self.xGapLeft - self.xGapRight) / 2;
    var b = (self.options.height - self.yGapTop - self.yGapBottom) / 2;
    var x = a * Math.cos(t);
    var y = b * Math.sin(t);
    return {
        x: x + self.xGapLeft + a,
        y: y + self.yGapTop + b
    };
}

function calculateCaptionPosition(self, teamNumber, numberOfTeams) {
    var t = 2 * Math.PI * teamNumber / numberOfTeams;
    var a = (self.options.width - self.xGapLeft2 - self.xGapRight2) / 2;
    var b = (self.options.height - self.yGapTop2 - self.yGapBottom2) / 2;
    var x = a * Math.cos(t);
    var y = b * Math.sin(t);
    return {
        x: x + self.xGapLeft2 + a,
        y: y + self.yGapTop2 + b
    };
}

function calculateCaptionAngle(teamNumber, numberOfTeams) {
    var angle = 2 * Math.PI * teamNumber / numberOfTeams;
    if (angle >= 0.0 && angle < (Math.PI / 2)) {
        return angle * 45 - 90;
    } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        return (angle - Math.PI / 2) * 45;
    } else if (angle >= Math.PI && angle < (3 * Math.PI / 2)) {
        return (angle - Math.PI) * 45 - 90;
    } else if (angle >= (3 * Math.PI / 2) && angle < (2 * Math.PI)) {
        return (angle - 3 * Math.PI / 2) * 45;
    } else {
        return 0;
    }
}

function calculateArcAngle(teamNumber, numberOfTeams) {
    var angle = 2 * Math.PI * teamNumber / numberOfTeams;
    if (angle >= 0.0 && angle < (Math.PI / 2)) {
        return angle * 45 - 90;
    } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        return (angle - Math.PI / 2) * 45;
    } else if (angle >= Math.PI && angle < (3 * Math.PI / 2)) {
        return (angle - Math.PI) * 45 - 270;
    } else if (angle >= (3 * Math.PI / 2) && angle < (2 * Math.PI)) {
        return (angle - 3 * Math.PI / 2) * 45 - 180;
    } else {
        return 0;
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
    options: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
    },
    fontSize: 15,
    fontName: 'Courier',
    teamSpriteSize: 64,
    fireballSpriteSize: 128,
    textHeight: null,
    xGapLeft: null,
    xGapRight: null,
    yGapTop: null,
    yGapBottom: null,
    serviceStateArcGap: 2,
    serviceStateArcThickness: 3,
    captionShift: null,

    init: function() {
        var self = app;
        var game = new Phaser.Game(self.options.width, self.options.height, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

        function preload() {
            if (unratedVersion) {
                game.load.spritesheet('unrated', 'assets/particles/unrated.png', self.fireballSpriteSize, self.fireballSpriteSize);
            }
            game.load.spritesheet('bubble', 'assets/particles/bubble.png', self.teamSpriteSize, self.teamSpriteSize);
            game.load.spritesheet('red', 'assets/particles/red.png', self.fireballSpriteSize, self.fireballSpriteSize);
            game.load.spritesheet('yellow', 'assets/particles/yellow.png', self.fireballSpriteSize, self.fireballSpriteSize);
            game.load.spritesheet('blue', 'assets/particles/blue.png', self.fireballSpriteSize, self.fireballSpriteSize);
            game.load.spritesheet('green', 'assets/particles/green.png', self.fireballSpriteSize, self.fireballSpriteSize);
            game.load.spritesheet('white', 'assets/particles/white.png', self.fireballSpriteSize, self.fireballSpriteSize);
            game.load.spritesheet('cyan', 'assets/particles/cyan.png', self.fireballSpriteSize, self.fireballSpriteSize);
            game.load.spritesheet('purple', 'assets/particles/purple.png', self.fireballSpriteSize, self.fireballSpriteSize);
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

            var probeText = game.add.text(0, 0, 'ABCDEFyqpgj|^_');
            probeText.font = self.fontName;
            probeText.fontSize = self.fontSize;
            self.textHeight = probeText.height;
            self.xGapLeft = self.teamSpriteSize / 2 + self.textHeight + self.serviceStateArcGap * 3 + self.serviceStateArcThickness * 2 + 0;
            self.xGapRight = self.teamSpriteSize / 2 + self.textHeight + self.serviceStateArcGap * 3 + self.serviceStateArcThickness * 2 + 0;
            self.yGapTop = self.teamSpriteSize / 2 + self.textHeight + self.serviceStateArcGap * 3 + self.serviceStateArcThickness * 2 + 0;
            self.yGapBottom = self.teamSpriteSize / 2 + self.textHeight + self.serviceStateArcGap * 3 + self.serviceStateArcThickness * 2 + 30;

            self.xGapLeft2 = self.textHeight / 2 + 0;
            self.xGapRight2 = self.textHeight / 2 + 0;
            self.yGapTop2 = self.textHeight / 2 + 0;
            self.yGapBottom2 = self.textHeight / 2 + 30;

            self.options.teams.forEach(function(team, ndx, arr) {
                team.position = calculatePosition(self, ndx, arr.length);
                var teamBase = game.add.sprite(team.position.x, team.position.y, 'bubble');
                teamBase.anchor.setTo(0.5, 0.5);

                initServices(ndx);

                var caption = game.add.text(0, 0, team.name);
                caption.font = self.fontName;
                caption.fontSize = self.fontSize;
                caption.fill = '#ffffff';
                caption.anchor.setTo(0.5, 0.5);
                caption.angle = calculateCaptionAngle(ndx, arr.length);

                var captionPosition = calculateCaptionPosition(self, ndx, arr.length);
                caption.x = captionPosition.x;
                caption.y = captionPosition.y;
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
            var itemPositionX = self.options.width / 2 - 75;
            var itemPositionYStart = self.options.height / 2 - 75;

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
                text.font = self.fontName;
                text.fontSize = self.fontSize;
                text.fill = '#ffffff';
            });
        }

        function renderTeamPushServiceState(game, team, service, angle, serviceNdx, state) {
            var segmentGrad = 360 / self.options.services.length;
            var arcStart = game.math.degToRad(serviceNdx * segmentGrad + angle + 2);
            var arcEnd = game.math.degToRad((serviceNdx + 1) * segmentGrad + angle - 2);
            var graphics = game.add.graphics(team.position.x, team.position.y);
            var c = Phaser.Color.hexToColor(state == 1 ? getUpColor(service.id) : getDownColor(service.id));
            graphics.lineStyle(self.serviceStateArcThickness, Phaser.Color.packPixel(c.b, c.g, c.r, c.a));
            graphics.arc(0, 0, self.teamSpriteSize / 2 + self.serviceStateArcThickness * 2 + self.serviceStateArcGap * 2, arcStart, arcEnd, false);
        }

        function renderTeamPullServiceState(game, team, service, angle, serviceNdx, state) {
            var segmentGrad = 360 / self.options.services.length;
            var arcStart = game.math.degToRad(serviceNdx * segmentGrad + angle + 2);
            var arcEnd = game.math.degToRad((serviceNdx + 1) * segmentGrad + angle - 2);
            var graphics = game.add.graphics(team.position.x, team.position.y);
            var c = Phaser.Color.hexToColor(state == 1 ? getUpColor(service.id) : getDownColor(service.id));
            graphics.lineStyle(self.serviceStateArcThickness, Phaser.Color.packPixel(c.b, c.g, c.r, c.a));
            graphics.arc(0, 0, self.teamSpriteSize / 2 + self.serviceStateArcThickness + self.serviceStateArcGap, arcStart, arcEnd, false);
        }

        function initServices(teamNdx) {
            var team = self.options.teams[teamNdx];
            var angle = calculateArcAngle(teamNdx, self.options.teams.length);
            self.options.services.forEach(function(service, serviceNdx) {
                renderTeamPushServiceState(game, team, service, angle, serviceNdx, 0);
                renderTeamPullServiceState(game, team, service, angle, serviceNdx, 0);
            });
        }

        function update() {
            self.fireActionsCache.forEach(function(actCacheItem, key){
                var pos = actCacheItem.sprite.position;

                pos.setTo(pos.x + actCacheItem.posVariable.x, pos.y + actCacheItem.posVariable.y);

                if (unratedVersion) {
                    actCacheItem.sprite.angle += 5;
                }

                var x = parseInt(pos.x, 10);
                var y = parseInt(pos.y, 10);

                if (Math.abs(x - actCacheItem.targetPosition.x) < 10 && Math.abs(y - actCacheItem.targetPosition.y) < 10) {
                    actCacheItem.sprite.destroy();
                    self.fireActionsCache.splice(key, 1);

                    var explosion = game.add.sprite(x, y, 'explosion');
                    explosion.anchor.setTo(0.5, 0.5);
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
                x: actorTeam.position.x,
                y: actorTeam.position.y
            };
            var targetPos = {
                x: targetTeam.position.x,
                y: targetTeam.position.y
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
            fireAct.sprite.anchor.setTo(0.5, 0.5);
            self.fireActionsCache.push(fireAct);
        }

        function onTeamServicePushStateChange(teamId, serviceId, serviceState){
            var teamNdx = self.options.teams.findIndex(function (team) {
                return team.id === teamId;
            });
            var serviceNdx = self.options.services.findIndex(function (service) {
                return service.id === serviceId;
            })
            renderTeamPushServiceState(
                game,
                self.options.teams[teamNdx],
                self.options.services[serviceNdx],
                calculateArcAngle(teamNdx, self.options.teams.length),
                serviceNdx,
                serviceState
            );
        }

        function onTeamServicePullStateChange(teamId, serviceId, serviceState){
            var teamNdx = self.options.teams.findIndex(function (team) {
                return team.id === teamId;
            });
            var serviceNdx = self.options.services.findIndex(function (service) {
                return service.id === serviceId;
            })
            renderTeamPullServiceState(
                game,
                self.options.teams[teamNdx],
                self.options.services[serviceNdx],
                calculateArcAngle(teamNdx, self.options.teams.length),
                serviceNdx,
                serviceState
            );
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