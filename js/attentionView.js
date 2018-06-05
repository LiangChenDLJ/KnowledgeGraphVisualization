const dropdownDefaultValue = '';

var initialAttentionView = function(){
    $('#attentionTemTagCheckBox').checkbox({onChange:function(){
        updateTemTag();
    }});
    $('#attentionSpaTagCheckBox').checkbox({onChange:function(){
        updateSpaTag();
    }});
    $('#attentionHighlightCheckBox').checkbox({onChange:function(){
        updateHighLight();
    }});
    $('#attentionViewDropDown').dropdown({
        onChange:function(value){
            updateSelectedTupleFromDropdown();
        },
        fullTextSearch:true,
        match:'text'
    });
    $('#spaTagInput').on('keypress', function(event){
        if ( event.which == 13 ) {
            event.preventDefault();
            if(selectedTuple.length == 0) return;
            factName = selectedTuple[0] + ' ' + selectedTuple[1];
            var spaTag = $(this).find('input').val();
            spaTemEdit[factName]['spa'] = spaTag;
        }
    });
    $('#temTagInput').on('keypress', function(event){
        if ( event.which == 13 ) {
            event.preventDefault();
            if(selectedTuple.length == 0) return;
            factName = selectedTuple[0] + ' ' + selectedTuple[1];
            var temTag = $(this).find('input').val();
            spaTemEdit[factName]['tem'] = temTag;
        }
    });

}

var updateSelectedTupleFromDropdown = function(){
    value = $('#attentionViewDropDown').dropdown('get value');
    selectedTuple = ((value == null || value == dropdownDefaultValue) ? [] : value.split(' '));
    updateAttentionView();
    chooseGraph();
}

var chooseAttentionDropdown = function(){
    $('#attentionViewDropDown').dropdown('set selected', selectedTuple.length == 0 ? dropdownDefaultValue : selectedTuple[0] + ' ' + selectedTuple[1]);
}

var updateAttentionDropdown = function(){
    var triples = [];
    for(tupleInd in filterOutput){
        tuple = filterOutput[tupleInd];
        tupleText = tuple[0] + ' ' + tuple[1];
        triples.push([tupleText, extracted_data[tupleText]['p']]);
    }
    triples.sort(function(a,b){
        return a[0] > b[0] ? 1 : -1 ;
    });
    d3.select('#attentionViewDropDown').selectAll('option').remove();
    options =d3.select('#attentionViewDropDown').selectAll('option').data(triples).enter().append('option')
        .attr('value',function(d){
            return d[0];
        });
    options.append('span').text(function(d){
            return '(' + d[0] + ')';
        });
    options.append('br');
    options.append('span').text(function(d){
        return relation_data[d[1]];
    });
    updateSelectedTupleFromDropdown();
}

var updateAttentionView = function(){
    d3.select('#accuracyDisplay').text('');
    d3.select('#attentionViewSentences').selectAll('div').remove();
    if(selectedTuple.length == 0) return;
    var entityTuple = selectedTuple;
    var relationInstance = extracted_data[entityTuple[0] + ' ' + entityTuple[1]];
    var sentences = relationInstance['o'];
    var sentenceAttention = relationInstance['s'];
    var wordAttention = relationInstance['w'];
    d3.select('#accuracyDisplay').text(
        'Accuracy : ' + relationInstance['a']
    );

    tagInfo = spaTemEdit[entityTuple[0] + ' ' + entityTuple[1]];
    $('#spaTagInput').find('input').val(tagInfo['spa']);
    $('#temTagInput').find('input').val(tagInfo['tem']);

    var displayData = []
    for(ind in sentences){
        var sentenceWord = [];
        for(word_ind in sentences[ind]){
            sentenceWord.push({text:sentences[ind][word_ind], attention:wordAttention[ind][word_ind], spaTag:[], temTag:[]});
        }
        var sentenceText = sentences[ind].reduce(function(a,b){
            return a.length > 0 ? a + ' ' + b : a + b;
        }, '')
        stTags = st_tags[sentenceText];
        for(tagText in stTags){
            tagType = stTags[tagText]['tagType'];
            newTag = {tagType:tagType, text:tagText};
            if(tagType === 'DATE' || tagType === 'TIME' || tagType === 'DURATION'){
                for(indInd in stTags[tagText]['ind']){
                    sentenceWord[stTags[tagText]['ind'][indInd]]['temTag'].push(newTag);
                }

            }else if(tagType === 'LOCATION' || tagType === 'COUNTRY'){
                for(indInd in stTags[tagText]['ind']) {
                    sentenceWord[stTags[tagText]['ind'][indInd]]['spaTag'].push(newTag);
                }
            }
        }
        displayData.push({word:sentenceWord, attention:sentenceAttention[ind]});
    }
    displayData.sort(function(a,b){
        return a['attention'] < b['attention'] ? 1 : -1 ;
    });
    var attentionSentences = d3.select('#attentionViewSentences')
        .selectAll('div').data(displayData).enter()
        .append('div').attr('class', 'attentionSentence');
    var attentionSentenceBar = attentionSentences
        .append('div').attr('class', 'sentenceAttentionValBar')
        .append('svg')
        .attr('height',15)
        .attr('width', '100%')
        .attr('viewbox','0 0 100 20')
        .attr('preserveAspectRation', 'xMinYMin')
    attentionSentenceBar.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', function(d){
            return (d['attention'] * 100).toPrecision(2);
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

        var wordItem = d3.select(this).append('div').attr('class', 'sentenceText')
                .selectAll('div').data(d['word']).enter()
                .append('div').attr('class', 'attentionWord');
        wordItem.append('div').text(function(d){
                return d['text'];
            }).classed('entitypairEntity', function(d){
                return d['text'] === entityTuple[0] || d['text'] === entityTuple[1]
            }).on('mouseover', function (d) {
            tooltip
                .html(function () {
                    var displayinfo = "<span style='color:#d9e778'>" + "<strong>" + d['attention'] + "</strong></span>";
                    return displayinfo;
                })
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 20) + "px")
                .style("visibility", "visible");
            }).on('mouseout', function () {
                if (!(tooltip.style("visibility") === "visible")) {
                    return;
                }
                tooltip.style("visibility", "hidden");
            });
        wordItem.append('div').attr('class', 'attentionTemTag');
        wordItem.append('div').attr('class', 'attentionSpaTag');
    });
    updateHighLight();
    updateTemTag();
    updateSpaTag();
}

function updateTemTag() {
    d3.selectAll('.attentionTemTag').selectAll('div').remove();
    if ($('#attentionTemTagCheckBox').checkbox('is checked')) {
        d3.selectAll('.attentionTemTag').each(function (d) {
            d3.select(this).selectAll('div').data(d['temTag']).enter().append('div')
                .attr('class', 'ui pointing blue basic label')
                .text(function (d) {
                    return d['tagType'] + ' ' + d['text']
                });
        });
    };
}

function updateSpaTag(){
    d3.selectAll('.attentionSpaTag').selectAll('div').remove();
    if ($('#attentionSpaTagCheckBox').checkbox('is checked')) {
        d3.selectAll('.attentionSpaTag').each(function (d) {
            d3.select(this).selectAll('div').data(d['spaTag']).enter().append('div')
                .attr('class', 'ui pointing red basic label')
                .text(function (d) {
                    return d['tagType'] + ' ' + d['text']
                });
        });
    };
}

function updateHighLight(){
    d3.selectAll('.attentionWord').selectAll('div').attr('style', '');
    if ($('#attentionHighlightCheckBox').checkbox('is checked')){
        d3.selectAll('.attentionSentence').each(function(d){
            var p = 0;
            var max = d['word'].reduce(function(a,b){
                return a > b['attention'] ? a : b['attention'];
            }, -1);
            var min = d['word'].reduce(function(a,b){
                return a < b['attention'] ? a : b['attention'];
            }, 1);
            var scaleRange = max - min > 0.000001 ? 0.5 * (1 + 1 / (max - min)) : -1;
            d3.select(this).selectAll('.attentionWord').selectAll('div').attr('style', function(d){
                var res = '';
                var m = min;
                var scale = scaleRange;
                var x = d['attention'];
                var color = d3.interpolateBlues(scale > 0 ? (x-min) * scale : 0.2);
                res += 'background-color:' + color + ';'
                return res;
            });
        })
    }
}