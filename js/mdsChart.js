var mdsSvg;
var x_min;
var y_min;
var x_range;
var y_range;

var mdsUndoable = false;
var mdsBrushRec = [];

var mdsMargin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    },
    mdsWidth = 240 - mdsMargin.left - mdsMargin.right,
    mdsHeight = 240 - mdsMargin.top - mdsMargin.bottom;
var mdsX = d3.scale.linear()
    .nice()
    .range([0, mdsWidth]);
var mdsY = d3.scale.linear()
    .nice()
    .range([mdsHeight, 0]);

var mds_xAxis = d3.svg.axis()
    .scale(mdsX)
    .orient("bottom")
    .ticks(5);
var mds_yAxis = d3.svg.axis()
    .scale(mdsY)
    .orient("left")
    .ticks(5);

// calculate scaling and add svg element to `mds chart`
initializeMdsChart = function() {
    var clusterList = getCheckedCluster();
    var curdata = clusterdata.filter(function(d) {
        return d.cluster_method == clusterList.clusterName;
    });
    if (curdata.length == 0) return;
    curdata = curdata[0].details;
    var xyRange = { x: [], y: [] };

    // calculate mds data x range and y range
    for (var key in curdata) {
        var tempdata = curdata[key].mds;
        for (var m in tempdata) {
            xyRange.x.push(tempdata[m].x);
            xyRange.y.push(tempdata[m].y);
        }
    }

    var xDomain = [d3.min(xyRange.x, function(d) {
        return parseFloat(d);
    }), d3.max(xyRange.x, function(d) {
        return parseFloat(d);
    })];
    x_min = xDomain[0];
    x_range = xDomain[1] - xDomain[0];

    var yDomain = [d3.min(xyRange.y, function(d) {
        return parseFloat(d);
    }), d3.max(xyRange.y, function(d) {
        return parseFloat(d);
    })];
    y_min = yDomain[0];
    y_range = yDomain[1] - yDomain[0];

    mdsX.domain(xDomain);
    mdsY.domain(yDomain);

    d3.select('#mdsChart')
        .selectAll('svg')
        .remove();
    mdsSvg = d3.select("#mdsChart")
        .append("svg")
        .attr("id", "mds")
        .attr("viewBox", "-20 -20 260 260")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("width", "100%")
        .attr("height", "100%");
    // uncomment axis below for debugging
    //x axis
    // mdsSvg.append("g")
    //     .attr("class", "x axis")
    //     .attr("transform", "translate(0," + mdsHeight + ")")
    //     .call(mds_xAxis)
    //     .append("text")
    //     .attr("x", mdsWidth - 20)
    //     .attr("y", -6)
    //     .style("text-anchor", "end")
    //     .text(function () {
    //         return "x";
    //     });
    //y axis
    // mdsSvg.append("g")
    //     .attr("class", "y axis")
    //     .call(mds_yAxis)
    //     .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 6)
    //     .attr("dy", ".71em")
    //     .style("text-anchor", "end")
    //     .text(function () {
    //         return "y";
    //     });
};

// draw selected cluster to `mds chart`
drawMds = function() {
    if (!mdsSvg) return;
    // clean up mds chart
    mdsSvg.selectAll('div')
        .remove();
    mdsSvg.selectAll('circle')
        .remove();

    var clusterList = getCheckedCluster();
    var clusterId = clusterList.clusterId;
    if (clusterId.length == 0) return;

    var tempdata = clusterdata.filter(function(d) {
        return d.cluster_method == clusterList.clusterName;
    });
    tempdata = tempdata[0].details;

    for (var i in clusterId) {
        var curData = tempdata.filter(function(d) {
            return d["cluster"] == clusterId[i];
        });
        // TODO: change speedTriangleID to mdsDotID
        curData = curData[0];
        var id = curData.cluster;
        var speedTriangleID = "speedTriangle" + id;
        mdsSvg.append('div')
            .attr('class', speedTriangleID);
        curData = curData.mds;
        var len = curData.length;
        for (s = 0; s < len; s++) {
            mdsSvg.append("circle")
                .attr('class', speedTriangleID)
                .attr('r', '3')
                .attr('cx', function() {
                    return mdsX(curData[s].x);
                })
                .attr("cy", function() {
                    return mdsY(curData[s].y);
                })
                .attr('ox', function() {
                    return curData[s].x;
                })
                .attr("oy", function() {
                    return curData[s].y;
                })
                .attr("ant", function() {
                    return curData[s].ant_id;
                })
                .style('fill', function() {
                    return color(id);
                })
        }
    }

    // add brush event to mds chart
    var brushedAnt = [];
    var $xBrushField = d3.scale.linear().range([0, mdsWidth]);
    var $yBrushField = d3.scale.linear().range([0, mdsHeight]);
    var Brush = mdsSvg.append("g")
        .attr("class", "brush")
        .attr("transform", "translate(0,0)")
        .call(d3.svg.brush()
            .x($xBrushField)
            .y($yBrushField)
            .on("brush", brushing)
            .on("brushend", brushEnded));

    function brushing() {
        var s = d3.event.target.extent(),
            x0 = s[0][0],
            y0 = 1 - s[0][1],
            x1 = s[1][0],
            y1 = 1 - s[1][1];
        if (x0 == x1 && y0 == y1) {

        } else {
            brushedAnt.splice(0, brushedAnt.length);
            mdsSvg.selectAll('circle')
                .each(function() {
                    var x = this.getAttribute(["ox"]);
                    var y = this.getAttribute(["oy"]);
                    var xx = (x - x_min) / x_range;
                    var yy = (y - y_min) / y_range;
                    if (xx >= x0 && xx <= x1 && yy <= y0 && yy >= y1) {
                        if (brushedAnt.indexOf(+this.getAttribute(["ant"])) == -1)
                            brushedAnt.push(+this.getAttribute(["ant"]));
                    }
                });
        }
    }

    function brushEnded() {
        var s = d3.event.target.extent(),
            x0 = s[0][0],
            y0 = 1 - s[0][1],
            x1 = s[1][0],
            y1 = 1 - s[1][1];
        if (x0 == x1 && y0 == y1) {
                // undo
                if(mdsUndoable){
                    setAntBox(mdsBrushRec);
                    mdsUndoable = false;
                }
        } else{
            if (brushedAnt.length > 0) {
                if(!mdsUndoable) mdsBrushRec = getCheckedAnt();
                setAntBox(applyAllFilters(brushedAnt));
                mdsUndoable = true;
            }
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
};

// update mds chart with selected ants
drawMdsOpacity = function() {
    var antList = getCheckedAnt();
    d3.select('#mds')
        .selectAll('circle')
        .each(function() {
            var antID = parseInt(this.getAttribute(["ant"]));
            if (antList.indexOf(antID) == -1) {
                this.style.opacity = 0.4;
            } else {
                this.style.opacity = 1;
            }
        })
};
