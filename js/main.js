var extracted_data;
var relation_data
var st_tags;
var tooltip;

$(document).ready(function() {
    d3.json("data/relation2id.json").then(function(data){
            relation_data = data;
            d3.json("data/extracted.json").then(function(data) {
                extracted_data = data;
                d3.json("data/STTags.json").then(function(data) {
                    st_tags = data;
                    initializePage();
                });
            });
        });

});

// initialize full webpage
// remove all svg and set all checkbox to unchecked
initializePage = function() {
    var senSta = {};
    for(pair in extracted_data){
        var sentences = extracted_data[pair]['o'];
        for(senInd in sentences){
            var senStr = sentences[senInd].reduce(function(str, word){
                return str + word;
            }, '');
            if(senStr in senSta){
                senSta[senStr]+=1;
            }else{
                senSta[senStr]=1;
            }
        }
    }
    var senArr = []
    for (sen in senSta){
        senArr.push([sen, senSta[sen]]);
    }
    senArr.sort(function(a, b){
        return b[1] - a[1];
    })
    console.log(senArr);

    tooltip = d3.select("body")
        .append("div")
        .attr('class', 'tooltipm')
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");

    initialGraph();
    initializeEntityFilter();
};


