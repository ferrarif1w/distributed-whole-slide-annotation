/**
 * STRUTTURE DATI E VARIABILI GLOBALI:
 * baseZoom: limite inferiore di intervallo zoom
 * centerToChange: true se bisogna ricalcolare il punto al centro del box
 * curLevel: livello attuale
 * currentCenter: punto attualmente al centro del box rispetto a stdDim
 * currentZoom: zoom attuale (non modificato finchè non viene calcolato nuovo zoom)
 * dimFactor: rapporto tra dimensioni originali di porzione e dimensioni dopo fit a box
 * downsamples: fattori di sottocampionamento
 * imageData: JSON di ultime immagini visualizzate per livelli
 * levelData: dati per cambio livello
 * levelZoomLimits: limiti superiore di zoom, relativi e assoluti
 * maxLevel: livello massimo
 * ogDim: dimensione della porzione, come arrivata da Python
 * permOffset: offset permanente (position di porzione rispetto a box dopo averla impostata)
 * relativeZoom: zoom attuale relativo (derivante direttamente da slider)
 * stdDim: dimensione della porzione, dopo fit a box
 */

async function phpRequest(functionRequest, data = "") {
    var url = "viewer_functions.php?function=" + functionRequest + "&&data=" + data;
    var returnData;
    await fetch(url).then(
        (response)=>{
            if (!response.ok) {
                throw new Error("error");
            }
    
            return response.json();
        }
    ).then(
        (data)=> {
            returnData = data;
        }
    );

    return returnData;
}

function setSlide(data) {
    var image = $("#slide");
    var box = $(".imagecontainer");

    image.attr("src", "data:image/png;base64," + data.image);
    ogDim = {
        left: data.dim[0],
        top: data.dim[1]
    }
    curLevel = data.liv;
    baseZoom = levelZoomLimits[curLevel].absolute;
    relativeZoom = 1;
    currentZoom = 1;
    dimFactor = 1;
    if (ogDim.left >= ogDim.top) dimFactor = box.height() / ogDim.top;
    else dimFactor = box.width() / ogDim.left;
    //dimFactor = Math.floor(dimFactor*100) / 100;
    image.width(ogDim.left * dimFactor);

    stdDim = {
        left: image.width(),
        top: image.height()
    };
    if (stdDim.left == 0) stdDim.left = ogDim.left * dimFactor;
    if (stdDim.top == 0) stdDim.top = ogDim.top * dimFactor;
    setDefaultCenter("lt");
    permOffset = {
        left: image.position().left,
        top: image.position().top,
    }
}

function getCoords(liv, ratio1, cap = maxLevel) {
    //console.log("LIV: " + liv);

    if (liv == cap) {
        let curOgDim = levelData[liv].ogDim;
        return {
            left: curOgDim.left*ratio1.left,
            top: curOgDim.top*ratio1.top
        }
    }

    //console.log("RATIO1: " + Object.entries(ratio1));
    let dim = levelData[liv].size;
    //console.log("DIM: " + Object.entries(dim));

    // ottengo dati
    let aboveLevel = levelData[liv+1];
    let aboveOgDim = aboveLevel.ogDim;
    let aboveRatio = aboveLevel.ratio;
    /*console.log("ABOVEOGDIM: " + Object.entries(aboveOgDim));
    console.log("ABOVERATIO: " + Object.entries(aboveRatio));*/

    // scalare coordinate
    let ratio2 = {
        left: dim.left/aboveOgDim.left,
        top: dim.top/aboveOgDim.top
    };
    //console.log("RATIO2: " + Object.entries(ratio2));

    let shiftedRatio = {
        left: ratio1.left*ratio2.left,
        top: ratio1.top*ratio2.top
    };
    //console.log("SHIFTEDRATIO: " + Object.entries(shiftedRatio));

    // sommarle a coordinate di livello superiore
    let summedRatio = {
        left: aboveRatio.left + shiftedRatio.left,
        top: aboveRatio.top + shiftedRatio.top
    }
    /*console.log("SUMMEDRATIO: " + Object.entries(summedRatio));
    console.log("----------------");*/

    // passare dati a chiamata ricorsiva a livello superiore
    return getCoords(liv+1, summedRatio, cap);
}

function zoomMoveImage(zoom) {
    var box = $(".imagecontainer");
    var image = $("#slide");
    currentZoom = zoom;
    image.width(stdDim.left * zoom);
    let center = {
        left: currentCenter.left*currentZoom,
        top: currentCenter.top*currentZoom
    }
    let imageRange = {
        left: image.width() - box.width(),
        top: image.height() - box.height()
    };
    let shiftedCenter = {
        left: center.left - box.width()/2,
        top: center.top - box.height()/2,
    };
    let percent = {
        left: shiftedCenter.left / imageRange.left,
        top: shiftedCenter.top / imageRange.top
    };
    let maxScroll = {
        left: box.prop("scrollWidth") - box.prop("clientWidth"),
        top: box.prop("scrollHeight") - box.prop("clientHeight")
    };
    box.scrollTop(maxScroll.top * percent.top);
    box.scrollLeft(maxScroll.left * percent.left);

    if (curLevel==maxLevel && zoom==1) setDefaultCenter("tl");
}

function defaultScrollHandler(updateTrue = true) {
    /*$("#offTop").text($("#slide").position().top - permOffset.top);
    $("#offLeft").text($("#slide").position().left - permOffset.left);*/
    if (updateTrue) centerToChange = true;
    else {
        box = $(".imagecontainer");
        box.off("scroll", tmpScrollHandler);
        box.on("scroll", defaultScrollHandler);
    }
}

function tmpScrollHandler() {defaultScrollHandler(false);}

function setDefaultCenter(directions) {
    currentCenter = {left:0, top:0}
    if (directions.includes("l")) currentCenter.left = stdDim.left/2;
    if (directions.includes("t")) currentCenter.top = stdDim.top/2;
}

$(document).ready(async function() {
    centerToChange = false;

    // get slide name from database
    let imageName = $("#imgID").text();
    //let imageID = $("#imgID").text();
    //console.log(imageID);
    //let imageName = await phpRequest("get_image_name", imageID);
    // get starter image
    var slideName = "\"\\images\\" + imageName + "\"";
    var slideNameJson = JSON.stringify({"\"slide\"": slideName});
    var data = await phpRequest("get_starter_image", slideNameJson);
    //console.log(data);
    var data_json = JSON.parse(data);
    maxLevel = data_json.liv;
    let ds = data_json.ds;
    downsamples = ds.split(',').map(Number);
    delete data_json.ds;

    // relativeZoom e absoluteZoom necessari per passare a livello x
    // si parte da livello 0 fino a livello più alto
    //levelZoomLimits = [2,3,5];
    levelZoomLimits = [];
    for (i=maxLevel; i>=0; i--) {
        let dsCurrent = downsamples[i];
        let dsAbove = downsamples[i-1];
        let rel = (dsAbove==undefined) ? dsCurrent : dsCurrent/dsAbove;
        levelZoomLimits.push({
            relative: rel,
            absolute: dsCurrent
        })
    }
    // dati su immagini richieste man mano, usati per tornare indietro coi livelli
    // salvati dimensioni, livello, dati binari di immagini, zoom di base
    // si parte da livello 1 fino a livello più alto
    imageData = [];
    for (i = 0; i < maxLevel; i++) imageData.push("");
    imageData[maxLevel-1] = data_json;
    // informazioni usate nei vari livelli per passare a livello inferiore
    // si parte da livello 0 fino a livello più alto
    // dato livello x, salvati rapporto coord/dim e dimensioni rispetto a livello x
    // quando si sale di livello, elemento corrispondente viene eliminato
    levelData = [];
    for (i = 0; i < maxLevel+1; i++) levelData.push({
        size: {left: 0, top: 0},
        ogDim: {left: 0, top: 0},
        ratio: {left: 0, top: 0}
    });

    setSlide(data_json);

    $("#slider").val(100);
    $("#val").text(1);
    $(".imagecontainer").on("scroll", defaultScrollHandler);
})

$("#slider").on("input", async function() {
    console.clear();
    // riferimenti a box e immagini
    var box = $(".imagecontainer");
    var image = $("#slide");

    // disattiva handler dello scroll
    box.off("scroll", defaultScrollHandler);
    box.on("scroll", tmpScrollHandler);

    // trovare zoom (assoluto e relativo)
    var absoluteZoom = $("#slider").val() / 100;
    relativeZoom = absoluteZoom/baseZoom;
    $("#val").text(absoluteZoom);

    // calcolo livello a cui bisogna andare
    const levelCheck = (el) => el.absolute<=absoluteZoom;
    let newLevel = levelZoomLimits.findIndex(levelCheck);

    // calcolo attuali coordinate
    var hidden = {
        left: -(image.position().left - permOffset.left),
        top: -(image.position().top - permOffset.top),
    };
    if (centerToChange) {
        currentCenter = {
            left: (hidden.left + box.width()/2) / currentZoom,
            top: (hidden.top + box.height()/2) / currentZoom
        };
    }

    // non devo cambiare livello
    if (newLevel==curLevel) {   
        centerToChange = false;
        zoomMoveImage(relativeZoom);
    }
    // devo salire di livello
    if (newLevel>curLevel) {
        console.log("DA " + curLevel + " A " + newLevel);
        console.log("ABSOLUTEZOOM: " + absoluteZoom);
        console.log("CURRENTZOOM: " + currentZoom);
        console.log("DIMFACTOR: " + dimFactor);

        // calcolare centro rispetto a nuovo livello
        console.log("HIDDEN: " + Object.entries(hidden));
        let tmpCenter = {
            left: (hidden.left + box.width()/2) / (currentZoom * dimFactor),
            top: (hidden.top + box.height()/2) / (currentZoom * dimFactor),
        }
        console.log("TMPCENTER: " + Object.entries(tmpCenter));
        let centerRatio = {
            left: tmpCenter.left/ogDim.left,
            top: tmpCenter.top/ogDim.top
        }
        console.log("CENTERRATIO: " + Object.entries(centerRatio));
        let center = getCoords(curLevel, centerRatio, newLevel);
        console.log("CENTER: " + Object.entries(center));

        // prendere immagine precedente
        // se c'è, prenderla; se non c'è, crearla
        let previousImage = imageData[newLevel-1];
        console.log("PREVIOUSIMAGE: ");
        console.log(previousImage);
        if (previousImage=="") {
            console.log("NON C'È");
            $("#slider").prop("disabled", true);
            $("#loading").text("LOADING");
            // coord calcolate adattando (0,0) al livello massimo
            let newRatio = {
                left: 0,
                top: 0
            }
            let newCoord = getCoords(newLevel, newRatio);
            console.log("NEWCOORD: " + Object.entries(newCoord));
            // livello e dimensioni calcolati supponendo di dover ottenere l'immagine
            // a newLevel partendo da newLevel+1
            let level = [newLevel+1,newLevel];
            let newSize = levelData[newLevel].size;
            console.log("NEWSIZE: " + Object.entries(newSize));

            // prendo immagine
            var jsonData = JSON.stringify({
                "\"coord\"": Object.values(newCoord),
                "\"liv\"": level,
                "\"dim\"": Object.values(newSize)
            });
            var newImage = await phpRequest("get_image", jsonData);
            var newImageData = JSON.parse(newImage);
            console.log("NEWIMAGEDATA:");
            console.log(newImageData);
            if (newLevel>0) imageData[newLevel-1] = newImageData;
            previousImage = newImageData;

            $("#slider").prop("disabled", false);
            $("#loading").text("");
        }

        // inserire e spostare immagine
        setSlide(previousImage);
        let newZoom = absoluteZoom/baseZoom;
        currentCenter = {
            left: center.left*dimFactor,
            top: center.top*dimFactor
        }
        console.log("CURRENTCENTER: " + Object.entries(currentCenter));
        centerToChange = true;
        zoomMoveImage(newZoom);
        /*levelData[curLevel] = {
            size: {left: 0, top: 0},
            ogDim: {left: 0, top: 0},
            ratio: {left: 0, top: 0}
        };*/
    }
    // devo scendere di livello
    else if (newLevel<curLevel) {
        //passare a successivo
        $("#slider").prop("disabled", true);
        $("#loading").text("LOADING");

        // prendere pezzi di zoom e nuovo zoom
        console.log("DIMFACTOR: " + dimFactor);
        let absolute = levelZoomLimits[newLevel].absolute;
        console.log("ABSOLUTE: " + absolute);
        let firstRelative = levelZoomLimits[curLevel-1].relative;
        console.log("FIRSTRELATIVE: " + firstRelative);
        let allRelatives = 1;
        for (var i=newLevel; i<curLevel; i++) allRelatives *= levelZoomLimits[i].relative;
        console.log("ALLRELATIVES: " + allRelatives);
        let newZoom = absoluteZoom/absolute;

        console.log("INGRANDIRE FINO A PRIMO ZOOM SOGLIA");
        // ingrandire fino a primo zoom soglia; per levelData
        zoomMoveImage(firstRelative);

        // prendere dati
        // coordinate scalate rispetto a relativeZoom e dimFactor, relative a porzione attuale
        let hidden = {
            left: -(image.position().left - permOffset.left),
            top: -(image.position().top - permOffset.top),
        };
        // coordinate non scalate, relative a porzione attuale
        console.log("HIDDEN: " + Object.entries(hidden));
        let coord = {
            left: (hidden.left) / (currentZoom * dimFactor),
            top: (hidden.top) / (currentZoom * dimFactor)
        };
        console.log("COORD: " + Object.entries(coord));
        // rapporto tra coordinate non scalate e dimensione totale di porzione corrente
        let ratio = {
            left: coord.left/ogDim.left,
            top: coord.top/ogDim.top
        };
        console.log("RATIO: " + Object.entries(ratio));
        // dimensione di porzione a livello subito sotto, calcolata rispetto a porzione corrente
        let size = {
            left: Math.ceil(box.width()/(currentZoom*dimFactor)),
            top: Math.ceil(box.height()/(currentZoom*dimFactor))
        }
        console.log("SIZE: " + Object.entries(size));

        // aggiornare levelData (livello subito sotto)
        levelData[curLevel].ogDim = ogDim;
        levelData[curLevel].ratio = ratio;
        levelData[curLevel-1].size = size;

        // aggiornare levelData (livelli saltati)
        let tmpDimFactor = dimFactor;
        let tmpSize = size;
        for (l=curLevel-1; l>newLevel; l--) {
            let dsRatioAbove = downsamples[l+1]/downsamples[l];
            let tmpOgDim = {
                left: Math.ceil(tmpSize.left*(dsRatioAbove)),
                top: Math.ceil(tmpSize.top*(dsRatioAbove))
            }
            if (tmpOgDim.left >= tmpOgDim.top) tmpDimFactor = box.height() / tmpOgDim.top;
            else tmpDimFactor = box.width() / tmpOgDim.left;
            let r = levelZoomLimits[l].relative;
            tmpSize = {
                left: Math.ceil(box.width()/(r*tmpDimFactor)),
                top: Math.ceil(box.height()/(r*tmpDimFactor))
            };
            levelData[l].ratio = {
                left: (r-1)/(2*r),
                top: (r-1)/(2*r)
            }
            levelData[l].ogDim = tmpOgDim;
            levelData[l-1].size = tmpSize;
            imageData[l-1] = "";
        }
        console.log("LEVELDATA: ");
        console.log(levelData);

        console.log("INGRANDIRE FINO A ZOOM SOGLIA DI LIVELLO OBIETTIVO");
        // ingrandire fino a zoom soglia di livello obiettivo; per dati da mandare a script Python
        zoomMoveImage(allRelatives);

        // prendere dati
        let baseImageHidden = {
            left: -(image.position().left - permOffset.left),
            top: -(image.position().top - permOffset.top),
        };
        // coordinate non scalate, relative a porzione attuale
        console.log("BASEIMAGEHIDDEN: " + Object.entries(baseImageHidden));
        let baseImageCoord = {
            left: (baseImageHidden.left) / (currentZoom * dimFactor),
            top: (baseImageHidden.top) / (currentZoom * dimFactor)
        };
        console.log("BASEIMAGECOORD: " + Object.entries(baseImageCoord));
        // rapporto tra coordinate non scalate e dimensione totale di porzione corrente
        let baseImageRatio = {
            left: baseImageCoord.left/ogDim.left,
            top: baseImageCoord.top/ogDim.top
        };
        console.log("BASEIMAGERATIO: " + Object.entries(baseImageRatio));
        // dimensione di porzione a livello subito sotto, calcolata rispetto a porzione corrente
        let baseImageSize = {
            left: Math.ceil(box.width()/(currentZoom*dimFactor)),
            top: Math.ceil(box.height()/(currentZoom*dimFactor))
        }
        console.log("BASEIMAGESIZE: " + Object.entries(baseImageSize));
        baseImageCoord = getCoords(curLevel, baseImageRatio);
        console.log("BASEIMAGECOORD: " + Object.entries(baseImageCoord) + " DOPO GETCOORDS");

        console.log("INGRANDISCO FINO A ZOOM RELATIVO");
        // ingrandisco fino a zoom relativo; per mostrare a utente porzione che apparirà
        zoomMoveImage(relativeZoom);

        // prendere e impostare immagine
        var level = [curLevel, newLevel];
        var jsonData = JSON.stringify({
            "\"coord\"": Object.values(baseImageCoord),
            "\"liv\"": level,
            "\"dim\"": Object.values(baseImageSize)
        });
        var newImage = await phpRequest("get_image", jsonData);
        var newImageData = JSON.parse(newImage);
        setSlide(newImageData);
        if (newLevel>0) imageData[newLevel-1] = newImageData;
        console.log(dimFactor);

        console.log("INGRANDIRE NUOVA IMMAGINE CON NUOVO ZOOM");
        // ingrandire nuova immagine con nuovo zoom e impostare centro
        zoomMoveImage(newZoom);

        $("#slider").prop("disabled", false);
        $("#loading").text("");
    }
})

$("#resetScroll").click(function() {
    $(".imagecontainer").scrollTop(0);
    $(".imagecontainer").scrollLeft(0);
})

$("#setScroll").click(function() {
    var box = $(".imagecontainer");
    var maxScroll = {
        top: box.prop("scrollHeight") - box.prop("clientHeight"),
        left: box.prop("scrollWidth") - box.prop("clientWidth")
    };
    box.scrollTop(maxScroll.top/2);
    box.scrollLeft(maxScroll.left/2);
})