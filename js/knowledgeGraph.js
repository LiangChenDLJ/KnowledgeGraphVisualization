var knowledgeGraphSVG;

var updateGraph;

var updateWordCloud = function(){
    var common = "poop  i  me  my  myself  we  us  our  ours  ourselves  you  your  yours  yourself  yourselves  he  him  his  himself  she  her  hers  herself  it  its  itself  they  them  their  theirs  themselves  what  which  who  whom  whose  this  that  these  those  am  is  are  was  were  be  been  being  have  has  had  having  do  does  did  doing  will  would  should  can  could  ought  i'm  you're  he's  she's  it's  we're  they're  i've  you've  we've  they've  i'd  you'd  he'd  she'd  we'd  they'd  i'll  you'll  he'll  she'll  we'll  they'll  isn't  aren't  wasn't  weren't  hasn't  haven't  hadn't  doesn't  don't  didn't  won't  wouldn't  shan't  shouldn't  can't  cannot  couldn't  mustn't  let's  that's  who's  what's  here's  there's  when's  where's  why's  how's  a  an  the  and  but  if  or  because  as  until  while  of  at  by  for  with  about  against  between  into  through  during  before  after  above  below  to  from  up  upon  down  in  out  on  off  over  under  again  further  then  once  here  there  when  where  why  how  all  any  both  each  few  more  most  other  some  such  no  nor  not  only  own  same  so  than  too  very  say  says  said  shall , . ? ! :";
    var svg_location = "#wordCloudTab";
    var fillColor = d3.schemeCategory10;
    word_count = {};
    for(tupleInd in filterOutput){
        sentences = extracted_data[filterOutput[tupleInd][0] + ' ' + filterOutput[tupleInd][1]]['o'];
        for(senInd in sentences){
            sentence = sentences[senInd];
            for(wordInd in(sentence)){
                word = sentence[wordInd];
                if (word != "" && common.indexOf(word)==-1 && word.length>1){
                    if (word_count[word])
                        word_count[word]++;
                    else
                        word_count[word] = 1;
                }
            }
        }
    }

    d3.select(svg_location).selectAll('svg').remove();
    var width = $('#wordCloudTab').width();
    var height = $('#wordCloudTab').height();
    var word_entries = d3.entries(word_count);
    var xScale = d3.scaleLinear()
        .domain([0, d3.max(word_entries, function(d) {
            return d.value;})
        ])
        .range([10,100]);
    d3.layout.cloud().size([width, height])
        .timeInterval(20)
        .words(word_entries)
        .fontSize(function(d) { return xScale(+d.value); })
        .text(function(d) { return d.key; })
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .font("Impact")
        .on("end", draw)
        .start();
    function draw(words) {
        d3.select(svg_location).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function(d) { return xScale(d.value) + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fillColor[i%10]; })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";})
            .text(function(d) { return d.key; });}d3.layout.cloud().stop();

}

var initialGraph = function(){
    $('#filterTabMenu .item').tab();
    var viewBoxInitW = 700;
    var viewBoxInitH = 300;
    var viewBox = {'x' : 0, 'y' : 0, 'w' : 700, 'h' : 300};

    var tarAlpha = 0.2

    const wheelScale = 0.9;

    knowledgeGraphSVG = d3.select("#knowledgeGraph"),
        width = viewBox['w'],
        height = viewBox['h'];

    knowledgeGraphSVG.attr('viewBox', viewBox['x']+ ' ' + viewBox['y'] + ' ' + viewBox['w'] + ' ' + viewBox['h']);

    function updateFromViewBox(){
        //knowledgeGraphSVG.selectAll('.links line').attr('stroke-width', 2 * viewBox['w'] / viewBoxInitW);
        //knowledgeGraphSVG.selectAll('.nodes circle').attr("r", 5 * viewBox['w'] / viewBoxInitW);
        knowledgeGraphSVG.attr('viewBox', viewBox['x']+ ' ' + viewBox['y'] + ' ' + viewBox['w'] + ' ' + viewBox['h']);
    }

    var draggingLastPos;
    $('#knowledgeGraph').bind('mousewheel', function(e){
        e.preventDefault();
        var thisScale = 1;
        if(e.originalEvent.wheelDelta /120 > 0) {
            thisScale = wheelScale;
            console.log('scrolling up !');
        }
        else{
            thisScale = 1 / wheelScale;
            console.log('scrolling down !');
        }
        screenSize = {'x' : $('#knowledgeGraph').width(), 'y' : $('#knowledgeGraph').height()};
        var xc = e.offsetX * viewBox['w']/screenSize['x'] + viewBox['x'];
        var yc = e.offsetY * viewBox['h']/screenSize['y'] + viewBox['y'];
        viewBox['x'] = thisScale * viewBox['x'] + (1 - thisScale) * xc;
        viewBox['y'] = thisScale * viewBox['y'] + (1 - thisScale) * yc;
        viewBox['w'] = viewBox['w'] * thisScale;
        viewBox['h'] = viewBox['h'] * thisScale;
        updateFromViewBox();
    }).bind('mousedown', function(e){
        e.preventDefault();
        draggingLastPos = [
            e.offsetX * viewBox['w']/$('#knowledgeGraph').width() + viewBox['x'],
            e.offsetY * viewBox['h']/$('#knowledgeGraph').height()+ viewBox['y']
        ];
        $(this).mousemove(function(e){
            e.preventDefault();
            var draggingThisPos = [
                e.offsetX * viewBox['w']/$('#knowledgeGraph').width() + viewBox['x'],
                e.offsetY * viewBox['h']/$('#knowledgeGraph').height()+ viewBox['y']
            ];
            viewBox['x'] = draggingLastPos[0] - draggingThisPos[0] + viewBox['x'];
            viewBox['y'] = draggingLastPos[1] - draggingThisPos[1] + viewBox['y'];
            updateFromViewBox();
            draggingLastPos = draggingThisPos;
        }).mouseup(function(){
            e.preventDefault();
            $(this).unbind('mouseup').unbind('mousemove');
        })
    }).on( "dblclick", function(){
        viewBox = {'x' : 0, 'y' : 0, 'w' : 700, 'h' : 300};
        updateFromViewBox();
    });

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    updateGraph = function() {
        graphLinkData = [];
        graphNodeData = {};
        nodeDegrees = {};
        for(tupleInd in filterOutput){
            tuple = filterOutput[tupleInd];
            graphLinkData.push({
                "source": tuple[0],
                "target": tuple[1],
                "value": extracted_data[tuple[0] + ' ' + tuple[1]]['p']
            })
            if(tuple[0] in nodeDegrees){
                nodeDegrees[tuple[0]] += 1;
            }else
                nodeDegrees[tuple[0]] = 1;
            if(tuple[1] in nodeDegrees){
                nodeDegrees[tuple[1]] += 1;
            }else
                nodeDegrees[tuple[1]] = 1;
            graphNodeData[tuple[0]] = {'id': tuple[0], 'group': 1};
            graphNodeData[tuple[1]] = {'id': tuple[1], 'group': 1};
        }
        for(dataItem in graphNodeData){
            graphNodeData[dataItem]['group'] =
                nodeDegrees[dataItem];
        }
        graphNodeData = Object.values(graphNodeData);

        knowledgeGraphSVG.selectAll('g').remove();
        var link = knowledgeGraphSVG.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graphLinkData)
            .enter().append("line")
            .attr('stroke', function(d){
                return relationColorScale(d['value'] / relation_data.length);
            })
            .attr('stroke-width', 2)
            .on('mouseover', function (d) {
                tooltip
                    .html(function () {
                        var relation = extracted_data[d["source"]['id'] + ' ' + d['target']['id']];
                        var relationName = relation_data[relation['p']];
                        var relationAccu = relation['a']
                        var displayinfo = "<span style='color:#d9e778'>" + "<strong>" + relationName + "</strong><br>";

                        displayinfo += "<strong>" + d["source"]['id'] + "</strong><br>";
                        displayinfo += "<strong>" + d["target"]['id'] + "</strong><br>";
                        displayinfo += "<strong>" + "Accuracy : " + relationAccu + "</strong>";
                        displayinfo += "</span>";
                        return displayinfo;
                    })
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("visibility", "visible");
            })
            .on('mouseout', function () {
                if (!(tooltip.style("visibility") === "visible")) {
                    return;
                }
                tooltip.style("visibility", "hidden");
            })
            .on('click', function(d){
                selectedTuple = [d["source"]['id'],d["target"]['id']]
                updateAttentionView();
                chooseAttentionDropdown();
            });

        var node = knowledgeGraphSVG.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graphNodeData)
            .enter().append("circle")
            .attr("r", 5)
            .attr("fill", function (d) {
                return d3.interpolateOrRd(Math.tanh(d.group) / 2);
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on('mouseover', function (d) {
                tooltip
                    .html(function () {
                        var entityName = d['id'];
                        var displayinfo = "<span style='color:#13008b'><strong>" + entityName + "</strong></span>";
                        return displayinfo;
                    })
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("visibility", "visible");
            })
            .on('mouseout', function () {
                if (!(tooltip.style("visibility") === "visible")) {
                    return;
                }
                tooltip.style("visibility", "hidden");
            });


/*
        node.append("title")
            .text(function (d) {
                return d.id;
            });
*/
        simulation
            .nodes(graphNodeData)
            .on("tick", ticked);

        simulation.force("link")
            .links(graphLinkData);

        simulation = simulation.alphaTarget(tarAlpha).restart();

        function ticked() {
            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(tarAlpha).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }
}

var chooseGraph = function(){
    // todo
    return;
}