(function () {
    var Music = window.Music = function () {
        var self = this;
        //播放器
        this.player = document.getElementsByClassName('musicPlayer')[0];
        this.audio = this.player.getElementsByClassName('myAudio')[0];
        this.name = this.player.getElementsByClassName('musicName')[0];
        this.img = this.player.getElementsByClassName('musicImg')[0];
        this.bgPic = this.player.getElementsByClassName('bgPic')[0];
        this.loading = this.player.getElementsByClassName('loading')[0];
        //进度条
        this.progress = this.player.getElementsByClassName('progressBar')[0];
        this.progressAll = this.progress.getElementsByClassName('progressAll')[0];
        this.progressPoint = this.progress.getElementsByClassName('progressPoint')[0];
        this.progressTime = this.progress.getElementsByClassName('progressTime')[0];
        this.progressAllTime = this.progress.getElementsByClassName('progressAllTime')[0];
        this.progressBuffer = this.progress.getElementsByClassName('progressBuffer')[0];

        //按钮
        this.button = this.player.getElementsByClassName('button')[0];
        this.playButton = this.button.getElementsByClassName('playButton')[0];
        this.preButton = this.button.getElementsByClassName('preButton')[0];
        this.nextButton = this.button.getElementsByClassName('nextButton')[0];
        this.listButton = this.button.getElementsByClassName('listButton')[0];
        this.downloadButton = this.button.getElementsByClassName('downloadButton')[0];
        //音量按钮
        this.volume = $('.volume');

        //歌词
        this.lyric = this.player.getElementsByClassName('lyric')[0];
        this.lyricList = this.lyric.getElementsByClassName('lyricList')[0];
        this.lyrica = this.lyric.getElementsByClassName('lyricli1')[0];
        this.lyricb = this.lyric.getElementsByClassName('lyricli2')[0];

        //列表
        this.playingList = document.getElementsByClassName('playingList')[0];

        //SmallScreen
        this.smallScreen = new SmallScreen();

        //List
        this.listObj = new List(this.playingList);              //创建播放列表
        //设置滑动元素
        self.listObj.scrollElement = $('.playing')[0];

        //Sheet
        this.sheetObj = new Sheet();

        //Search
        this.searchObj = new Search();

        //Menu
        this.menuObj = new Menu([{
            title: "编辑",
            fun: function () {
                self.listObj.deleteList();
            }
        }]);

        //smallScreen.tools   定位到当前歌曲
        this.tool = this.smallScreen.addTools('dot-circle-o', function () {
            SmallScreen.toScrollTop(self.smallScreen.content[0], $('.musicList li.ing')[0].offsetTop - innerHeight * 0.382);
        }, '定位到当前歌曲');


        //音乐来源

        Music.FLOOR = 100;
        this.lyricObj = new Lyric();            //歌词对象
        this.music = new GetMusic();            //音乐资源对象

        this.srList = [];          //搜索列表
        this.m;             //所选音乐的信息
        //播放顺序
        this.sequenceObj = new Sequence();

        //初始化
        this.init();
        //设置大小
        this.dynamicSize();

        this.audio.volume = 0.1;        //音量

    }


    //加载音乐并播放
    Music.prototype.loadMusic = function (autoPlay) {
        if (autoPlay === undefined) {
            autoPlay = true;
        }
        var self = this;
        this.changListColor();          //改变播放列表颜色
        var now = self.sequenceObj.now();
        //判断是否为同一首歌
        if (self.listObj.list[now].id == self.preMusicId) {
            if (autoPlay && self.audio.paused) {
                self.play();
            }
            return;
        }
        self.preMusicId = self.listObj.list[now].id;


        var timer = setTimeout(function () {
            self.loading.className = "loading";
        }, 500);
        console.info(now);


        //设置歌曲id
        self.music.musicId = self.listObj.list[now].id;
        self.music.picId = self.listObj.list[now].pic_id;
        self.music.lyricId = self.listObj.list[now].lyric_id;
        self.music.source = self.listObj.list[now].source;

        self.music.getMusic(function (m) {
            self.m = m;
            if(self.m.music.url == ""){     //歌曲没有版权，加载下一首
                self.sequenceObj.next();
                self.loadMusic();
            }
            self.audio.oncanplay = function () {
                console.info('canplay');
                if (autoPlay) {
                    self.play();
                }
                self.loading.className = "loaded";
            }
            self.setMusic(m.music.url, self.listObj.list[now].name + ' - ' + self.listObj.list[now].artist, m.pic.url);       //设置音频，图片
            self.lyricObj.m = self.m;               //传入歌词数据
            self.lyricObj.setLyric();               //设置大屏歌词
            self.lyricObj.backTop();                //返回歌词顶部
            clearInterval(timer);
        });
    }



    //歌词显示
    Music.prototype.moveLyric = function () {
        var self = this;
        var pre = self.lyricObj.m.lyric.index;
        if (!this.m.lyric.y[0]) {
            this.lyrica.innerHTML = "没有歌词";
            this.lyricb.innerHTML = "没有歌词";
            return;
        }
        that = this.m.lyric.time[Object.keys(self.m.lyric.time)[pre]];
        if (this.lyrica.offsetTop < 0 && pre != this.m.lyric.preTime) {        //a在上时
            //移动到上面
            this.lyricb.style.top = -40 + 'px';     //b上去
            //两个元素一起滑下
            this.lyrica.innerHTML = that + "";      //显示歌词
            this.m.lyric.preTime = pre;             //储存时间
            this.lyrica.style.top = 0 + 'px';       //a下来
        }
        else if (this.lyricb.offsetTop < 0 && pre != this.m.lyric.preTime) {        //b在上时
            //移动到上面
            this.lyrica.style.top = -40 + 'px';     //a上去
            //两个元素一起滑下
            this.lyricb.innerHTML = that + "";
            this.m.lyric.preTime = pre;
            this.lyricb.style.top = 0 + 'px';       //b下来
        }
        return;

    }


    Music.prototype.useSheet = function (index, autoplay) {
        var self = this;
        if (autoplay === undefined) {
            autoplay = true;
        }
        //移除旧列表
        self.listObj.removeAll();
        self.listObj.removeHList();
        //将获取到的歌单解析到list中
        self.listObj.list = self.sheetObj.parseSheet(index);
        //如果还没有加载该歌单
        if (!self.listObj.list) {
            return;
        }
        music.sequenceObj.index = 0;
        music.sequenceObj.setLen(music.listObj.list.length);
        console.info(music.sequenceObj.now());
        //推入HTML中
        self.listObj.pushList(function (index) {
            self.listObj.playFunction(index);
        }, false); //不使用列表动画
        self.loadMusic(autoplay);
    }

    Music.prototype.refresh = function () {
        var self = this;
        self.progressTime.innerHTML = Music.addZero(new Date(self.audio.currentTime * 1000).getMinutes()) + ':' + Music.addZero(new Date(self.audio.currentTime * 1000).getSeconds());
        //歌词滚动
        self.lyricObj.moveLyric();
        if (!this.smallScreen.isFull) {
            self.moveLyric();
        }
    }

    //初始化
    Music.prototype.init = function () {
        var self = this;

        //窗口大小调整
        window.onresize = function () {
            self.dynamicSize();
        }
        //音频
        this.audio.onplay = function () {
            self.playButton.className = "pauseButton";
        }
        //播放结束的动作
        this.audio.onended = function () {
            // self.pause();
            self.sequenceObj.next();        //下一首
            self.loadMusic();
        }

        //音量
        var volumeLine = this.volume.find('.volumeLine');
        var volumeBoll = this.volume.find('.volumeBoll');
        var volumeMove = this.volume.find('.volumeMove');
        var volumeLen = volumeLine.innerWidth();
        this.volume.find('.volumeButton').click(function () {
            self.volume.find('.volumeBox').fadeToggle(300);
            return false;
        });
        $(window).click(function () {
            self.volume.find('.volumeBox').fadeOut(300);
        })
        // 点击
        volumeMove.click(function (e) {
            changeVolume(e.offsetX);
            return false;
        });
        //滑动
        $(window).mouseup(function () {
            volumeMove.unbind('mousemove');
            return false;
        });
        volumeMove.mousedown(function () {
            volumeMove.mousemove(function (e) {
                changeVolume(e.offsetX)
                return false;
            });
            return false;
        });
        changeVolume(50);
        function changeVolume(offsetX) {
            if (offsetX < 6 || offsetX > volumeLen + 6) {
                return;
            }
            volumeBoll.css({
                left: offsetX - 12 + 'px',
            });
            var volume = parseFloat(((offsetX - 6) / volumeLen).toFixed(2));
            volume = volume < 0.05 ? 0 : volume;
            if (volume == 0) {          //音量为0使用这个图标
                self.volume.find('i').attr('class', 'fa fa-volume-off volumeButton');
            }
            else if (volume < 0.5) {
                self.volume.find('i').attr('class', 'fa fa-volume-down volumeButton');
            }
            else {
                self.volume.find('i').attr('class', 'fa fa-volume-up volumeButton');
            }
            self.audio.volume = volume;
        }


        //进度条
        this.progress.onclick = function (e) {
            if (self.audio.src) {
                var x = e.offsetX - 6;
                self.audio.currentTime = x * self.audio.duration / self.progressLen;
                self.progressPoint.style.left = x + 'px';
                music.lyricObj.scrollLyric();       //歌词滚动到当前位置
            }
        }
        this.progress.onmousedown = function () {
            self.progressPoint.style.transition = 'left 0.1s';
            this.onmousemove = function (e) {
                var x = e.offsetX - 6;
                if (self.audio.src) {
                    self.audio.currentTime = x * self.audio.duration / self.progressLen;
                    self.progressPoint.style.left = x + 6 + 'px';
                    self.refresh();
                }
            }
        }
        window.onmouseup = function () {
            self.progressPoint.style.transition = 'left 0.3s';
            self.progress.onmousemove = null;
        }

        this.playButton.onclick = function () {
            if (this.className == "playButton") {
                self.play();
            }
            else {
                self.pause();
            }
        }
        this.downloadButton.onclick = function () {
            if (self.m.music.url) {
                window.open(self.m.music.url);
            }
        }

        this.nextButton.onclick = function () {
            self.sequenceObj.next();
            self.loadMusic();
        }
        this.preButton.onclick = function () {
            self.sequenceObj.previous();
            self.loadMusic();
        }

    }
    Music.prototype.dynamicSize = function () {
        var self = this;
        self.lyricObj.setSize(innerWidth, innerHeight);
        self.smallScreen.setSize(innerWidth, innerHeight);
        self.searchObj.setPosition();
        self.setSize(innerWidth, Music.FLOOR);

    }

    Music.prototype.setMusic = function (src, name, img) {
        var self = this;
        if (src == "") {
            return;
        }
        src = src.replace(/:\/\/m(\d)c/, '://m7');         //去掉c，网易前缀有c会出现请求403
        this.prePlaySrc = self.audio.src;       //存储上次src
        this.m.music.url = src;
        this.audio.src = src;
        this.name.innerHTML = name;
        this.img.style.backgroundImage = 'url(' + img + ')';
        // var imgPixel = new ImagePixel();
        // imgPixel.loadImg(img, function () {
        //     // console.info(imgPixel.getPixel(1,0));
        //     color = imgPixel.maxColor(500);
        //     $('.naviList').css('backgroundColor', color + '7a');
        // });
    }

    Music.prototype.changListColor = function () {
        var list = this.listObj.hList.children;
        for (var i = 0; i < list.length; i++) {
            if (list[i].className == 'ing') {
                list[i].className = ' ';
            }
        }
        this.listObj.hList.children[this.sequenceObj.now()].className = 'ing';
    }

    Music.prototype.play = function () {

        var self = this;
        if (!self.audio.src) {
            return;
        }
        self.audio.play();


        self.audio.onabort = function () {
            console.info('over');
        }

        //设置进度条
        var minutes = new Date(self.audio.duration * 1000).getMinutes();
        var seconds = new Date(self.audio.duration * 1000).getSeconds();
        self.progressAllTime.innerHTML = Music.addZero(minutes) + ':' + Music.addZero(seconds);
        //提前显示
        self.refresh();
        self.progressPoint.style.left = self.progressLen * self.audio.currentTime / self.audio.duration + 'px';         //进度条
        this.timer1;
        this.timer2;
        clearInterval(this.timer1);
        clearInterval(this.timer2);
        this.timer1 = setInterval(function () { self.refresh(); }, 20);
        //进度条定时器刷新时间较慢，因为太快了在滑动或点击时容易卡顿
        this.timer2 = setInterval(function () {
            self.progressLen = self.progressAll.offsetWidth - 6;        //进度条长度
            self.progressPoint.style.left = self.progressLen * self.audio.currentTime / self.audio.duration + 'px';         //进度条
            //显示缓存条
            // var buffer = self.audio.buffered;
            // // if(buffer.)
            // var htmlBuffer = "";
            // for (var i = 0; i < buffer.length; i++) {
            //     var start = self.progressLen * buffer.start(i) / self.audio.duration;
            //     var end = self.progressLen * buffer.end(i) / self.audio.duration;
            //     htmlBuffer += '<span style="left:' + start + 'px;width:' + (end - start) + 'px"></span>';
            //     console.info(i + " : " + buffer.start(i) + ' - ' + buffer.end(i));
            // }
            // self.progressBuffer.innerHTML = htmlBuffer;

        }, 1000);
    }
    Music.prototype.pause = function () {
        this.audio.pause();
        this.playButton.className = "playButton";
    }

    Music.addZero = function (num) {
        return num = num < 10 ? '0' + num : num + "";
    }
    Music.prototype.setSize = function (width, height) {
        //播放器
        this.player.style.width = width + 'px';
        this.player.style.height = height + 'px';
        //图片
        this.img.style.width = height + 'px';
        this.img.style.height = height + 'px';
        this.img.style.backgroundSize = height + 'px ' + height + 'px';
        //加载背景
        this.loading.style.width = width + 'px';
        this.loading.style.height = height + 40 + 'px';
        //背景图片
        this.bgPic.style.width = width + 'px ';
        this.bgPic.style.height = height + 40 + 'px ';
        this.bgPic.style.backgroundSize = width + 'px ';
        //歌名
        this.name.style.left = height + height / 10 + 'px';
        //进度条
        this.progress.style.left = height + height / 10 + 'px';
        this.progress.style.top = height / 3 + 'px';
        this.progress.style.width = width - height - height / 10 - 30 + 'px';
        this.progressAll.style.width = width - height - height / 10 - 30 + 'px';
        //按钮
        this.button.style.left = height + height / 10 + 'px';
        this.button.style.top = height * 2 / 3 + 'px';
        this.button.style.width = width - height - height / 10 - 30 + 'px';

        //歌词
        this.lyric.style.width = width + 'px';
        this.lyrica.style.width = width + 'px';
        this.lyricb.style.width = width + 'px';
        this.lyric.style.top = height - 30 + 'px';

    }
}());