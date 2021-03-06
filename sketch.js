/**
 * This is a data visualization of Earthquake data from March 1, 2019 to March 31, 2019.
 * This project is based off of Daniel Shiffman's coding challenge #57 - Mapping Earthquake Data.
 *
 * Data collected from USGS Earthquake Hazards Program: https://earthquake.usgs.gov/earthquakes/feed/v1.0/csv.php
 *
 * @author Ai-Linh Alten <ai-linh.alten@sjsu.edu>
 * @author Jason Do <jason.do@sjsu.edu>
 *
 * The Coding Train - Earthquake Viz:
 * @author Daniel Shiffman <https://thecodingtrain.com/CodingChallenges/057-mapping-earthquake-data.html>
 *
 */

//holders for image and canvas
var mapimg;
var myCanvas;

//center of image coordinates
var center_lat = 0;
var center_lng = 0;

//zoom level of static map tile
var zoom = 1;

//holder for loaded geojson file
var earthquakes = new Array();

//constants for color gradient
let c1, c2, c3, c4, c1_solid, c2_solid, c3_solid, c4_solid;
let magScaler, diaScaler;

//keep track of selected bubble
var selectedId = 0;


//link to query geojson data - ref: https://earthquake.usgs.gov/fdsnws/event/1/
//TODO: change query dynamically using time slider
var link = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2019-03-01&endtime=2019-03-31&minmagnitude=3.5&minlatitude=-90&minlongitude=-180&maxlatitude=90&maxlongitude=180";
//var link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson";

//holder to make HTTP requests
var xhr = new XMLHttpRequest();

//fontsize
var fontsize = 10;

/**
 * Make HTTP Request to link for geojson of earthquakes. Store the features as a featureObj in earthquakes array.
 * @param {text} obj - geojson
 */
function createFeatures(obj){
    var myArr = obj['features'];
    for(var i = 0; i < myArr.length; i++){

        //store lat, lng, mag, and time
        //ref on geojson obj - https://earthquake.usgs.gov/data/comcat/data-eventterms.php#time
        let datetime = new Date(myArr[i]['properties']['time']); //time is in milliseconds from 1970-01-01T00:00:00.000Z
        let featureObj = {
            lat: myArr[i]['geometry']['coordinates'][1],
            lng: myArr[i]['geometry']['coordinates'][0],
            mag: myArr[i]['properties']['mag'],
            time: datetime.toString(),
            title: myArr[i]['properties']['title'], 
            selected: false,
        };
        earthquakes.push(featureObj);
    }

    // sort earthquakes from least to greatest magnitude
    earthquakes.sort(function(a, b){
        return a.mag - b.mag;
    });

}

/**
 *  Preload Google Map Static API and earthquake data.
 *
 */
function preload(){
    //load map static image
    var mapWidth = 640;//windowWidth.toString();
    var mapHeight = 640;//windowHeight.toString();
    mapimg = loadImage('https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyCd5K9E5VpqLyvugDgNfOkH2N4Ky-Bx4X8&center=0,0&zoom=1&format=png&maptype=roadmap&style=element:geometry%7Ccolor:0x212121&style=element:labels.icon%7Cvisibility:off&style=element:labels.text.fill%7Ccolor:0x757575&style=element:labels.text.stroke%7Ccolor:0x212121&style=feature:administrative%7Celement:geometry%7Ccolor:0x757575&style=feature:administrative.country%7Celement:labels.text.fill%7Ccolor:0x9e9e9e&style=feature:administrative.land_parcel%7Cvisibility:off&style=feature:administrative.locality%7Celement:labels.text.fill%7Ccolor:0xbdbdbd&style=feature:poi%7Celement:labels.text.fill%7Ccolor:0x757575&style=feature:poi.park%7Celement:geometry%7Ccolor:0x181818&style=feature:poi.park%7Celement:labels.text.fill%7Ccolor:0x616161&style=feature:poi.park%7Celement:labels.text.stroke%7Ccolor:0x1b1b1b&style=feature:road%7Celement:geometry.fill%7Ccolor:0x2c2c2c&style=feature:road%7Celement:labels.text.fill%7Ccolor:0x8a8a8a&style=feature:road.arterial%7Celement:geometry%7Ccolor:0x373737&style=feature:road.highway%7Celement:geometry%7Ccolor:0x3c3c3c&style=feature:road.highway.controlled_access%7Celement:geometry%7Ccolor:0x4e4e4e&style=feature:road.local%7Celement:labels.text.fill%7Ccolor:0x616161&style=feature:transit%7Celement:labels.text.fill%7Ccolor:0x757575&style=feature:water%7Celement:geometry%7Ccolor:0x000000&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x3d3d3d&size='+mapWidth+'x'+mapHeight);
    print(windowWidth);
    print(windowHeight);

    //GET request for json object
    xhr.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200){
            var geojsonObject = JSON.parse(this.responseText);
            createFeatures(geojsonObject);
        }
    };

    xhr.open("GET", link, true);
    xhr.send();
}

/**
 * Converts longitude into Web Mercator X coordinate.
 * @param {float} lng - Longitude in decimal degrees WGS84.
 * @returns {number} - Web Mercator X coordinate
 */
function webMercatorX(lng){
    lng = radians(lng);
    var a = (128 / Math.PI) * pow(2, zoom); //use 128 since googleMaps uses 128x128 tiles
    var b = lng + Math.PI;
    return a * b;
}

/**
 * Converts latitude into Web Mercator Y coordinate.
 * @param {float} lat - Latitude in decimal degrees WGS84.
 * @returns {number} - Web Mercator Y coordinate
 */
function webMercatorY(lat){
    lat = radians(lat);
    var a = (128 / Math.PI) * pow(2, zoom);
    var b = Math.tan(Math.PI / 4 + lat / 2);
    var c = Math.PI - Math.log(b);
    return a * c;
}

/**
 * Make canvas center of screen.
 * https://github.com/processing/p5.js/wiki/Positioning-your-canvas
 *
 */
function centerCanvas() {
    var x = (windowWidth - width)/2;
    var y = (windowHeight - height)/2;
    //myCanvas.position(x, y);  Got an error on my machine at this line, so commented it out.  Works after.
}

/**
 *  Create P5 canvas and load 1 month earthquake data. Project data into Web Mercator coordinates.
 *  Data points based on magnitude of the earthquake.
 *  Google Map tile placed in middle of canvas. Map tile will always be 640x640.
 *
 */
function setup(){
    //Define colors - https://uigradients.com/#AzurePop
    c1 = color('#89fffdbf'); //light blue w/ 75% transparency - ref: https://css-tricks.com/8-digit-hex-codes/
    c2 = color('#ef32d9bf'); //magenta w/ 75% transparency - ref: https://css-tricks.com/8-digit-hex-codes/
    c3 = color('#00FFFFBF'); //cyan w/ 75% transparency
    c4 = color('#0080ffbf'); //blueish w/ 75% transparency

    c1_solid = color('#89fffd'); //light blue
    c2_solid = color('#ef32d9'); //magenta
    c3_solid = color('#00FFFF');
    c4_solid = color('#0080ffbf'); //blueish

    //canvas with image centerpoint as (0,0). Image is then translated to middle of canvas.
    myCanvas = createCanvas(windowWidth, windowHeight);
    centerCanvas();
    myCanvas.parent('myCanvas');

    //setup for text font
    textFont('Helvetica');
    textSize(fontsize);
    textAlign(CENTER, CENTER);

    //magnitude and diameter sliders
    magScaler = createSlider(0, 10, 10);
    magScaler.position(20, 50);
    diaScaler = createSlider(1, 10, 1);
    diaScaler.position(20, 100);

    draw();
}

/**
 * Execute functions when window is resized.
 */
function windowResized() {
    centerCanvas();
    //resizeCanvas(windowWidth, windowHeight);
    setup();
}


//TODO: fix words that are drawing outside of web map tile (canvas)
/**
 * Redraws the canvas on update.
 */
function draw() {

    const context = canvas.getContext('2d');
    context.clearRect(-width / 2, -height / 2, canvas.width, canvas.height);

    //TODO: not sure if this translate is necessary - Ai-Linh
    translate(width / 2, height / 2);
    imageMode(CENTER);
    image(mapimg, 0, 0);

    let centerX = webMercatorX(center_lng);
    let centerY = webMercatorY(center_lat);
    let magcap = magScaler.value();
    let scale = diaScaler.value();

    //iterate line by line through CSV to get data
    for (let i = 0; i < earthquakes.length; i++) {
        let lat = earthquakes[i]['lat'];
        let lng = earthquakes[i]['lng'];
        let mag = earthquakes[i]['mag'];
        let truemag = parseFloat(earthquakes[i]['mag']);
        let select = earthquakes[i]['selected'];

        //color gradient mapping based on magnitude 3 - 10
        let inter = map(mag, 3, 10, 0, 1);
        let c = lerpColor(c1, c2, inter);
        let c_solid = lerpColor(c1_solid, c2_solid, inter);

        // convert magnitude to logarithmic scale to get diameter of circle
        mag = Math.pow(10, mag);
        mag = Math.sqrt(mag);

        //largest magnitude in logarithmic scale
        let magMax = Math.sqrt(Math.pow(10, 10));

        // new coordinate offset from center of image
        let x = webMercatorX(lng) - centerX;
        let y = webMercatorY(lat) - centerY;

        //draw circle
        let diameter = map(mag, 0, magMax, 0, 180);

        if (truemag < magcap) {
            //change color based on selection
            if (!select) {
                //change color on hover over
                //TODO: Fix color on hover over
                if (distance(x, y, mouseX - (width / 2), mouseY - (height / 2)) < diameter * (scale / 2)) {
                    stroke(c4_solid);
                    fill(c4);
                    ellipse(x, y, (diameter * scale) + (sin(frameCount)*2), (diameter * scale) + (sin(frameCount)*2));
                }else{
                    stroke(c_solid);
                    fill(c);
                    ellipse(x, y, diameter * scale, diameter * scale);
                }
            }
            else{
                //draw words when circle is selected
                textAlign(CENTER);
                drawWords(x, y - (diameter * scale) - (fontsize*2));

                //hilight circle cyan
                stroke(c3_solid);
                fill(c3);
                ellipse(x, y, diameter * scale, diameter * scale);
            }



        }
    }
}

/**
 * Draw informative text based on circle position.
 *
 * @param {int} x - screen coordinate x
 * @param {int} y - screen coordinate y
 */
function drawWords(x, y){
    stroke(c4_solid);
    fill(255);
    text(earthquakes[selectedId]['title'] + '\nmagintude: ' + earthquakes[selectedId]['mag'] + '\ndatetime: ' + earthquakes[selectedId]['time'], x, y);
}

/**
 * Highlights selected circle based on mouse press location.
 *
 */
function mousePressed() {
    let centerX = webMercatorX(center_lng);
    let centerY = webMercatorY(center_lat);
    let magcap = magScaler.value();
    let scale = diaScaler.value();

    //reset the selected circle to false
    if (earthquakes[selectedId]['selected']){
        earthquakes[selectedId]['selected'] = false;
    }

    //go through circles based on draw - select largest diameter circle on top
    for (let i = earthquakes.length - 1; i >= 0; i--) {
        let lat = earthquakes[i]['lat'];
        let lng = earthquakes[i]['lng'];
        let mag = earthquakes[i]['mag'];
        let truemag = parseFloat(earthquakes[i]['mag']);

        // convert magnitude to logarithmic scale to get diameter of circle
        mag = Math.pow(10, mag);
        mag = Math.sqrt(mag);

        //largest magnitude in logarithmic scale
        let magMax = Math.sqrt(Math.pow(10, 10));

        // new coordinate offset from center of image
        let x = webMercatorX(lng) - centerX;
        let y = webMercatorY(lat) - centerY;

        //diameter of circle
        let diameter = map(mag, 0, magMax, 0, 180);

        //check if click within bubble and updated selected in earthquakes array
        if (distance(x, y, mouseX - (width / 2), mouseY - (height / 2)) < diameter * (scale / 2) && truemag < magcap) {
            earthquakes[i]['selected'] = true;
            selectedId = i;
            break;
        }
        else {
            earthquakes[i]['selected'] = false;
        }
    }
}

/**
 * Euclidean distance between two points.
 *
 * @param {float} x1 - x coordinate point 1
 * @param {float} y1 - y coordinate point 1
 * @param {float} x2 - x coordinate point 2
 * @param {float} y2 - y coordinate point 2
 * @returns {float} - euclidean distance
 */
function distance(x1, y1, x2, y2) {
    return sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
}