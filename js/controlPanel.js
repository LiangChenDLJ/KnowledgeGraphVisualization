var currentClusterData;

// add cluster selection dropdown to the webpage and bind event
initializeClusterSelect = function() {
    var cl = d3.selectAll('#clusterOption');
    cl.selectAll('#clusterOption')
        .data(clusterdata)
        .enter()
        .append('div')
        .attr('class', 'item')
        .attr('data-value', function(d) {
            return d.cluster_method;
        })
        .text(function(d) {
            return d.cluster_method;
        });

    $('#directionSelect .dropdown')
        .dropdown({
            onChange: function() {
                initializePage();
                d3.selectAll('#antBox')
                    .selectAll('.item')
                    .remove();
                var a = $('#directionSelect .dropdown')
                    .dropdown('get value');
                drawDirectionAntNum(a[0]);
                var tempdata = clusterdata.filter(function(d) {
                    return d.cluster_method == a[0];
                });
                if (tempdata.length == 0) return;
                tempdata = tempdata[0];

                initializeMdsChart();
                initializeClusterBox(tempdata.details);

                currentClusterData = tempdata.details;
            }
        });
};

// add cluster boxes, select all box and deselect all box to `control panel`
initializeClusterBox = function(data) {
    // add cluster boxes
    var clusterBox = d3.select('#checkBoxlist')
        .selectAll('div')
        .data(data)
        .enter()
        .append('div')
        .attr('class', "ui checkbox fillWidth");
    clusterBox.append('input')
        .attr('type', 'checkbox')
        .attr('tabindex', function(d) {
            return d["cluster"];
        })
        .attr('class', 'hidden');
    clusterBox.append('label')
        .text(function(d) {
            return "cluster " + d["cluster"] + " (" + d["ant_id"].length + ")";
        });
    d3.selectAll('#checkBoxlist')
        .selectAll('.ui.checkbox')
        .each(function() {
            var a = d3.select(this).data();
            initializeAntBox(a[0]);
        });
    // bind event
    $('#checkBoxlist .ui.checkbox')
        .checkbox({
            onChecked: function() {
                updateFromClusterBox();
                var a = d3.select(this).data();
                clusterId = d3.select(this).data()[0]["cluster"];
                addAntBox(applyAllFilters(antsInsideClusters([clusterId])));
                updateFromAntBox();
            },
            onUnchecked: function() {
                updateFromClusterBox();
                var a = d3.select(this).data();
                uncheckAllAntBoxInCluster(a[0]);
                updateFromAntBox();
            }
        });

    // add select all checkbox
    var selectAllBox = d3.select('#clusterBox')
        .append('div')
        .attr('class', "ui checkbox fillWidth")
        .attr('id', 'SelectAllBox');
    selectAllBox.append('input')
        .attr('type', 'checkbox')
        .attr('tabindex', "-2")
        .attr('class', 'hidden');
    selectAllBox.append('label')
        .text("Select All");
    // bind event
    $('#clusterBox #SelectAllBox')
        .checkbox({
            onChecked: function() {
                $('#checkBoxlist .ui.checkbox').each(function() {
                    $(this).checkbox('set unchecked');
                    $(this).checkbox('set checked');
                });
                $('#clusterBox #SelectAllBox').checkbox('uncheck');
                updateFromClusterBox();
                setAntBox(applyAllFilters(antsInsideClusters()));
                updateFromAntBox();
            }
        });

    // add deselect all checkbox
    var deselectAllBox = d3.select('#clusterBox')
        .append('div')
        .attr('class', "ui checkbox fillWidth")
        .attr('id', 'DeselectAllBox');
    deselectAllBox.append('input')
        .attr('type', 'checkbox')
        .attr('tabindex', "-1")
        .attr('class', 'hidden');
    deselectAllBox.append('label')
        .text("Deselect All");
    // bind event
    $('#clusterBox #DeselectAllBox')
        .checkbox({
            onChecked: function() {
                deselectAllAntBox();
                $('#clusterBox #DeselectAllBox').checkbox('set unchecked');
            }
        });
};

updateFromClusterBox = function () {
    if(videoRunning){
        stopPlayer();
    }
    drawMds();
    drawClusterAntNum();
    drawBoxChart();
    var option = getCheckedOption();
    if("Center line" in option)drawCenterLine();
    if("Heat map" in option)drawHeatmapChart();
    if("Envelope" in option)drawEnvelope();
    mainChartUndoable = false;
    mdsUndoable = false;
};

updateFromAntBox = function() {
    if(videoRunning){
        stopPlayer();
    }
    drawSelectedAntNum();
    drawMdsOpacity();
    drawScatterChart();
    mainChartUndoable = false;
    mdsUndoable = false;
};

// add ant boxes to `control panel` and bind event
initializeAntBox = function(ant) {
    d3.select("#antBox")
        .append('div')
        .classed("antsGroup", true)
        .attr('id', function() {
            return 'cluster' + ant["cluster"];
        });
    var sel_id = '#' + 'cluster' + ant["cluster"];

    d3.select("#antBox")
        .select(sel_id)
        .datum(ant["cluster"])
        .append('label')
        .datum(ant["cluster"])
        .text(function() {
            return "cluster" + ant["cluster"];
        });

    var tmpBr = d3.select("#antBox")
        .select(sel_id)
        .append('div')
        .attr('class', 'myList');

    var sub2 = tmpBr.selectAll('.myList');
    var sub = sub2
        .data(ant["ant_id"])
        .enter()
        .append('div')
        .attr('class', 'ui checkbox fillWidth');
    sub.append('input')
        .attr('type', 'checkbox')
        .attr('name', function(d) {
            return 'ant' + d;
        });
    sub.append('label')
        .text(function(d) {
            return 'ant ' + d;
        });

    var clusterId = ant['cluster'];
    var string = '#antBox' + ' #cluster' + clusterId + ' .ui.checkbox';
    // bind event to ant box
    $(string)
        .checkbox({
            onChecked: function() {
                clusterId = d3.select(this.parentNode.parentNode).data();
                d3.select('#clusterBox')
                    .select('#checkBoxlist')
                    .selectAll('.ui.checkbox')
                    .each(function(d) {
                        if ($(this).checkbox('is unchecked') && d.cluster == clusterId){
                            $(this).checkbox("set checked");
                            updateFromClusterBox();
                        }
                    });
                var t = d3.select(this).data();
                addAntToMainChart(t[0]);
                updateFromAntBox();

            },
            onUnchecked: function() {
                var t = d3.select(this).data();
                deleteAntFromMainChart(t[0]);
                updateFromAntBox();
            }
        });
};

// return a list containing all checked clusters
getCheckedCluster = function() {
    var clusterList = { clusterName: "", clusterId: [] };
    var cluster = $('#directionSelect .dropdown')
        .dropdown('get value');
    clusterList.clusterName = cluster[0];
    d3.select('#clusterBox')
        .select('#checkBoxlist')
        .selectAll('.ui.checkbox')
        .each(function(d) {
            if ($(this).checkbox('is checked')) clusterList.clusterId.push(d.cluster);
            return d;
        });
    return clusterList;
};

// return a list containing all checked ants
getCheckedAnt = function() {
    var antList = [];
    d3.select('#antBox')
        .selectAll('.ui.checkbox')
        .each(function(d) {
            if ($(this).checkbox('is checked')) antList.push(d);
            return d;
        });
    return antList;
};

// return a list containing all checked ants and their cluster
getCheckedAntsWithClusterInfo = function() {
    var antList = [];
    d3.select('#antBox').selectAll(".antsGroup")
        .each(function() {
            var cluster = (d3.select(this).select("label").data())[0];
            d3.select(this)
                .selectAll('.ui.checkbox')
                .each(function(d) {
                    if ($(this).checkbox('is checked')) antList.push({ id: d, cluster: cluster });
                    return d;
                });
        });
    return antList;
};

// update all views from checked ant box


// update checked/unchecked ant boxes
// interact with brushing results of `scatter chart`/`mdschart`
setAntBox = function(ants_id) {
    // auxiliary array to reduce time complexity
    var reftable = [];
    ants_id.forEach(function(d) {
        reftable[d] = true;
    });
    d3.select('#antBox')
        .selectAll('.ui.checkbox.checked')
        .each(function(d) {
            if (reftable[d] == undefined) {
                $(this).checkbox('set unchecked');
                var t = d3.select(this).data();
                deleteAntFromMainChart(t[0]);
            }
        });
    d3.select('#antBox')
        .selectAll('.ui.checkbox:not(.checked)')
        .each(function(d) {
            if (reftable[d] == true) {
                $(this).checkbox('set checked');
                var t = d3.select(this).data();
                addAntToMainChart(t[0]);
            }
        });
    updateFromAntBox();
};

addAntBox = function(ants_id){
    var reftable = [];
    ants_id.forEach(function(d) {
        reftable[d] = true;
    });
    d3.select('#antBox')
        .selectAll('.ui.checkbox:not(.checked)')
        .each(function(d) {
            if (reftable[d] == true) {
                $(this).checkbox('set checked');
                var t = d3.select(this).data();
                addAntToMainChart(t[0]);
            }
        });
    updateFromAntBox();
};
/*
// update checked/unchecked ant boxes using time filter results
setAntBoxWithTimeFilter = function(ants_id) {
    // auxiliary array to reduce time complexity
    var reftable = [];
    ants_id.forEach(function(d) {
        reftable[d] = true;
    });
    var checkedClusters = getCheckedCluster().clusterId;
    var clusterSelection = d3.select('#antBox')
        .selectAll('.antsGroup')
        .filter(function(d) {
            return checkedClusters.includes(d);
        });
    clusterSelection.selectAll('.ui.checkbox.checked')
        .each(function(d) {
            if (reftable[d] == undefined) {
                $(this).checkbox('set unchecked');
                var t = d3.select(this).data();
                deleteAntFromMainChart(t[0]);
            }
        });
    clusterSelection.selectAll('.ui.checkbox:not(.checked)')
        .each(function(d) {
            if (reftable[d] == true) {
                $(this).checkbox('set checked');
                var t = d3.select(this).data();
                addAntToMainChart(t[0]);
            }
        });
    updateFromAntBox();
};
*/
// check all ant box in a cluster
// interact with cluster box
checkAllAntBoxInCluster = function(clusterId) {
    var string = '#antBox' + ' #cluster' + clusterId + ' .ui.checkbox';
    d3.selectAll(string)
        .each(function(d) {
            if ($(this).checkbox('is unchecked')) {
                addAntToMainChart(d);
            }
        });
    $(string).checkbox('set checked');
};

// uncheck all ant box in a cluster
// interact with cluster box
uncheckAllAntBoxInCluster = function(ant) {
    var sel_id = '#' + 'cluster' + ant["cluster"];
    var string = "#antBox " + sel_id + ' .ui.checkbox';
    $(string)
        .checkbox('set unchecked');

    d3.selectAll(string)
        .each(function(d) {
            deleteAntFromMainChart(d);
        });
};

// deselect all cluster boxes and ant boxes and update related views
deselectAllAntBox = function() {
    d3.selectAll('#antBox .ui.checkbox').each(function(d){
        $(this).checkbox("set unchecked");
        deleteAntFromMainChart(d);
    });
    updateFromAntBox();
    d3.selectAll('#checkBoxlist .ui.checkbox').each(function(){
        $(this).checkbox("set unchecked");
    });
    updateFromClusterBox();
};

antsInsideClusters = function(){
    var checkedClusters;
    if (arguments.length > 0)
        checkedClusters = new Set(arguments[0]);
    else
        checkedClusters = new Set(getCheckedCluster().clusterId);
    var ants = [];
    for (indexId in currentClusterData) {
        if (checkedClusters.has(parseInt(indexId))) {
            ants = ants.concat(currentClusterData[indexId].ant_id);
        }
    }
    return ants;
}

applyAllFilters = function(inputAnts) {
    return applyAttrFilter(applyTimeFilter(inputAnts));
}