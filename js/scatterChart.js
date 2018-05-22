var scatterMargin = {
        top: 10,
        right: 10,
        bottom: 20,
        left: 30
    },
    scatterWidth = 200 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 150 - scatterMargin.top - scatterMargin.bottom;
var x2 = d3.scale.linear()
    .nice()
    .range([0, scatterWidth]);
var y2 = d3.scale.linear()
    .nice()
    .range([scatterHeight, 0]);


var ScatterFeatures = [];
var scatterCurrentAnts;
var scatterUndoStack = [];
var drawScatterChartClearUndo = false;

drawScatterChartSelect = function() {
    var sp = d3.selectAll('#xScatterSelectOpt');
    sp.selectAll('xScatterSelectOpt')
        .data(validFeatureNames)
        .enter()
        .append('div')
        .attr('class', 'item')
        .attr('data-value', function(d) {
            return d
        })
        .text(function(d) {
            return d
        });

    var sp = d3.selectAll('#yScatterSelectOpt');
    sp.selectAll('yScatterSelectOpt')
        .data(validFeatureNames)
        .enter()
        .append('div')
        .attr('class', 'item')
        .attr('data-value', function(d) {
            return d
        })
        .text(function(d) {
            return d
        });

    $('#scatterChart .ui.dropdown')
        .dropdown();

    var addButton = d3.select("#scatterAddButton")
        .on("click", function() {
            for (var i = 0; i < 4; i++) {
                if (ScatterFeatures[i] == undefined) {
                    var xselectedItem = d3.select('#xScatterSelectOpt').select(".selected");
                    var yselectedItem = d3.select('#yScatterSelectOpt').select(".selected");
                    if (xselectedItem.empty() || yselectedItem.empty()) break;
                    ScatterFeatures[i] = [xselectedItem.attr('data-value'), yselectedItem.attr('data-value')];
                    originClearUndo = drawScatterChart.clearUndo;
                    drawScatterChart.clearUndo = false;
                    drawScatterChart();
                    drawScatterChart.clearUndo = originClearUndo;
                    break;
                }
            }
        });


};

drawScatterChart = function() {
    var colorc = d3.scale.category20().domain([10, 0, 11, 1, 12, 2, 13, 3, 14, 4, 15, 5, 16, 6, 17, 7, 18, 8, 19, 9]);
    if (drawScatterChart.clearUndo) {
        scatterUndoStack = [];
    }
    var antsInfo = getCheckedAntsWithClusterInfo();
    var antsId = [];
    antsInfo.forEach(function(element) {
        antsId.push(element.id);
    });
    scatterCurrentAnts = antsId;

    d3.select("#scatterChart").selectAll(".singleScatter").selectAll("*").remove();
    radius = 3;
    ScatterFeatures.forEach(function(element, feature_i) {

        var xAxis2 = d3.svg.axis()
            .scale(x2)
            .orient("bottom")
            .ticks(3);

        var yAxis2 = d3.svg.axis()
            .scale(y2)
            .orient("left")
            .ticks(3);

        if (element == undefined) return;
        var xfeature = ScatterFeatures[feature_i][0];
        var yfeature = ScatterFeatures[feature_i][1];
        var featurevals = [];

        antsInfo.map(function(antInfo) {
            featurevals.push({
                x: featuredata[antInfo.id - 1][xfeature],
                y: featuredata[antInfo.id - 1][yfeature],
                id: antInfo.id,
                cluster: antInfo.cluster
            });
        });
        var domain_x = [d3.min(featurevals, function(d) {
            return parseFloat(d.x);
        }), d3.max(featurevals, function(d) {
            return parseFloat(d.x);
        })];

        var domain_y = [d3.min(featurevals, function(d) {
            return parseFloat(d.y);
        }), d3.max(featurevals, function(d) {
            return parseFloat(d.y);
        })];

        function adjustDomain(domain, ratio) {
            if (antsInfo.length == 1) {
                domain[0] = domain[0] - 50;
                domain[1] = domain[1] + 50;
            } else if (antsInfo.length >= 2) {
                offset = domain[1] - domain[0];
                domain[0] = domain[0] - ratio * offset;
                domain[1] = domain[1] + ratio * offset;
            }
            return domain;
        }
        domain_x = (adjustDomain(domain_x, 0.15));
        domain_y = (adjustDomain(domain_y, 0.15));

        x2.domain(domain_x, 0.15);
        y2.domain(domain_y, 0.15);

        var singleScatterChart = d3.select("#scatterChart").select("#scatter" + (feature_i + 1));

        var currentChart = singleScatterChart.append("svg")
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("viewBox", "-50 -15 225 160")
            .attr("width", "100%")
            .attr("height", "100%");

        xmax = d3.max(featurevals, function(d) {
            return d.x;
        });

        ymax = d3.max(featurevals, function(d) {
            return d.y;
        });

        if (xmax > 10000) {
            xAxis2.tickFormat(function(d) { return d / 1000 + "k" });

        }

        if (ymax > 10000) {
            yAxis2.tickFormat(function(d) { return d / 1000 + "k" });

        }
        //x axis
        currentChart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + scatterHeight + ")")
            .call(xAxis2)
            .append("text")
            .attr("class", "coordinateText")
            .attr("x",scatterWidth + 1)
            .attr("y", -6)
            .attr("unselectable", "on")
            .style("text-anchor", "end")
            .text(xfeature);
        //y axis
        currentChart.append("g")
            .attr("class", "y axis")
            .call(yAxis2)
            .append("text")
            .attr("class", "coordinateText")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .attr("unselectable", "on")
            .style("text-anchor", "end")
            .text(yfeature);

        currentChart.selectAll("circle")
            .data(featurevals).enter()
            .append("circle")
            .classed("scatterDot", true)
            .attr("r", radius)
            .attr("cx", function(d) {
                //console.log(datasele);
                //console.log(datasele[xfeature]);
                return x2(d.x);
            })
            .attr("cy", function(d) {
                return y2(d.y);
            })
            .style("fill", function(d, i) {
                return colorc(d.cluster);
            });

        function DrawRegression() {
            if (featurevals.length <= 1) return;

            xmean = d3.mean(featurevals, function(d) {
                return d.x;
            });
            ymean = d3.mean(featurevals, function(d) {
                return d.y;
            });
            var regreBetaUD = featurevals
                .map(function(d) {
                    return [(d.x - xmean) * (d.y - ymean), (d.x - xmean) * (d.x - xmean)];
                })
                .reduce(function(res, y) {
                    return [res[0] + y[0], res[1] + y[1]];
                });
            regreBeta = regreBetaUD[0] / regreBetaUD[1];
            regreAlpha = ymean - xmean * regreBeta;

            currentChart.append("line")
                .attr("x1", x2(domain_x[0]))
                .attr("y1", y2(regreAlpha + regreBeta * domain_x[0]))
                .attr("x2", x2(domain_x[1]))
                .attr("y2", y2(regreAlpha + regreBeta * domain_x[1]))
                .attr("stroke-width", 2)
                .attr("stroke", "black")
                .classed("regressionLine", true);
        }

        if (featurevals.length >= 3) {
            DrawRegression();
        }

        function onBrushedChange() {
            if (brushedPoints.length > 0) {
                originClearUndo = drawScatterChart.clearUndo;
                drawScatterChart.clearUndo = false;
                scatterUndoStack.push(scatterCurrentAnts);
                setAntBox(brushedPoints);
                drawScatterChart.clearUndo = originClearUndo;
            }
        }

        var xBrushField = d3.scale.linear().range([0, scatterWidth]);
        var yBrushField = d3.scale.linear().range([0, scatterHeight]);
        var Brush = currentChart.append("g")
            .attr("class", "brush").attr("transform", "translate(0,0)")
            .call(d3.svg.brush().x(xBrushField).y(yBrushField)
            .on("brush", brushedEvent)
            .on("brushend", brushendedEvent));

        var burshedPoints = [];


        function brushedEvent() {
            brushedPoints = [];
            var s = d3.event.target.extent(),
            x0 = s[0][0],
            y0 = 1 - s[0][1],
            x1 = s[1][0],
            y1 = 1 - s[1][1];
            if (x0 == x1 && y0 == y1) {

            } else {
                currentChart.selectAll('circle').each(function(d) {
                    var x = d.x
                    var y = d.y
                    var xx = (x - domain_x[0]) / (domain_x[1] - domain_x[0]);
                    var yy = (y - domain_y[0]) / (domain_y[1] - domain_y[0]);
                    //console.log("x0:" + x0 + " x1:" + x1 +" y0:" + y0 + " y1:" + y1 +
                    //    " cx:" + xx + " cy:" + yy
                    //);
                    if (xx >= x0 && xx <= x1 && yy <= y0 && yy >= y1) {
                        brushedPoints.push(d.id);
                    }
                    //console.log(brushedPoints);
                });
            }
        }

        var clicks = 0,
            delay = 400;

        function brushendedEvent() {
            event.preventDefault();
            var s = d3.event.target.extent(),
            x0 = s[0][0],
            y0 = 1 - s[0][1],
            x1 = s[1][0],
            y1 = 1 - s[1][1];
            if (x0 == x1 && y0 == y1) {
                // click / dbclick
                clicks++;
                if (clicks == 1) {
                    setTimeout(function () {
                        if (clicks >= 2) {
                            console.log("dblclick");
                            ScatterFeatures[feature_i] = undefined;
                            originClearUndo = drawScatterChart.clearUndo;
                            drawScatterChart.clearUndo = false;
                            drawScatterChart();
                            drawScatterChart.clearUndo = originClearUndo;
                        } else {
                            lastAnts = scatterUndoStack.pop();
                            if (lastAnts === undefined) return;
                            originClearUndo = drawScatterChart.clearUndo;
                            drawScatterChart.clearUndo = false;
                            setAntBox(lastAnts);
                            drawScatterChart.clearUndo = originClearUndo;
                        }
                        clicks = 0;
                        return;
                    }, delay);
                }
            }else{
                onBrushedChange();
            }
            d3.selectAll('.brush')
                .select(".extent")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .attr("height", 0);
            d3.selectAll('.brush')
                .selectAll("g")
                .style("display", "none");
        }
    });
};

drawScatterChart.clearUndo = true;
