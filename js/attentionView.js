var updateAttentionView = function(entityTuple){
    var relationInstance = extracted_data[entityTuple[0] + ' ' + entityTuple[1]];
    var sentences = relationInstance['o'];
    var sentenceAttention = relationInstance['s'];
    var wordAttention = relationInstance['w'];
    var displayData = []
    for(ind in sentences){
        var sentenceWord = [];
        for(word_ind in sentences[ind]){
            sentenceWord.push({text:sentences[ind][word_ind], attention:wordAttention[ind][word_ind]});
        }
        displayData.push({word:sentenceWord, attention:sentenceAttention[ind]});
    }
    d3.select('#attentionViewSentences').selectAll('div').remove();
    var attentionSentences = d3.select('#attentionViewSentences')
        .selectAll('div').data(displayData).enter()
        .append('div').attr('class', 'attentionSentence');
    var attentionSentenceBar = attentionSentences
        .append('div').attr('class', 'sentenceAttentionValBar')
        .append('svg')
        .attr('height',15)
        .attr('width', '100%')
        .attr('viewbox','0 0 100 20')
        .attr('preseveAspectRation', 'xMinYMin')
    attentionSentenceBar.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function(d){
            return parseInt(d['attention'] * 100);
        })
        .attr('height', 15)
        .attr('fill', function(d){
            return d3.interpolatePurples(d['attention'] * 0.6);
        });
    attentionSentenceBar.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .text(function(d){
            return parseInt(d['attention'] * 100).toString() + '%';
        })
/*
    var attentionSentenceBar = attentionSentences
        .append('div').attr('class', 'sentenceAttentionValBar')
        .append('div').attr('class', 'ui small indicating progress')
        .attr('data-value', function(d){
            return parseInt(d['attention'] * 100);
        })
        .attr('data-total', '100');
    attentionSentenceBar
        .append('div').attr('class', 'bar')
        .append('div').attr('class', 'progress')
    attentionSentenceBar.each(function(d){
        $(this).progress({
                duration : 200,
                total    : 200,
                text     : {
                    active: '{value}%'
                }
            })
        ;
    })
*/
    attentionSentences.each(function(d){
        var p = 0;
        var max = d['word'].reduce(function(a,b){
            return a > b['attention'] ? a : b['attention'];
        }, -1);
        var min = d['word'].reduce(function(a,b){
            return a < b['attention'] ? a : b['attention'];
        }, 1);
        var scaleRange = max - min > 0.000001 ? 0.5 * (1 + 1 / (max - min)) : -1;

        d3.select(this).append('div').attr('class', 'sentenceText')
                .selectAll('span').data(d['word']).enter()
                .append('span').attr('class', 'attentionWord')
                .text(function(d){
                    return d['text'];
                }).attr('style', function(d){
                    var res = '';
                    if(d['text'] === entityTuple[0] || d['text'] === entityTuple[1]){
                        res += 'border-width:2px;border-style:solid;border-color:#000;'
                    }
                    var m = min;
                    var scale = scaleRange;
                    var x = d['attention'];
                    var color = d3.interpolateBlues(scale > 0 ? (x-min) * scale : 0.2);
                    res += 'background-color:' + color + ';'
                    return res;
                }).on('mouseover', function (d) {
            tooltip
                .html(function () {
                    var displayinfo = "<span style='color:#d9e778'>" + "<strong>" + d['attention'] + "</strong></span>";
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
        });

}