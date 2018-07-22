import '../styles/main.scss'

var game = new Phaser.Game(960, 540, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });



//把定义好的场景添加到游戏中
game.state.add('boot',game.States.boot);
game.state.add('preload',game.States.preload); 
game.state.add('menu',game.States.menu); 
game.state.add('play',game.States.play);
 
//调用boot场景来启动游戏

game.state.start('boot');

game.States = {};
game.States.boot = function(){
    this.preload = function(){
        game.load.image('loading',require('../images/laoding.jpg')); //加载进度条图片资源
    };
    this.create = function(){
        game.state.start('preload'); //加载完成后，调用preload场景
    };
} 
game.States.prelaod = function(){
    this.preload = function(){
        var preloadSprite = game.add.sprite(50,game.height/2,'loading');
        game.load.setPreloadSprite(preloadSprite);

        game.load.image('bullet', require('../images/bullet.png'));
        game.load.image('enemyBullet', require('../images/enemy-bullet.png'));
        game.load.spritesheet('invader', require('../images/invader32x32x4-2.png'), 32, 32);
        game.load.image('ship', require('../images/egg.svg'));
        game.load.spritesheet('kaboom', require('../images/explode.png'), 128, 128);
        game.load.image('starfield', require('../images/bg.png'))
        game.load.image('life', require('../images/life.svg'));
    }

    this.create = function(){
        game.state.start('menu'); //当以上所有资源都加载完成后就可以进入menu游戏菜单场景了
    }    
} 
game.States.menu = function(){
    this.create = function(){
        game.add.tileSprite(0,0,game.width,game.height,'starfield').autoScroll(-10,0); //背景图

        var titleGroup = game.add.group(); //创建存放标题的组
        titleGroup.create(0,0,'life'); //标题
        var bird = titleGroup.create(190, 10, 'bird'); //添加bird到组里
        bird.animations.add('fly'); //添加动画
        bird.animations.play('fly',12,true); //播放动画
        titleGroup.x = 35;
        titleGroup.y = 100;
        var btn = game.add.button(game.width/2,game.height/2,'btn',function(){//按钮
            game.state.start('play');
        });
        btn.anchor.setTo(0.5,0.5);
    } 
}


game.States.play = function(){
    var player;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var fireButton;
var explosions;
var starfield;
var score = 0;
var scoreString = '';
var scoreText;
var lives;
var enemyBullet;
var firingTimer = 0;
var stateText;
var livingEnemies = [];
var enemyBullets;
var live;
var bullet;
var life;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 960, 540, 'starfield');

    //  Our bullet group
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    // The enemy's bullets
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);

    //  The hero!
    player = game.add.sprite(480, 460, 'ship');
    player.anchor.setTo(0.5, 0.5);
    player.scale.setTo(0.6, 0.6);
    game.physics.enable(player, Phaser.Physics.ARCADE);

    //  The baddies!
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;

    createAliens();

    //  The score
    scoreString = 'SCORE : ';
    scoreText = game.add.text(20, 20, scoreString + score, { font: '28px Gaegu', fill: '#49634f' });

    //  Lives
    lives = game.add.group();
    game.add.text(game.world.width - 200, 20, 'LIVES', { font: '28px Gaegu', fill: '#49634f' });

    //  Text
    stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '80px Gaegu', fill: '#49634f', align: "center" });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    for (var i = 0; i < 3; i++) 
    {
        var ship = lives.create(game.world.width - 100 + (30 * i), 40, 'life');
        ship.anchor.setTo(0.5, 0.5);
        ship.scale.setTo(0.15, 0.15);
        ship.angle = 0;
        ship.alpha = 1;
    }

    //  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
}

function createAliens () {

    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 10; x++)
        {
            var alien = aliens.create(x * 48, y * 50, 'invader');
            alien.anchor.setTo(0.5, 0.5);
            alien.animations.add('fly', [ 0, 1, 2, 3 ], 10, true);
            alien.play('fly');
            alien.body.moves = false;
        }
    }

    aliens.x = 100;
    aliens.y = 50;

    //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
    var tween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

    //  When the tween loops it calls descend
    tween.onLoop.add(descend, this);
}

function setupInvader (invader) {

    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

}

function descend() {

    aliens.y += 10;

}

function update() {

    //  Scroll the background
    starfield.tilePosition.x += 2;

    if (player.alive)
    {
        //  Reset the player, then check for movement keys
        player.body.velocity.setTo(0, 0);

        if (cursors.left.isDown)
        {
            player.body.velocity.x = -200;
        }
        else if (cursors.right.isDown)
        {
            player.body.velocity.x = 200;
        }
        else if (cursors.up.isDown)
        {
            player.body.velocity.y = -200;
        }
        else if (cursors.down.isDown)
        {
            player.body.velocity.y = 200;
        }

        //  Firing?
        if (fireButton.isDown)
        {
            fireBullet();
        }

        if (game.time.now > firingTimer)
        {
            enemyFires();
        }

        //  Run collision
        game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
        game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);
    }

}

function render() {

    // for (var i = 0; i < aliens.length; i++)
    // {
    //     game.debug.body(aliens.children[i]);
    // }

}

function collisionHandler (bullet, alien) {

    //  When a bullet hits an alien we kill them both
    bullet.kill();
    alien.kill();

    //  Increase the score
    score += 20;
    scoreText.text = scoreString + score;

    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play('kaboom', 30, false, true);

    if (aliens.countLiving() == 0)
    {
        score += 1000;
        scoreText.text = scoreString + score;

        enemyBullets.callAll('kill',this);
        stateText.text = " You Won! \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyHitsPlayer (player,bullet) {
    
    bullet.kill();

    live = lives.getFirstAlive();

    if (live)
    {
        live.kill();
    }

    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x, player.body.y);
    explosion.play('kaboom', 30, false, true);

    // When the player dies
    if (lives.countLiving() < 1)
    {
        player.kill();
        enemyBullets.callAll('kill');

        stateText.text=" GAME OVER \n Click to restart";
        stateText.visible = true;

        //the "click to restart" handler
        game.input.onTap.addOnce(restart,this);
    }

}

function enemyFires () {

    //  Grab the first bullet we can from the pool
    enemyBullet = enemyBullets.getFirstExists(false);

    livingEnemies.length=0;

    aliens.forEachAlive(function(alien){

        // put every living enemy in an array
        livingEnemies.push(alien);
    });


    if (enemyBullet && livingEnemies.length > 0)
    {
        
        var random=game.rnd.integerInRange(0,livingEnemies.length-1);

        // randomly select one of them
        var shooter=livingEnemies[random];
        // And fire the bullet from this enemy
        enemyBullet.reset(shooter.body.x, shooter.body.y);

        game.physics.arcade.moveToObject(enemyBullet,player,120);
        firingTimer = game.time.now + 2000;
    }

}

function fireBullet () {

    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTime)
    {
        //  Grab the first bullet we can from the pool
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            //  And fire it
            bullet.reset(player.x, player.y + 8);
            bullet.body.velocity.y = -400;
            bulletTime = game.time.now + 200;
        }
    }

}

function resetBullet (bullet) {

    //  Called if the bullet goes out of the screen
    bullet.kill();

}

function restart () {

    //  A new level starts
    
    //resets the life count
    lives.callAll('revive');
    //  And brings the aliens back from the dead :)
    aliens.removeAll();
    createAliens();

    //revives the player
    player.revive();
    //hides the text
    stateText.visible = false;

}

} 
