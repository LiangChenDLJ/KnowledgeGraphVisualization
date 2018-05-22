var updateAttentionView = function(entityTuple){
    var relationInstance = extracted_data[entityTuple[0] + ' ' + entityTuple[1]];
    var sentences = relationInstance['o'];
    d3.select('#attentionView').selectAll('span').selectAll('div').remove();
    d3.select('#attentionView').selectAll('span').selectAll('span').remove();
    var attentionSentences = d3.select('#attentionSentences')
        .selectAll('div').data(sentences).enter()
        .append('div').attr('class', 'attentionSentence');
    var attentionBars = d3.select('#attentionBars').selectAll('div').data(relationInstance['s']).enter()
        .append('div').attr('class', 'ui progress sentenceAttentionValBar')
        .append('div').attr('class', 'bar')
        .append('div').attr('class', 'progress');
    attentionSentences.each(function(d){
            d3.select(this).selectAll('span').data(d).enter()
                .append('span').attr('class', 'attentionWord')
                .text(function(d){
                    return d;
                });
        });

}