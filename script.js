var touchSupport = typeof window.ontouchstart == 'undefined' ? 0 : 1;
var touchEvents = [{
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
}, {
    start: 'touchstart',
    move: 'touchmove',
    end: 'touchend'
}];
touchEvents = touchEvents[touchSupport];

jQuery.fn.extend({
    getTranslate: function () {
        var matrix = this.css('transform');
        if (matrix.indexOf('matrix3d') === 0) {
            var translate = this.getTranslate3d();
            return {
                x: translate.x,
                y: translate.y
            };
        } else if (matrix.indexOf('matrix') < 0) {
            return {
                x: 0,
                y: 0
            };
        } else {
            var matrixArr = matrix.substring(7, matrix.length - 1).split(',');
            return {
                x: +matrixArr[4],
                y: +matrixArr[5]
            };
        }
    },
    getTranslate3d: function () {
        var matrix = this.css('transform');
        if (matrix.indexOf('matrix3d') < 0) {
            return $.extend({
                z: 0
            }, this.getTranslate());
        } else {
            var matrixArr = matrix.substring(9, matrix.length - 1).split(',');
            return {
                x: +matrixArr[12],
                y: +matrixArr[13],
                z: +matrixArr[14]
            };
        }
    },
    highlight: function () {
        this.addClass("h").siblings().removeClass("h");
    },
    transmove: function (newpos, time, callback) {
        time = time || 0;
        this.css({
            "transform": "translate3d(" + (newpos || 0) + "px,0px,0px)",
            "transition-duration": time + "ms"
        });
        if (typeof callback == "function") {
            setTimeout(callback, time);
        }
    },
    init_slide: function () {
        if (this.length < 1) {
            return this;
        }
        this.each(function () {
            var slide = $(this);
            var pics = slide.find(".slide_pic");
            var tabs = slide.find(".slide_tab");
            var imgs = pics.children("li");
            var lens = imgs.length;
            if (lens < 2) {
                tabs.remove();
                return false;
            }
            for (var i = 0; i < lens; i++) {
                tabs.append("<li></li>");
            }
            tabs.css('margin-left', -4 - 10 * lens);
            tabs.find('li').eq(0).highlight();
            imgs.eq(0).addClass('show');
            var nowidx = 0;
            var moving = false;
            var automove = null;
            var autospeed = 5000;
            var domove = function (toidx) {
                if (moving) return false;
                clearTimeout(automove);
                var targ = imgs.eq(toidx);
                targ.addClass('next');
                var npic = imgs.eq(nowidx);
                moving = true;
                tabs.find('li').eq(toidx).highlight();
                npic.fadeOut(500, function () {
                    npic.removeClass('show').show();
                    targ.addClass('show').removeClass('next');
                    nowidx = toidx;
                    moving = false;
                    automove = setTimeout(function () {
                        movenext();
                    }, autospeed);
                });
            };
            var movenext = function () {
                var toidx = nowidx < lens - 1 ? nowidx + 1 : 0;
                domove(toidx);
            };
            var moveprev = function () {
                var toidx = nowidx > 0 ? nowidx - 1 : lens - 1;
                domove(toidx);
            };
            slide.on("click", ".slide_prev", moveprev)
                .on("click", ".slide_next", movenext)
                .on("click", ".slide_tab li", function () {
                    var toidx = $(this).index();
                    domove(toidx);
                });
            automove = setTimeout(movenext, autospeed);
        });
        return this;
    },
    init_slider: function (tabs, afterslide) {
        if (this.length < 1) {
            return this;
        }
        var vp = this.find(".viewport");
        var vpli = vp.find(".sitem");
        var vpwh = vp.width();
        var offset = 0;
        var direct = 0;
        var moving = false;
        var bemove = false;
        var lens = vpli.length;
        if (lens < 2) {
            vp.transmove(offset);
            vpli.eq(0).addClass("h");
            return this;
        } else {
            vp.prepend($(vpli[lens - 1]).clone());
            vp.append($(vpli[0]).clone());
            vp.transmove(offset - vpwh);
            vpli.eq(0).addClass("h");
        }
        if (typeof tabs == "string") {
            tabs = this.find(tabs);
        } else if (tabs) {
            tabs = $(tabs);
        } else {
            tabs = "<ul class='dots'>";
            for (var d = 0; d < lens; d++) {
                if (d < 1) {
                    tabs += "<li class='h'></li>";
                } else {
                    tabs += "<li></li>";
                }
            }
            tabs += "</ul>";
            tabs = $(tabs).appendTo(this);
        }
        var dots = tabs.children();
        var nearid, pos = {},
            kpos = [];
        for (var i = 0; i < lens; i++) {
            kpos[i] = -1 * vpwh * (i + 1) + offset;
        }
        var findnear = function () {
            var npos = pos.now + direct * vpwh * 0.3;
            var nearid = -1,
                mindis = 0,
                distance;
            for (var i in kpos) {
                distance = Math.abs(npos - kpos[i]);
                if (nearid < 0 || distance < mindis) {
                    mindis = distance;
                    nearid = i;
                }
            }
            return nearid;
        };
        dots.on("click", function () {
            nearid = $(this).index();
            vpli.eq(nearid).highlight();
            vp.transmove(kpos[nearid], 300);
            dots.eq(nearid).highlight();
            typeof afterslide == "function" && afterslide(nearid);
        });
        var initidx = tabs.find(".h").index();
        if (initidx > 0) {
            vpli.eq(initidx).highlight();
            vp.transmove(kpos[initidx], 0);
            typeof afterslide == "function" && afterslide(initidx);
        }
        vp.on("click", "a", function () {
            if (bemove) {
                return false;
            }
        }).on(touchEvents.start, function (e) {
            moving = true;
            bemove = false;
            e = e.originalEvent || e;
            pos.now = vp.getTranslate3d().x;
            if (touchSupport) {
                pos.x0 = e.touches[0].pageX;
                pos.y0 = e.touches[0].pageY;
            } else {
                pos.x0 = e.clientX;
                pos.y0 = e.clientY;
                e.preventDefault();
            }
        }).on(touchEvents.move, function (e) {
            if (moving) {
                bemove = true;
                e = e.originalEvent || e;
                if (touchSupport) {
                    pos.x1 = e.touches[0].pageX;
                    pos.y1 = e.touches[0].pageY;
                } else {
                    pos.x1 = e.clientX;
                    pos.y1 = e.clientY;
                }
                var movelen = pos.x1 - pos.x0;
                direct = (movelen > 0) ? 1 : -1;
                var horiz = Math.abs(pos.y1 - pos.y0) < Math.abs(movelen);
                if (horiz) {
                    e.preventDefault();
                    vp.transmove(pos.now + movelen);
                }
            }
        });
        // some browser cannot add on vp (ios safari)
        $(document.body).on(touchEvents.end, function () {
            if (moving) {
                moving = false;
                pos.now = vp.getTranslate3d().x;
                var threshold = direct * vpwh * 0.3;
                if (pos.now > kpos[0] + threshold) {
                    nearid = lens - 1;
                    vp.find(".sitem").first().highlight();
                    vp.transmove(offset, 300, function () {
                        vpli.eq(nearid).highlight();
                        vp.transmove(kpos[nearid], 0);
                    });
                } else if (pos.now < kpos[lens - 1] + threshold) {
                    nearid = 0;
                    vp.find(".sitem").last().highlight();
                    vp.transmove(kpos[lens - 1] - vpwh, 300, function () {
                        vpli.eq(nearid).highlight();
                        vp.transmove(kpos[nearid], 0);
                    });
                } else {
                    nearid = findnear();
                    vpli.eq(nearid).highlight();
                    vp.transmove(kpos[nearid], 300);
                }
                dots.eq(nearid).highlight();
                typeof afterslide == "function" && afterslide(nearid);
            }
            // donot return
        });
        return this;
    }
});