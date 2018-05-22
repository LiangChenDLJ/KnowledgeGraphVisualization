(function() {
    // Inspired by http://informationandvisualization.de/blog/box-plot
    d3.box = function() {
        var width = 1,
            height = 1,
            duration = 0,
            domain =  [Infinity, -Infinity];
            value = Number,
            whiskers = boxWhiskers,
            quartiles = boxQuartiles,
            tickFormat = null;
            abnormal = false;
        var colorc= d3.scale.category20().domain([10,0,11,1,12,2,13,3,14,4, 15, 5, 16, 6, 17, 7, 18, 8, 19, 9]);

        function box(g) {
            g.each(function(dwithcolor, i){
                var d = dwithcolor.data.map(value).sort(d3.ascending);
                if(abnormal){
                    min = d[0];
                    max = d[d.length-1];
                }else{
                    d.quartiles = quartiles(d);
                    whiskerIndices = whiskers && whiskers.call(this, d, i);
                    min = d[whiskerIndices[0]];
                    max = d[whiskerIndices[1]];
                }
                if(min < domain[0]){
                    domain[0] = min;
                }
                if(max > domain[1]){
                    domain[1] = max
                }
            });
            domain = d3.functor(domain);
            g.each(function(dwithcolor, i) {
                var colorID = dwithcolor.colorID;
                d = dwithcolor.data.map(value).sort(d3.ascending);
                var g = d3.select(this),
                    n = d.length,
                    min = d[0],
                    max = d[n - 1];

                // Compute quartiles. Must return exactly 3 elements.
                var quartileData = d.quartiles = quartiles(d);

                // Compute whiskers. Must return exactly 2 elements, or null.
                var whiskerIndices = whiskers && whiskers.call(this, d, i),
                    whiskerData = whiskerIndices && whiskerIndices.map(function(i) { return d[i]; });

                // Compute outliers. If no whiskers are specified, all data are "outliers".
                // We compute the outliers as indices, so that we can join across transitions!
                var outlierIndices = whiskerIndices ?
                    d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n)) :
                    d3.range(n);

                // Compute the new x-scale.
                var x1 = d3.scale.linear()
                    //.domain(domain)
                    .domain(domain && domain.call(this, d, i) || [min, max])
                    .range([height, 0]);

                // Retrieve the old x-scale, if this is an update.
                var x0 = this.__chart__ || d3.scale.linear()
                    .domain([0, Infinity])
                    .range(x1.range());

                // Stash the new scale.
                this.__chart__ = x1;

                // Note: the box, median, and box tick elements are fixed in number,
                // so we only have to handle enter and update. In contrast, the outliers
                // and other elements are variable, so we need to exit them! Variable
                // elements also fade in and out.

                // Update center line: the vertical line spanning the whiskers.
                var center = g.selectAll("line.center")
                    .data(whiskerData ? [whiskerData] : []);

                center.enter().insert("line", "rect")
                    .attr("class", "center")
                    .attr("x1", String(width / 2.5) + "%")
                    .attr("y1", function(d) {
                        //console.log(d);
                        return x0(d[0]);
                    })
                    .attr("x2", String(width / 2.5) + "%")
                    .attr("y2", function(d) { return x0(d[1]); })
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .style("opacity", 1)
                    .attr("y1", function(d) { return x1(d[0]); })
                    .attr("y2", function(d) { return x1(d[1]); });

                center.transition()
                    .duration(duration)
                    .style("opacity", 1)
                    .attr("y1", function(d) { return x1(d[0]); })
                    .attr("y2", function(d) { return x1(d[1]); });

                center.exit().transition()
                    .duration(duration)
                    .style("opacity", 1e-6)
                    .attr("y1", function(d) { return x1(d[0]); })
                    .attr("y2", function(d) { return x1(d[1]); })
                    .remove();

                // Update innerquartile box.
                var box = g.selectAll("rect.box")
                    .data([quartileData]);

                box.enter().append("rect")
                    .attr("class", "box")
                    .attr("x", 0)
                    .attr("y", function(d) { return x0(d[2]); })
                    .attr("width", String(width) + "%")
                    .attr("height", function(d) { return x0(d[0]) - x0(d[2]); })
                    .attr("fill", function(d, i) {
                        return colorc(colorID % 20)
                    })
                    .transition()
                    .duration(duration)
                    .attr("y", function(d) { return x1(d[2]); })
                    .attr("height", function(d) { return x1(d[0]) - x1(d[2]); });

                box.transition()
                    .duration(duration)
                    .attr("y", function(d) { return x1(d[2]); })
                    .attr("height", function(d) { return x1(d[0]) - x1(d[2]); });

                // Update median line.
                var medianLine = g.selectAll("line.median")
                    .data([quartileData[1]]);

                medianLine.enter().append("line")
                    .attr("class", "median")
                    .attr("stroke", "red")
                    .attr("x1", 0)
                    .attr("y1", x0)
                    .attr("x2", String(width) + "%")
                    .attr("y2", x0)
                    .transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1);

                medianLine.transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1);

                // Update whiskers.
                var whisker = g.selectAll("line.whisker")
                    .data(whiskerData || []);

                whisker.enter().insert("line", "circle, text")
                    .attr("class", "whisker")
                    .attr("x1", 0)
                    .attr("y1", x0)
                    .attr("x2", String(width) + "%")
                    .attr("y2", x0)
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1)
                    .style("opacity", 1);

                whisker.transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1)
                    .style("opacity", 1);

                whisker.exit().transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1)
                    .style("opacity", 1e-6)
                    .remove();

                if(abnormal) {
                    // Update outliers.
                    var outlier = g.selectAll("circle.outlier")
                        .data(outlierIndices, Number);

                    outlier.enter().insert("circle", "text")
                        .attr("class", "outlier")
                        .attr("r", 5)
                        .attr("cx", String(width / 2) + "%")
                        .attr("cy", function (i) {
                            return x0(d[i]);
                        })
                        .style("opacity", 1e-6)
                        .transition()
                        .duration(duration)
                        .attr("cy", function (i) {
                            return x1(d[i]);
                        })
                        .style("opacity", 1);

                    outlier.transition()
                        .duration(duration)
                        .attr("cy", function (i) {
                            return x1(d[i]);
                        })
                        .style("opacity", 1);

                    outlier.exit().transition()
                        .duration(duration)
                        .attr("cy", function (i) {
                            return x1(d[i]);
                        })
                        .style("opacity", 1e-6)
                        .remove();
                }
                // Compute the tick format.
                // original format
                // var format = tickFormat || x1.tickFormat(8);
                var format = function(f){
                    return f.toFixed(1).toString();
                }

                // Update box ticks.
                var boxTick = g.selectAll("text.box")
                    .data([quartileData[1]]);
                boxTick.enter().append("text")
                    .attr("class", "box")
                    .attr("dy", ".3em")
                    .attr("dx", 6)
                    .attr("x", String(width) + "%")
                    .attr("y", x0)
                    .attr("text-anchor", "start")
                    .text(format)
                    .transition()
                    .duration(duration)
                    .attr("y", x1);

                boxTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr("y", x1);

                // Update whisker ticks. These are handled separately from the box
                // ticks because they may or may not exist, and we want don't want
                // to join box ticks pre-transition with whisker ticks post-.
                var whiskerTick = g.selectAll("text.whisker")
                    .data(whiskerData || []);

                whiskerTick.enter().append("text")
                    .attr("class", "whisker")
                    .attr("dy", ".3em")
                    .attr("dx", 6)
                    .attr("x", String(width) + "%")
                    .attr("y", x0)
                    .text(format)
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .attr("y", x1)
                    .style("opacity", 1);

                whiskerTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr("y", x1)
                    .style("opacity", 1);

                whiskerTick.exit().transition()
                    .duration(duration)
                    .attr("y", x1)
                    .style("opacity", 1e-6)
                    .remove();
            });
            d3.timer.flush();
        }

        // in order to adjust the size of boxes dynamic
        // the width is a number of per cent
        // but the height is an absolute value
        box.width = function(x) {
            if (!arguments.length) return width;
            width = x;
            return box;
        };

        box.height = function(x) {
            if (!arguments.length) return height;
            height = x;
            return box;
        };

        box.tickFormat = function(x) {
            if (!arguments.length) return tickFormat;
            tickFormat = x;
            return box;
        };

        box.duration = function(x) {
            if (!arguments.length) return duration;
            duration = x;
            return box;
        };

        box.domain = function(x) {
            if (!arguments.length) return domain;
            domain = x == null ? x : d3.functor(x);
            return box;
        };

        box.value = function(x) {
            if (!arguments.length) return value;
            value = x;
            return box;
        };

        box.whiskers = function(x) {
            if (!arguments.length) return whiskers;
            whiskers = x;
            return box;
        };

        box.quartiles = function(x) {
            if (!arguments.length) return quartiles;
            quartiles = x;
            return box;
        };

        box.abnormal = function(x){
            if (!arguments.length) return abnormal;
            abnormal = x;
            return box;
        }

        return box;
    };

    function boxWhiskers(d) {
        return [0, d.length - 1];
    }

    function boxQuartiles(d) {
        return [
            d3.quantile(d, .25),
            d3.quantile(d, .5),
            d3.quantile(d, .75)
        ];
    }
})();

var BoxFeatures = [];
var MaxBoxChartNumber = 2;
var marginbox = { top: 5, right: 5, bottom: 5, left: 5 },
    heightbox = 135;

drawBoxChartSelect = function() {
    var sp = d3.selectAll('#yBoxSelectOpt');
    sp.selectAll('#yBoxSelectOpt')
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

    $('#boxChart .ui.dropdown')
        .dropdown();

    var boxAddButton = d3.select("#boxAddButton")
        .on("click", function() {
            for (var i = 0; i < MaxBoxChartNumber; i++) {
                if (BoxFeatures[i] == undefined) {
                    var selectedItem = d3.select('#yBoxSelectOpt').select(".selected");
                    if (selectedItem.empty()) break;
                    BoxFeatures[i] = selectedItem.attr('data-value');
                    drawBoxChart();
                    break;
                }
            }
        });

    $('#boxChart #abnormalCheckbox').checkbox({
        onChange: function() {
            $(this).checkbox("toggle");
            drawBoxChart();
        }
    })
}

drawBoxChart = function() {
    checkedRes = getCheckedCluster();
    var BoxChart = d3.select("#boxChart");
    d3.selectAll(".singleBox").selectAll("*").remove();
    var hasAbnormal = $('#boxChart #abnormalCheckbox').checkbox("is checked");
    BoxFeatures.forEach(function(element, feature_i) {
        if (element == undefined) return;
        var featureName = element;
        clusterMethod = checkedRes.clusterName;
        clusterIDs = checkedRes.clusterId;

        ants_id = [];
        for (var i in clusterIDs) {
            ants_id.push([]);
        }

        for (var method_i in clusterdata) {
            if (clusterdata[method_i]["cluster_method"] != clusterMethod) {
                continue;
            }
            clusterMethod = clusterdata[method_i];
            for (var cluster_i in clusterMethod["details"]) {
                this_cluster = clusterMethod["details"][cluster_i];
                this_cluster_id = this_cluster["cluster"];
                for (var list_cluster_id in clusterIDs) {
                    if (clusterIDs[list_cluster_id] == this_cluster_id) {
                        ants_id[list_cluster_id] = this_cluster["ant_id"];
                        break;
                    }
                }
            }
        }

        var ants_feature = ants_id.map(function(cluster_ants, index) {
            return {
                data: cluster_ants.map(function(each_ant) {
                    return featuredata[each_ant - 1][featureName];
                }),
                colorID: clusterIDs[index]
            };
        })
        eachratio = String(100 / ants_feature.length);


        var singleBoxChart = d3.select("#boxChart").select("#box" + (feature_i + 1))
            .append("svg")
            .attr("viewBox", "0 30 250 90")
            .attr("width", "100%")
            .attr("height", "100%");

        var chart = d3.box()
            .whiskers(function(d, i) {
                var k = 1.5;
                var q1 = d.quartiles[0],
                    q3 = d.quartiles[2],
                    iqr = (q3 - q1) * k,
                    i = -1,
                    j = d.length;
                while (d[++i] < q1 - iqr);
                while (d[--j] > q3 + iqr);
                return [i, j];
            })
            .width(40 / ants_feature.length)
            .height(heightbox)
            .abnormal(hasAbnormal);

        var featureLabel = singleBoxChart
            .append("text")
            .attr("width", "100%")
            .attr("height", "20%")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "0%")
            .text(featureName);

        var svg = singleBoxChart.selectAll("svg")
            .data(ants_feature).enter()
            .append("svg")
            .attr("cluster", function(d, i) {
                return clusterIDs[i];
            })
            .attr("class", "box")
            .attr("width", "90%")
            .attr("height", "500%")
            .attr("x", function(d, i) {
                return String(100 / ants_feature.length * i) + "%"
            })
            .attr("y", "10%");

        svg.append("g")
            .attr("transform", "translate(" + marginbox.left + "," + marginbox.top + ")")
            .call(chart);

        svg.on('mouseover', function(d) {
                var clusterID = this.getAttribute("cluster");
                tooltip
                    .html(function() {
                        return "<strong>Cluster:</strong> <span style='color:#d9e778'>" + clusterID + "</span>";
                    })
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("visibility", "visible");
            })

            .on('mouseout', function(d) {
                tooltip.style("visibility", "hidden");
            });

        singleBoxChart.on("dblclick", function() {
            tooltip.style("visibility", "hidden");
            BoxFeatures[feature_i] = undefined;
            drawBoxChart();
        });
    });
};
