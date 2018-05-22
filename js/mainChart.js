var pseudoVideoWidth = 960;
var pseudoVideoHeight = 540;

var traceOpacity = 1;
var speedTriangleOpacity = 1;

var mainCharBrushRec = [];
var mainChartUndoable = false;

var firstInitializeFilter = true;

var x = d3.scale.linear()
    .range([0, pseudoVideoWidth]);
var y = d3.scale.linear()
    .range([pseudoVideoHeight, 0]);
var color = d3.scale.category20().domain([10, 0, 11, 1, 12, 2, 13, 3, 14, 4, 15, 5, 16, 6, 17, 7, 18, 8, 19, 9]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("#pseudoVideoBackground")
    .append("svg")
    .attr("id", "pseudoVideo")
    .attr("viewBox", "0 0 960 540")
    .attr("preserveAspectRatio", "none")
    .attr("width", "100%")
    .attr("height", "100%");

svg.append("g")
    .attr("id", "heatmapLayer");

svg.append("g")
    .attr("class", "speedTrianglesLayer");

x.domain([0, pseudoVideoWidth]);
y.domain([0, pseudoVideoHeight]);

initializeTraceBrushEvent = function() {
    segmentsIntersection = function(line0, line1) {
        x00 = line0[0][0];
        y00 = line0[0][1];
        x01 = line0[1][0];
        y01 = line0[1][1];
        x10 = line1[0][0];
        y10 = line1[0][1];
        x11 = line1[1][0];
        y11 = line1[1][1];

        d = x11 * y01 - x01 * y11;
        if (Math.abs(d) < 0.01) return false;

        dx = x00 - x10;
        dy = y00 - y10;
        s = (dx * y01 - dy * x01) / d;
        t = (dx * y11 - dy * x11) / d;
        return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
    }


    svg.style("cursor", "crosshair");
    svg.on("mousedown", function() {
            event.preventDefault();
            if (d3.event.buttons != 1) {
                return;
            }
            var p = d3.mouse(this);

            svg.append("rect")
                .attr({
                    rx: 6,
                    ry: 6,
                    class: "selection",
                    x: p[0],
                    y: p[1],
                    width: 0,
                    height: 0
                });
            d3.selectAll(".main").on("mouseup", function() {
                d3.selectAll(".main").on("mouseup", null);
                var rect = svg.selectAll("rect.selection");
                var rectX = parseFloat(rect.attr("x")),
                    rectY = parseFloat(rect.attr("y")),
                    rectWidth = parseFloat(rect.attr("width")),
                    rectHeight = parseFloat(rect.attr("height"));

                if (!(rectWidth < 0.01 && rectHeight < 0.01)) {
                    if (!mainChartUndoable) mainCharBrushRec = getCheckedAnt();
                    var xrange = [x.invert(rectX), x.invert(rectX + rectWidth)];
                    var yrange = [y.invert(rectY + rectHeight), y.invert(rectY)];
                    checkedClusters = new Set(getCheckedCluster().clusterId);
                    var inputAnts = [];
                    for (indexId in currentClusterData) {
                        if (checkedClusters.has(parseInt(indexId))) {
                            inputAnts = inputAnts.concat(currentClusterData[indexId].ant_id);
                        }
                    }
                    var inputAntsSet = new Set(inputAnts);
                    var filterRes = [];

                    var diagonal0 = [
                        [xrange[0], yrange[0]],
                        [xrange[1] - xrange[0], yrange[1] - yrange[0]]
                    ];
                    var diagonal1 = [
                        [xrange[1], yrange[0]],
                        [xrange[0] - xrange[1], yrange[1] - yrange[0]]
                    ];

                    antdata.forEach(function(ant) {
                        if (inputAntsSet.has(ant.ant_id)) {
                            for (index in ant.x) {
                                var lastPos;
                                xPos = parseFloat(ant.x[index]);
                                yPos = parseFloat(ant.y[index]);
                                if (xPos >= xrange[0] && xPos <= xrange[1] &&
                                    yPos >= yrange[0] && yPos <= yrange[1]) {
                                    filterRes.push(ant.ant_id);
                                    break;
                                }
                                if (index > 0) {
                                    var line0 = [lastPos, [xPos - lastPos[0], yPos - lastPos[1]]];
                                    if (segmentsIntersection(line0, diagonal0) || segmentsIntersection(line0, diagonal1)) {
                                        filterRes.push(ant.ant_id);
                                        break;
                                    }
                                }
                                lastPos = [xPos, yPos];
                            }
                        }
                    })
                    setAntBox(applyAllFilters(filterRes));
                    mainChartUndoable = true;
                } else {
                    // undo
                    if (mainChartUndoable) {
                        setAntBox(mainCharBrushRec);
                        mainChartUndoable = false;
                    }
                }
                rect.remove();
            });
        })
        .on("mousemove", function(d, i) {
            var s = svg.select("rect.selection");
            if (!s.empty()) {
                var p = d3.mouse(this),
                    d = {
                        x: parseFloat(s.attr("x")),
                        y: parseFloat(s.attr("y")),
                        width: parseFloat(s.attr("width")),
                        height: parseFloat(s.attr("height"))
                    },
                    move = {
                        x: p[0] - d.x,
                        y: p[1] - d.y
                    };

                if (move.x < 0 || (move.x * 2 < d.width)) {
                    d.x = p[0];
                    d.width -= move.x;
                } else {
                    d.width = move.x;
                }

                if (move.y < 0 || (move.y * 2 < d.height)) {
                    d.y = p[1];
                    d.height -= move.y;
                } else {
                    d.height = move.y;
                }

                s.attr(d);
            }
        });
};

removeTraceBrushEvent = function() {
    svg.style("cursor", "default");
    svg.on("mousedown", null)
        .on("mousemove", null)
};

var tooltip = d3.select("body")
    .append("div")
    .attr('class', 'tooltipm')
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("a simple tooltip");


// add speed filter to main chart
initializeFilter = function() {
    filter = $("#filterDropdown").dropdown("get value");

    if (filter === "No Filter" || filter === "") {
        firstInitializeFilter = true;
        document.getElementById('slider-non-linear-step').noUiSlider.destroy();
    } else {
        if (firstInitializeFilter) {
            firstInitializeFilter = false;
        } else {
            document.getElementById('slider-non-linear-step').noUiSlider.destroy();
        }

        var Slider = document.getElementById('slider-non-linear-step');
        noUiSlider.create(Slider, {
            start: [minFilterValue[filter], maxFilterValue[filter]],
            tooltips: [true, wNumb({ decimals: 2 })],
            connect: true,
            range: {
                'min': [minFilterValue[filter]],
                'max': [maxFilterValue[filter]]
            },
            format: wNumb({
                decimals: 2
            })
        });

        Slider.noUiSlider.on('change', function(values, handle) {
            setAntBox(applyAllFilters(antsInsideClusters()));
        });
    }
};

applyAttrFilter = function(inputAnts) {
    var inputAntsSet = new Set(inputAnts);
    var outputAnts = [];
    selectedFeature = $('#filterDropdown').dropdown('get value');
    if (selectedFeature === "No Filter" || selectedFeature === "") return inputAnts;
    filterValues = document.getElementById("slider-non-linear-step").noUiSlider.get();
    filterMin = parseFloat(filterValues[0]);
    filterMax = parseFloat(filterValues[1]);

    for (var antId = 1; antId <= featuredata.length; antId++) {
        if (inputAntsSet.has(antId) &&
            featuredata[antId - 1][selectedFeature] >= filterMin &&
            featuredata[antId - 1][selectedFeature] <= filterMax) {
            outputAnts.push(parseInt(antId));
        }
    }
    return outputAnts;
};

// add checkboxes to `main chart` and bind events on them
initializeTrajectoryOption = function() {
    option = ["Heat map", "Center line", "Envelope", "Trace"];
    var checkbox = d3.select('#trajectoryPanel')
        .selectAll('div')
        .data(option)
        .enter()
        .append('div')
        .attr('class', "ui checkbox trajectoryOption")
        .attr('id', function(d) {
            return d + 'Option';
        });
    checkbox.append('input')
        .attr('type', 'checkbox')
        .attr('class', 'hidden');
    checkbox.append('label')
        .text(function(d) {
            return d;
        })
        .style('float', 'left');

    $('#trajectoryPanel .ui.checkbox').checkbox({
        onChecked: function() {
            if (videoRunning) {
                stopPlayer();
            }
            var option = d3.select(this).data()[0];
            // if(option === "Filter"){
            //     $('#SpeedOption').checkbox('set checked');
            // }
            addOptionToMainChart(option);
        },
        onUnchecked: function() {
            if (videoRunning) {
                stopPlayer();
            }
            var option = d3.select(this).data()[0];
            // if(option === "Speed"){
            //     $('#FilterOption').checkbox('set unchecked');
            // }
            removeOptionFromMainChart(option);
        }
    });

    var fp = d3.selectAll('#filterOption');
    fp.selectAll("div").remove();
    fp.selectAll('#filterOption')
        .data(filterOption)
        .enter()
        .append('div')
        .attr('class', 'item')
        .attr('data-value', function(d) {
            return d
        })
        .text(function(d) {
            return d
        })
        .style("color", function(d) {
            if (d == "No Filter") {
                return "silver";
            } else {
                return "black";
            }
        })

    $('#filterDropdown')
        .dropdown({ onChange: function() {} })
        .dropdown("set selected", "No Filter")
        .dropdown({
            onChange: function() {
                initializeFilter();
                setAntBox(applyAllFilters(antsInsideClusters()));
            }
        });
    if (!firstInitializeFilter) {
        document.getElementById('slider-non-linear-step').noUiSlider.destroy();
        firstInitializeFilter = true;
    }

};

// get `main chart` checked options
getCheckedOption = function() {
    var option = {};
    d3.select('#trajectoryPanel')
        .selectAll('.ui.checkbox')
        .each(function(d) {
            if ($(this).checkbox('is checked')) option[d] = true;
            return d;
        });
    return option;
};

// when a option checkbox in `main chart` is checked
addOptionToMainChart = function(selectedOption) {
    var antList = getCheckedAnt();
    switch (selectedOption) {
        case 'Heat map':
            drawHeatmapChart();
            break;
        case 'Center line':
            drawCenterLine();
            break;
        case 'Envelope':
            drawEnvelope();
            break;
        case 'Trace':
            for (var key in antList) {
                drawTrace(antList[key]);
            }
            initializeTraceBrushEvent();
            break;
    }
};

// when a option checkbox in `main chart` is unchecked
removeOptionFromMainChart = function(deletedOption) {
    switch (deletedOption) {
        case 'Heat map':
            svg.selectAll('.antDensityRectangle')
                .remove();
            break;
        case 'Center line':
            svg.selectAll('.centerline').remove();
            break;
        case 'Envelope':
            svg.selectAll('.envelopeline').remove();
            svg.selectAll('.area').remove();
            break;
        case 'Trace':
            d3.select('#pseudoVideo')
                .selectAll('.line')
                .remove();
            removeTraceBrushEvent();
            break;
    }
};

// when a ant checkbox in `control panel` is checked
// update the ant's trail|speed to `main chart`
addAntToMainChart = function(ant) {
    var option = getCheckedOption();
    if ("Trace" in option) drawTrace(ant);
};

// when a ant checkbox in `control panel` is unchecked
// delete the ant's trail|speed from `main chart`
deleteAntFromMainChart = function(ant) {
    var string = '#ant' + ant;
    d3.select('#pseudoVideo')
        .selectAll(string)
        .remove();
};

// draw a single ant's trail to `main chart`
drawTrace = function(ant) {

    // clear pseudo video trail and speedTriangle
    svg.selectAll('.playTrace').remove();
    svg.selectAll('.playTriangle').remove();

    var trData = antdata.filter(function(d) {
        return d.ant_id == ant;
    });
    trData = trData[0];
    var trailData = [];
    for (var i = 0; i < trData.x.length; i++) {
        var obj = { x: "", y: "" };
        obj.x = trData.x[i];
        obj.y = trData.y[i];
        trailData.push(obj);
    }

    var lineFunction = d3.svg.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); })
        .interpolate("linear");

    svg.append("path")
        .datum(trailData)
        .attr("class", "line")
        .attr("stroke", function() {
            return color(ant);
        })
        .attr('id', function() {
            return 'ant' + ant;
        })
        .attr("stroke-width", 4)
        .attr("fill", "none")
        .attr("d", lineFunction(trailData))
        .style('opacity', traceOpacity);

    svg.selectAll(".line")
        .on('mouseover', function() {
            if (!svg.select("rect.selection").empty()) return;
            tmpnum = this.getAttribute(["id"]);
            svg.selectAll('.line')
                .each(function() {
                    if (this.getAttribute(["id"]) != tmpnum) {
                        this.style.opacity /= 5;
                    }
                });
            svg.selectAll('.speedTriangle')
                .each(function() {
                    if (this.getAttribute(["id"]) != tmpnum) {
                        this.style.opacity /= 5;
                    }
                });
            var ant_id = parseInt(this.getAttribute(["id"]).substring(start = 3));
            var trData = antdata.filter(function(d) {
                return d.ant_id == ant_id;
            });
            trData = trData[0];
            var len = trData.x.length;
            for (s = 1; s < len - 6; s += 5) {
                svg.select(".speedTrianglesLayer")
                    .append("polygon")
                    .attr("class", "speedTriangle")
                    .attr("class", "temp")
                    .attr("points", function() {
                        var size = Math.sqrt(trData.v[s]) * 3;
                        var centerX = x(trData.x[s]);
                        var centerY = y(trData.y[s]);
                        var angle = Math.atan2(y(trData.y[s + 1]) - y(trData.y[s - 1]), x(trData.x[s + 1]) - x(trData.x[s - 1]));
                        var rotated = rotatePoint(size, 0, angle);
                        var vertex1 = { "x": rotated["x"], "y": rotated["y"] };
                        rotated = rotatePoint(vertex1["x"], vertex1["y"], Math.PI * 2 / 3);
                        var vertex2 = { "x": rotated["x"], "y": rotated["y"] };
                        rotated = rotatePoint(vertex2["x"], vertex2["y"], Math.PI * 2 / 3);
                        var vertex3 = { "x": rotated["x"], "y": rotated["y"] };
                        var string = (vertex1["x"] + centerX).toString() + "," + (vertex1["y"] + centerY).toString() + " " +
                            (vertex2["x"] + centerX).toString() + "," + (vertex2["y"] + centerY).toString() + " " +
                            (vertex3["x"] + centerX).toString() + "," + (vertex3["y"] + centerY).toString();
                        return string;
                    })
                    .style('opacity', 1)
                    .style("fill", function() {
                        return color(ant_id);
                    });
            }
            var selectedAntId = this.getAttribute(["id"]);
            var selectedAntAttributes = featuredata[parseInt(selectedAntId.replace("ant", ""))];
            tooltip
                .html(function() {
                    var count = 0;
                    antAttributes = "<span style='color:#d9e778'>" + "<strong>" + "Attributes of " + selectedAntId + "</strong>" + "<br>";
                    for (var i in validFeatureNames) {
                        count += 1;
                        antAttributes += "<strong>" + validFeatureNames[i] + "</strong>";
                        antAttributes += ":";
                        if (validFeatureNames[i] in ["frame_end_id", "frame_start_id", "frames_appeared",
                                "trace_x_range", "trace_y_range"]) {
                            antAttributes += selectedAntAttributes[validFeatureNames[i]];
                        } else {
                            antAttributes += selectedAntAttributes[validFeatureNames[i]].toFixed(2);
                        }
                        if (count % 2 == 0) {
                            antAttributes += "<br>";
                        } else {
                            antAttributes += " "
                        }
                    }
                    antAttributes += "</span>";
                    return antAttributes;
                })
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 20) + "px")
                .style("visibility", "visible");
        })
        .on('mouseout', function() {
            if (!(tooltip.style("visibility") === "visible")) {
                return;
            }
            tooltip.style("visibility", "hidden");
            svg.selectAll(".temp")
                .remove();
            svg.selectAll('.line')
                .style("opacity", traceOpacity);
            svg.selectAll('.speedTriangle')
                .style("opacity", speedTriangleOpacity);
        });
};

// get a rotated point's X and Y
rotatePoint = function(x, y, angle) {
    rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
    return { "x": rotatedX, "y": rotatedY };
};

// draw center line to `main chart`
drawCenterLine = function() {
    // clear pseudo video trail and speedTriangle
    d3.selectAll('.centerline').remove();
    var svgDrawLine = d3.svg.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); });

    var clusterList = getCheckedCluster();
    var clusterId = clusterList.clusterId;
    if (clusterId.length == 0) return;
    var tempdata = clusterdata.filter(function(d) {
        return d.cluster_method == clusterList.clusterName;
    });
    tempdata = tempdata[0].details;
    for (var key in clusterId) {
        var curData = tempdata.filter(function(d) {
            return d["cluster"] == clusterId[key];
        });
        curData = curData[0];
        var colorId = clusterId[key];
        var lineData = curData.center_line;
        var leftUpper = d3.min(curData.upper, function(d) {
            return d.x;
        });
        var leftLower = d3.min(curData.lower, function(d) {
            return d.x;
        });
        var flagLeft = d3.max([leftLower, leftUpper]);

        var rightUpper = d3.max(curData.upper, function(d) {
            return d.x;
        });
        var rightLower = d3.max(curData.lower, function(d) {
            return d.x;
        });
        var flagRight = d3.min([rightLower, rightUpper]);

        var filteredLineData = lineData.filter(function(d) {
            return ((d.x > flagLeft) && (d.x <= flagRight));
        });

        svg.append("path")
            .attr("class", "centerline")
            .attr('id', function() {
                return "cluster" + curData.cluster;
            })
            .attr("fill", "none")
            .attr("stroke", function() {
                return color(colorId)
            })
            .attr('opacity', 2)
            .attr("stroke-width", 10)
            .attr("d", svgDrawLine(filteredLineData));
    }

};

// draw envelope to `main chart`
drawEnvelope = function() {
    // clear pseudo video trail and speedTriangle
    svg.selectAll('.playTrace').remove();
    svg.selectAll('.playTriangle').remove();
    d3.selectAll('.envelopeline').remove();
    svg.selectAll('.area').remove();

    var svgDrawLine = d3.svg.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); });

    var clusterList = getCheckedCluster();
    var clusterId = clusterList.clusterId;
    if (clusterId.length == 0) return;
    var tempdata = clusterdata.filter(function(d) {
        return d.cluster_method == clusterList.clusterName;
    });
    tempdata = tempdata[0].details;
    for (var key in clusterId) {
        var curData = tempdata.filter(function(d) {
            return d["cluster"] == clusterId[key];
        });
        curData = curData[0];
        var colorId = clusterId[key];
        var lineData1 = curData.upper;
        var lineData2 = curData.lower;
        var filldata = [];
        for (var key in lineData1) {
            var temp = { x1: "", y1: "", x2: "", y2: "" };
            temp.x1 = lineData1[key].x;
            temp.x2 = lineData2[key].x;
            temp.y1 = lineData1[key].y;
            temp.y2 = lineData2[key].y;
            filldata.push(temp);
        }

        var area = d3.svg.area()
            .x0(function(d) { return x(d.x1); })
            .x1(function(d) {
                return x(d.x2);
            })
            .y0(function(d) { return y(d.y1); })
            .y1(function(d) {
                return y(d.y2);
            });
        svg.append("path")
            .attr("class", "envelopeline")
            .attr("fill", 'none')
            .attr("stroke", function() {
                return color(colorId);
            })
            .attr("stroke-width", 5)
            .attr("d", svgDrawLine(lineData1));

        svg.append("path")
            .attr("class", "envelopeline")
            .attr("fill", 'none')
            .attr("stroke", function() {
                return color(colorId);
            })
            .attr("stroke-width", 5)
            .attr("d", svgDrawLine(lineData2));
        svg.append("path")
            .attr('class', 'area')
            .attr("fill", function() {
                return color(colorId);
            })
            .attr("fill-opacity", 0.4)
            .attr("d", area(filldata));
    }

};

// rainbow colors for heatmap
colors = ["629cf4", "#56b4da", '#56dbc5', '#63db56', '#9fdb55', '#dcd956', '#db9156', '#da5e56', '#d32728'];
gridWidth = Math.floor(pseudoVideoWidth / 96), gridHeight = Math.floor(pseudoVideoHeight / 54), buckets = 9;

// draw heatmap to `main chart`
drawHeatmapChart = function() {
    // clear pseudo video trail and speedTriangle
    svg.selectAll('.playTrace').remove();
    svg.selectAll('.playTriangle').remove();
    svg.selectAll('.antDensityRectangle')
        .remove();

    var colorScale = d3.scale.quantile()
        .domain([0, buckets - 1, d3.max(heatmapdata, function(d) {
            return d.value;
        })])
        .range(colors);

    var curHeatmapData = [];
    var clusterList = getCheckedCluster();

    if (!clusterList.clusterId.length) return;

    var data = clusterdata.filter(function(d) {
        return d.cluster_method == clusterList.clusterName;
    });
    data = data[0].details;
    data = data.filter(function(d) {
        return clusterList.clusterId.indexOf(d.cluster) != -1
    });
    var loop = data[0].heatmap.length;
    var loopadd = data.length;
    for (var i = 0; i < loop; i++) {
        var tempdata = { col: 0, value: 0, row: 0 };
        tempdata.col = data[0].heatmap[i].col;
        tempdata.row = data[0].heatmap[i].row;
        for (var j = 0; j < loopadd; j++) {
            tempdata.value += data[j].heatmap[i].value;
        }
        curHeatmapData.push(tempdata);
    }

    var antRect = svg.select("#heatmapLayer")
        .selectAll(".antDensityRectangle")
        .data(curHeatmapData, function(d) {
            return d.row + ':' + d.col;
        });

    antRect.enter()
        .append("rect")
        .attr("x", function(d) {
            return d.col * gridWidth;
        })
        .attr("y", function(d) {
            return d.row * gridHeight;
        })
        .attr("rx", 0)
        .attr("ry", 0)
        .attr("class", "antDensityRectangle")
        .attr("width", gridWidth)
        .attr("height", gridHeight)
        .style("opacity", function(d) {
            if (d.value == 0) return 0;
            return 0.08 * colors.indexOf(colorScale(d.value)) + 0.3;
        })
        .style("fill", function(d) {
            return colorScale(d.value);
        });
};
