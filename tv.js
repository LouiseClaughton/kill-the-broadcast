const TVcanvas = document.getElementById("tv");
const TVctx = TVcanvas.getContext("2d");

let t = 0;

function roundedRect(x,y,w,h,r){
    TVctx.beginPath();
    TVctx.moveTo(x+r,y);
    TVctx.lineTo(x+w-r,y);
    TVctx.quadraticCurveTo(x+w,y,x+w,y+r);
    TVctx.lineTo(x+w,y+h-r);
    TVctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    TVctx.lineTo(x+r,y+h);
    TVctx.quadraticCurveTo(x,y+h,x,y+h-r);
    TVctx.lineTo(x,y+r);
    TVctx.quadraticCurveTo(x,y,x+r,y);
    TVctx.closePath();
}

function drawCRTScreen(){

    const x = 140;
    const y = 115;
    const w = 220;
    const h = 170;

    TVctx.save();

    roundedRect(x,y,w,h,16);
    TVctx.clip();

    // glow background
    let glow = TVctx.createRadialGradient(
        x+w/2,
        y+h/2,
        20,
        x+w/2,
        y+h/2,
        180
    );

    glow.addColorStop(0,"#55ffff");
    glow.addColorStop(1,"#001a22");

    TVctx.fillStyle = glow;
    TVctx.fillRect(x,y,w,h);

    // animated noise
    for(let i=0;i<2500;i++){

        const px = x + Math.random()*w;
        const py = y + Math.random()*h;

        const bright = Math.random()*255;

        TVctx.fillStyle =
        `rgba(${bright},${bright},${bright},0.08)`;

        TVctx.fillRect(px,py,1,1);
    }

    // horizontal wobble
    for(let row=0;row<h;row+=2){

        const offset =
        Math.sin(row*0.08+t*8)*1.5;

        TVctx.fillStyle =
        `rgba(255,255,255,0.02)`;

        TVctx.fillRect(
            x+offset,
            y+row,
            w,
            1
        );
    }

    // scanlines
    TVctx.strokeStyle =
    "rgba(0,0,0,0.25)";

    for(let sy=y; sy<y+h; sy+=3){

        TVctx.beginPath();
        TVctx.moveTo(x,sy);
        TVctx.lineTo(x+w,sy);
        TVctx.stroke();
    }

    // RGB bleed
    TVctx.fillStyle =
    "rgba(255,0,0,0.03)";
    TVctx.fillRect(x+2,y,w,h);

    TVctx.fillStyle =
    "rgba(0,255,255,0.03)";
    TVctx.fillRect(x-2,y,w,h);

    // brightness flicker
    const flicker =
    0.05 + Math.random()*0.05;

    TVctx.fillStyle =
    `rgba(255,255,255,${flicker})`;

    TVctx.fillRect(x,y,w,h);

    // curved glass reflection
    const reflect =
    TVctx.createLinearGradient(
        x,y,
        x+w,y+h
    );

    reflect.addColorStop(
        0,
        "rgba(255,255,255,0.25)"
    );

    reflect.addColorStop(
        0.3,
        "rgba(255,255,255,0)"
    );

    TVctx.fillStyle = reflect;

    TVctx.beginPath();
    TVctx.moveTo(x+15,y);
    TVctx.lineTo(x+70,y);
    TVctx.lineTo(x+20,y+h);
    TVctx.lineTo(x,y+h);
    TVctx.closePath();
    TVctx.fill();

    // vignette
    const vignette =
    TVctx.createRadialGradient(
        x+w/2,
        y+h/2,
        40,
        x+w/2,
        y+h/2,
        170
    );

    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,0,0.65)"
    );

    TVctx.fillStyle = vignette;
    TVctx.fillRect(x,y,w,h);

    TVctx.restore();
}

drawCRTScreen();