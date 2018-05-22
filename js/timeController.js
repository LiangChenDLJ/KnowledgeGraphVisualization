var duration = 10;
var timer;
var videoRunning = false;

var videoClusterAnts = [];

generateVideoInputAnts = function(){
    videoClusterAnts = [];
    checkedClusters = new Set(getCheckedCluster().clusterId);
    var inputAnts = [];
    for (indexId in currentClusterData) {
        if (checkedClusters.has(parseInt(indexId))) {
            inputAnts = inputAnts.concat(currentClusterData[indexId].ant_id);
        }
    }
    var inputAntsSet = new Set(inputAnts);
    antdata.forEach(function(d){
        if(inputAntsSet.has(d.ant_id)){
            videoClusterAnts[d.ant_id] = d;
        }
    });
};

// initialize pseudo video speed dropdown
var speedOption = ['Quick', 'Medium', 'Slow'];
var sp = d3.selectAll('#speedSelectOption');
sp.selectAll('#speedSelectOption')
    .data(speedOption)
    .enter()
    .append('div')
    .attr('class', 'item')
    .attr('data-value', function(d) {
        return d
    })
    .text(function(d) {
        return d
    });

// draw time filter and bind event
initializeTimeFilter = function() {
    var keypressSlider = document.getElementById('keypress');
    var input0 = document.getElementById('input-with-keypress-0');
    var input1 = document.getElementById('input-with-keypress-1');
    var inputs = [input0, input1];
    noUiSlider.create(keypressSlider, {
        start: [minFrame, maxFrame],
        connect: true,
        step: 1,
        direction: 'ltr',
        tooltips: [true, wNumb({ decimals: 0 })],
        range: {
            'min': minFrame,
            'max': maxFrame
        },
        format: wNumb({
            decimals: 0
        })
    });

    keypressSlider.noUiSlider.on('change', function(values, handle) {
        inputs[handle].value = values[handle];
        setAntBox(applyAllFilters(antsInsideClusters()));
    });

    function setSliderHandle(i, value) {
        var r = [null, null];
        r[i] = value;
        keypressSlider.noUiSlider.set(r);
        setAntBox(applyAllFilters(antsInsideClusters()));
    }

    // listening to keydown events on the input field.
    inputs.forEach(function(input, handle) {
        input.addEventListener('change', function() {
            setSliderHandle(handle, this.value);
        });
        input.addEventListener('keydown', function(e) {
            var values = keypressSlider.noUiSlider.get();
            var value = values[handle];
            var steps = keypressSlider.noUiSlider.steps();
            var step = steps[handle];
            var position;
            // 13 is enter,
            // 38 is key up,
            // 40 is key down.
            switch (e.which) {
                case 13:
                    setSliderHandle(handle, this.value);
                    break;
                case 38:
                    // Get step to go increase slider value (up)
                    position = step[1];
                    // false = no step is set
                    if (position === false) {
                        position = 1;
                    }
                    // null = edge of slider
                    if (position !== null) {
                        setSliderHandle(handle, value + position);
                    }
                    break;
                case 40:
                    position = step[0];
                    if (position === false) {
                        position = 1;
                    }
                    if (position !== null) {
                        setSliderHandle(handle, value - position);
                    }
                    break;
            }
        });
    });
};
stopPlayer=function () {
    clearPlayer();
    // recover the mainchart
    var option = getCheckedOption();
    for (var key in option) {
        if(key === "Filter") continue;
        addOptionToMainChart(key);
    }
};

clearPlayer = function(){
    $("#play").html("Play");
    videoRunning = false;
    clearInterval(timer);
    svg.selectAll('.playTrace').remove();
    svg.selectAll('.playTriangle').remove();
}

// bind event to `play button`
initializePlayButton = function() {
    //change slider `min` and `max` according to selected video clip
    $("#play").on("click", function() {
        // pseudo video playing stopped, re-draw the `main chart`
        if (videoRunning) {
            stopPlayer();
        } else {
            document.getElementById("slider").disabled;
            $("#play").html("Stop");
            generateVideoInputAnts();
            var option = getCheckedOption();
            for (var key in option) {
                if(key === "Filter") continue;
                removeOptionFromMainChart(key);
            }
            timer = setInterval(timeElapse, duration);
            videoRunning = true;


        }
    });

    $("#slider").on("change", function() {
        updateCurrentFrameToPseudoVideo();
        // uncomment to add floating window showing current frame
        // timeTip
        //     .html(function() {
        //         return "<span style='color:black'>" + $("#slider").val()+ "</span>";
        //     })
        //     .style("left", function () {
        //         var mid=(parseInt($("#slider").attr("max"))+parseInt($("#slider").attr("min")))/2;
        //         var left_pos;
        //         if($("#slider").val()<mid)
        //              left_pos=$('#slider').position().left+($("#slider").val()-$('#slider').attr('min'))/90+'px';
        //         else{
        //             left_pos=$('#slider').position().left+($("#slider").val()-$('#slider').attr('min'))/80+'px';
        //         }
        //         return left_pos;
        //     })
        //     .style("top",function () {
        //   //      console.log(($('#slider').position().top +25) + "px");
        //         return ($('#slider').position().top +25) + "px"
        //     })
        //     .style("visibility", "visible");
        //$("#range").html($("#slider").val());
    });
};

// change pseudo video play speed
$('#timeController .ui.dropdown')
    .dropdown({
        onChange: function() {
            changeVideoPlaySpeed();
        }
    });

// change duration between two frames according to dropdown selection
changeVideoPlaySpeed = function() {
    var timeInterval = $("#timeController .dropdown")
        .dropdown("get value");

    timeInterval = timeInterval[0];
    if (timeInterval == 'Quick') duration = 3;
    else if (timeInterval == 'Medium') duration = 80;
    else duration = 150;
    if (videoRunning) {
        clearInterval(timer);
        timer = setInterval(timeElapse, duration);
    }
};

timeControllerWidth = 900;
timeControllerHeight = 200;

var timeX = d3.scale.linear()
    .nice()
    .range([0, timeControllerWidth]);
var timeY = d3.scale.linear()
    .nice()
    .range([timeControllerHeight, 0]);

// uncomment axis below for debugging
// var timeXAxis = d3.svg.axis()
//     .scale(timeX)
//     .orient("bottom")
//     .ticks(5);
// var timeYAxis = d3.svg.axis()
//     .scale(timeY)
//     .orient("left")
//     .ticks(5);
// uncomment to add floating window showing current frame
// var timeTip = d3.select("#timeControlPanel")
//                 .append("div")
//                 .attr('class', 'timeTip')
//                 .style("position", "absolute")
//                 .style("z-index", "10")
//                 .style("visibility", "hidden")
//                 .text("a simple tooltip");

timeElapse = function() {
    sliderValue = $("#slider").val();
    var myDate = new Date();
    // For Test
    // console.log("" + myDate.getSeconds() +"\t " + myDate.getMilliseconds());
    if (sliderValue < maxFrame) {
        sliderValue ++;
        $("#slider").val(sliderValue);
        // uncomment to add floating window showing current frame
        // timeTip
        //     .html(function() {
        //         return "<span style='color:black'>" + $("#slider").val()+ "</span>";
        //     })
        //     .style("left", function () {
        //         var mid=(parseInt($("#slider").attr("max"))+parseInt($("#slider").attr("min")))/2;
        //         var left_pos;
        //         if($("#slider").val()<mid)
        //             left_pos=$('#slider').position().left+($("#slider").val()-$('#slider').attr('min'))/90+'px';
        //         else{
        //             left_pos=$('#slider').position().left+($("#slider").val()-$('#slider').attr('min'))/80+'px';
        //         }
        //         return left_pos;
        //     })
        //     .style("top",function () {
        //         return ($('#slider').position().top + 15) + "px"
        //     })
        //     .style("visibility", "visible");
        //$('#range').html(sliderValue);
    }
    updateCurrentFrameToPseudoVideo();
};

// density view: direction > cluster > selected
// draw direction ant num view
drawDirectionAntNum = function(name) {
    var data = antNumdata.filter(function(d) {
        return d.cluster_method == name;
    });

    if (data.length == 0) return;
    data = data[0].ant_number;

    timeX.domain(d3.extent(data, function(d) { return d.x; }));
    timeY.domain([0, d3.max(data, function(d) { return d.y; })]);

    d3.select('#antNumView')
        .selectAll('svg')
        .remove();

    var timeSvg;
    timeSvg = d3.select("#antNumView")
        .append("svg")
        .attr("id", "directionAntNum")
        .attr("viewBox", "0 0 900 200")
        .attr("preserveAspectRatio", "none")
        .attr("width", '100%')
        .attr("height", '100%');

    var areaTime = d3.svg.area()
        .x(function(d) { return timeX(d.x); })
        .y1(function(d) { return timeY(d.y); });
    areaTime.y0(timeY(0));
    timeSvg.append("path")
        .attr('class', 'area')
        .attr("fill", "#d0d0d0")
        .attr("fill-opacity", 0.7)
        .attr("d", areaTime(data));
};

// draw cluster ant num view
drawClusterAntNum = function() {
    d3.select('#antNumView')
        .selectAll('svg')
        .selectAll('#clusterAntNum')
        .remove();
    var clusterList = getCheckedCluster();
    var clusterName = clusterList.clusterName;
    var clusterId = clusterList.clusterId;
    if (clusterId.length == 0) return;

    var lineGraphData = clusterdata.filter(function(d) {
        return d.cluster_method == clusterName;
    });
    lineGraphData = lineGraphData[0].details;
    lineGraphData = lineGraphData.filter(function(d) {
        return clusterId.indexOf(d.cluster) != -1;
    });
    if (lineGraphData.length == 0) return;

    var filteredData = [];
    for (var i = 0; i < lineGraphData[0].ant_number.length; i++) {
        var unitData = { x: 0, y: 0 };
        for (var key in lineGraphData) {
            unitData.y += lineGraphData[key].ant_number[i].y;
        }
        unitData.x = lineGraphData[0].ant_number[i].x;
        filteredData.push(unitData);
    }
    var timeSvg = d3.select("#antNumView")
        .select("svg");
    var areaTime = d3.svg.area()
        .x(function(d) { return timeX(d.x); })
        .y1(function(d) { return timeY(d.y); });
    areaTime.y0(timeY(0));
    timeSvg.append("path")
        .attr('id', 'clusterAntNum')
        .attr("fill", "#a0a0a0")
        .attr("fill-opacity", 0.8)
        .attr("d", areaTime(filteredData));
};

// draw selected ant num view
drawSelectedAntNum = function() {
    d3.select('#antNumView')
        .selectAll('svg')
        .selectAll('#selectedAntNum')
        .remove();
    var antList = getCheckedAnt();
    var filteredData = [];
    var min = parseInt(minFrame / 1000);
    var max = parseInt(maxFrame / 1000);
    var step = max - min + 1;
    var x_range = [];
    for (var i = 0; i < step; i++) {
        x_range.push(0);
    }

    for (key in antList) {
        var antID = antList[key] - 1;
        var antdata = featuredata[antID];
        var startframe = parseInt(antdata.frame_start_id / 1000) - min;
        var endframe = parseInt(antdata.frame_end_id / 1000) - min;
        var long = endframe - startframe + 1;
        for (var i = startframe; i < long + startframe; i++) {
            x_range[i]++;
        }
    }
    for (var key in x_range) {
        var unitData = { x: 0, y: 0 };
        unitData.x = +key + min;
        unitData.y = x_range[key];
        filteredData.push(unitData);
    }
    var timeSvg = d3.select("#antNumView")
        .select("svg");
    var areaTime = d3.svg.area()
        .x(function(d) { return timeX(d.x); })
        .y1(function(d) { return timeY(d.y); });
    areaTime.y0(timeY(0));
    timeSvg.append("path")
        .attr('id', 'selectedAntNum')
        .attr("fill", function() {
            return "#404040"
        })
        .attr("fill-opacity", 0.5)
        .attr("d", areaTime(filteredData));
};

// draw ant trail and speed in current frame
updateCurrentFrameToPseudoVideo = function() {

    var opacityStepNum = 15;
    var opacityStepVal = 0.05;
    var opacityMinVal = 0.25

    var frameAnt = [];
    for(index in framedata){
        if(framedata[index].frame_id ==  $("#slider").val()){
            frameAnt = framedata[index].ant;
            break;
        }
    }

    // clean up trail and speed
    svg.selectAll('.playTrace').remove();
    svg.selectAll('.playTriangle').remove();

    frameAnt.forEach(function (antd) {
        tempdraw = videoClusterAnts[antd];
        if(tempdraw === undefined) return;
        var draw = antdata.filter(function (d) {
            return d.ant_id == antd;
        });
        var long = $("#slider").val() - tempdraw.start;
        long = parseInt(long);
        long += 1;
        // draw play trail
        for (var j = 0; j < long - 1; j++) {
            svg.append("line")
                .attr("class", "playTrace")
                .attr("x1", function () {
                    return x(tempdraw.x[j]);
                })
                .attr("y1", function () {
                    return y(tempdraw.y[j]);
                })
                .attr("x2", function () {
                    return x(tempdraw.x[j + 1]);
                })
                .attr("y2", function () {
                    return y(tempdraw.y[j + 1]);
                })
                .attr("stroke", function () {
                    return color(tempdraw.ant_id);
                })
                .attr("stroke-width", 4)
                .style("opacity", function () {
                    if ((long - j) > opacityStepNum) {
                        return opacityMinVal;
                    } else {
                        return 1 - (long - j) * opacityStepVal;
                    }
                });
        }
        ;

        // draw play speedTriangle
        for (var k = 1; k < long - 1; k++) {
            svg.append("polygon")
                .attr("class", "playTriangle")
                .attr("speed", function () {
                    return tempdraw.v[k];
                })
                .attr("points", function () {
                    var size = Math.sqrt(tempdraw.v[k]) * 3;
                    var centerX = x(tempdraw.x[k]);
                    var centerY = y(tempdraw.y[k]);
                    var angle = Math.atan2(y(tempdraw.y[k + 1]) - y(tempdraw.y[k - 1]), x(tempdraw.x[k + 1]) - x(tempdraw.x[k - 1]));
                    var rotated = rotatePoint(size, 0, angle);
                    var vertex1 = {"x": rotated["x"], "y": rotated["y"]};
                    rotated = rotatePoint(vertex1["x"], vertex1["y"], Math.PI * 2 / 3);
                    var vertex2 = {"x": rotated["x"], "y": rotated["y"]};
                    rotated = rotatePoint(vertex2["x"], vertex2["y"], Math.PI * 2 / 3);
                    var vertex3 = {"x": rotated["x"], "y": rotated["y"]};
                    var string = (vertex1["x"] + centerX).toString() + "," + (vertex1["y"] + centerY).toString() + " " +
                        (vertex2["x"] + centerX).toString() + "," + (vertex2["y"] + centerY).toString() + " " +
                        (vertex3["x"] + centerX).toString() + "," + (vertex3["y"] + centerY).toString();
                    return string;
                })
                .style("fill", function () {
                    return color(tempdraw.ant_id);
                })
                .style("opacity", function () {
                    if ((long - k) > opacityStepNum) {
                        return opacityMinVal;
                    } else {
                        return 1 - (long - k) * opacityStepVal;
                    }
                });
        }
        ;

        // draw play speedTriangle in current frame
        if(long > 1 )
        svg.append("polygon")
            .attr("class", "playTriangle")
            .attr("speed", function () {
                return tempdraw.v[long - 1];
            })
            .attr("points", function () {
                var size = Math.sqrt(tempdraw.v[long - 1]) * 3;
                var centerX = x(tempdraw.x[long - 1]);
                var centerY = y(tempdraw.y[long - 1]);
                var angle = Math.atan2(y(tempdraw.y[long - 1]) - y(tempdraw.y[long - 2]), x(tempdraw.x[long - 1]) - x(tempdraw.x[long - 2]));
                var rotated = rotatePoint(size, 0, angle);
                var vertex1 = {"x": rotated["x"], "y": rotated["y"]};
                rotated = rotatePoint(vertex1["x"], vertex1["y"], Math.PI * 2 / 3);
                var vertex2 = {"x": rotated["x"], "y": rotated["y"]};
                rotated = rotatePoint(vertex2["x"], vertex2["y"], Math.PI * 2 / 3);
                var vertex3 = {"x": rotated["x"], "y": rotated["y"]};
                var string = (vertex1["x"] + centerX).toString() + "," + (vertex1["y"] + centerY).toString() + " " +
                    (vertex2["x"] + centerX).toString() + "," + (vertex2["y"] + centerY).toString() + " " +
                    (vertex3["x"] + centerX).toString() + "," + (vertex3["y"] + centerY).toString();
                return string;
            })
            .style("fill", function () {
                return color(tempdraw.ant_id);
            })
            .style("stroke", "yellow")
            .style("stoke-width", "3")
            .style("opacity", function () {
                return 10;
            });
    });
};

/*
// get ant list from `time filter` then update to ant box
getAndSetTimeFilteredAnt = function() {
    var keypressSlider = document.getElementById('keypress');
    var input = keypressSlider.noUiSlider.get();
    var start = parseInt(input[0]);
    var end = parseInt(input[1]);
    var startData;
    var endData;
    for (var i = start; i <= end; i++) {
        startData = framedata.filter(function(d) {
            return d.frame_id == parseInt(i);
        });
        if (startData.length != 0) break;
    }
    var antList;
    if (!startData.length) {
        antList = [];
        setAntBox(antList);
    } else {
        var startAnt = d3.min(startData[0].ant);
        for (var i = end; i >= start; i--) {
            endData = framedata.filter(function(d) {
                return d.frame_id == i;
            });
            if (endData.length != 0) break;
        }
        var endAnt = d3.max(endData[0].ant);
        antList = d3.range(startAnt, endAnt + 1, 1);
        setAntBoxWithTimeFilter(antList);
    }
};
*/

applyTimeFilter = function(inputAnts){
    var keypressSlider = document.getElementById('keypress');
    var input = keypressSlider.noUiSlider.get();
    var start = parseInt(input[0]);
    var end = parseInt(input[1]);
    var startData;
    var endData;
    for (var i = start; i <= end; i++) {
        startData = framedata.filter(function(d) {
            return d.frame_id == parseInt(i);
        });
        if (startData.length != 0) break;
    }
    var antList;
    if (!startData.length) {
        antList = [];
    } else {
        var startAnt = d3.min(startData[0].ant);
        for (var i = end; i >= start; i--) {
            endData = framedata.filter(function(d) {
                return d.frame_id == i;
            });
            if (endData.length != 0) break;
        }
        var endAnt = d3.max(endData[0].ant);
        antList = d3.range(startAnt, endAnt + 1, 1);
    }

    var inputAntsSet = new Set(inputAnts);
    var outputAnts = [];
    antList.forEach(function(d){
        if(inputAntsSet.has(d)) outputAnts.push(d);
    })
    return outputAnts;

}


