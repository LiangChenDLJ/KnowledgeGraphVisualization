var updateChartsPanel = function(){
    updateDegreeDensityChart();
    updateAccuracyDensityChart();
    updateRelationPieChart();
}

var updateDegreeDensityChart = function(){
    nodeDegrees = {};
    for(tupleInd in filterOutput) {
        tuple = filterOutput[tupleInd];
        nodeDegrees[tuple[0]] = entityDegrees[tuple[0]];
        nodeDegrees[tuple[1]] = entityDegrees[tuple[1]];
    }
    data = Object.values(nodeDegrees);
    initialDensityPlot('Degree\'s kernel Density Estimation', '#degreeDensityChart', data, [Math.min(...data), Math.max(...data) + 1], 7);
}

var updateAccuracyDensityChart = function(){
    accuracy = [];
    for(tupleInd in filterOutput) {
        tuple = filterOutput[tupleInd];
        accuracy.push(extracted_data[tuple[0] + ' ' + tuple[1]]['a']);
    }
    data = accuracy;
    initialDensityPlot('Accuracy\'s kernel Density Estimation', '#accuracyDensityChart', data, [Math.min(...accuracy) - 0.1, Math.max(...accuracy)], 1);
}

var updateRelationPieChart = function(){
    d3.select('#relationPieChart').selectAll('*').remove();
    data = {};
    if(filterOutput.length == 0)return;
    for(tupleInd in filterOutput){
        tuple = filterOutput[tupleInd];
        relationType = extracted_data[tuple[0] + ' ' + tuple[1]]['p'];
        if(relationType in data){
            data[relationType]['value'] += 1;
        }else{
            data[relationType] = {
                label:relation_data[relationType],
                value:1,
                color:relationColorScale(relationType/relation_data.length)
            }
        }
    }
    drawpie(Object.values(data));
}

var drawpie = function(data){
    pie = new d3pie("relationPieChart", {
        "header": {
            "title": {
                "text": "Relation Type Distribution",
                "fontSize": 24,
                "font": "open sans"
            }
        },
        "footer": {
            "color": "#999999",
            "fontSize": 10,
            "font": "open sans",
            "location": "bottom-left"
        },
        "size": {
            "canvasWidth": 300,
            "canvasHight" : 300,
            "pieOuterRadius": "90%"
        },
        "data": {
            "sortOrder": "value-desc",
            "content": data},
        "labels": {
            "outer": {
                "pieDistance": 32
            },
            "inner": {
                "hideWhenLessThanPercentage": 3
            },
            "mainLabel": {
                "fontSize": 11
            },
            "percentage": {
                "color": "#ffffff",
                "decimalPlaces": 0
            },
            "value": {
                "color": "#adadad",
                "fontSize": 11
            },
            "lines": {
                "enabled": true
            },
            "truncation": {
                "enabled": true
            }
        },
        "effects": {
            "pullOutSegmentOnClick": {
                "effect": "linear",
                "speed": 400,
                "size": 8
            }
        },
        "misc": {
            "gradient": {
                "enabled": true,
                "percentage": 100
            }
        },
        callbacks: {
            onMouseoverSegment: function(info) {
                tooltip
                    .html(function () {
                        var displayinfo = "<span style='color:#d9e778'>";
                        displayinfo += "<strong>" + info['data']['label'] + "</strong><br/>"
                        displayinfo += "<strong>" + info['data']['percentage'] + "%" + "</strong>"
                        displayinfo += "</span>";
                        return displayinfo;
                    })
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("visibility", "visible");
            },
            onMouseoutSegment: function(info) {
                if (!(tooltip.style("visibility") === "visible")) {
                    return;
                }
                tooltip.style("visibility", "hidden");
            }
        }
    });
}