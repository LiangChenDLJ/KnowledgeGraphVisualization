var allEntities = {};
var filteredEntities = {'selected' : {}, 'unselected' : {}};
var filteredRelations = {};

// [[entity1-1, entity1-2], [entity2-1, entity2-2], ...]
var filterOutput = [];
var selectedTuple = [];

// [{relationInd:123, tuples:['abc def', ...]}, ...]
var relationSta = [];

var recPreSta = [];

var entityDegreeFilter = function(){
    var fromVal = $('#entityDegreeFilterFromInput').find('input').val();
    var toVal = $('#entityDegreeFilterToInput').find('input').val();
    if(fromVal.match('[0-9]+')!= null) fromVal = parseInt(fromVal);
    else fromVal = Number.MIN_VALUE;
    if(toVal.match('[0-9]+')!= null) toVal = parseInt(toVal);
    else toVal = Number.MAX_VALUE;

    for(entity1 in filteredEntities['selected']){
        degree = Object.keys(allEntities[entity1]).length;
        if(!(degree >= fromVal && degree < toVal)){
            filteredEntities['unselected'][entity1] = filteredEntities['selected'][entity1];
            delete filteredEntities['selected'][entity1];
        }
    }
    for(entity1 in filteredEntities['unselected']){
        degree = Object.keys(allEntities[entity1]).length;
        if(degree >= fromVal && degree < toVal){
            filteredEntities['selected'][entity1] = {'selected' :{}, 'unselected' : {}};
            for(entity2 in allEntities[entity1]){
                filteredEntities['selected'][entity1]['selected'][entity2] = allEntities[entity1][entity2];
            }
            delete filteredEntities['unselected'][entity1];
        }
    }
    chooseEntityList();
}

var chooseEntityList = function(){
    d3.selectAll('#entityList .ui.checkbox').each(function(d){
        if(d['entity'] in filteredEntities['selected']){
            $(this).checkbox('set checked');
        }else{
            $(this).checkbox('set unchecked');
        }
    });
    updateRelatedList();
}

var initializeEntityFilter = function(){
    $('#graphTabMenu .item').tab();
    $('#nameFilterItem').tab({'onVisible':function(){
            //filterOutputFromName();
        }});
    $('#relationFilterItem').tab({'onVisible':function(){
            //filterOutputFromRelation();
        }});

    //relation Statistic
    // recall&Precision Statistic
    relationSta = [];
    recPreSta = [];
    for(ind in relation_data){
        relationSta.push({relationInd:ind, tuples:[]});
        recPreSta.push({trueNum : 0, truePosNum : 0, posNum : 0});
    }
    for(pair in extracted_data){
        var relationInd = extracted_data[pair]['p'];
        var relationTrueId = extracted_data[pair]['t'];
        recPreSta[relationInd]['posNum'] += 1;
        recPreSta[relationTrueId]['trueNum'] += 1;
        if(relationInd == relationTrueId) recPreSta[relationTrueId]['truePosNum'] += 1;
        relationSta[relationInd]['tuples'].push(pair);
    }
    for(relInd in recPreSta){
        recPreSta[relInd]['precision'] = recPreSta[relInd]['truePosNum']/recPreSta[relInd]['posNum'];
        recPreSta[relInd]['recall'] = recPreSta[relInd]['truePosNum']/recPreSta[relInd]['trueNum'];
    }

    for(entities_pair in extracted_data){
        entities_tuple = entities_pair.split(' ');
        if(entities_tuple[0] in allEntities === false) allEntities[entities_tuple[0]] = {};
        if(entities_tuple[1] in allEntities === false) allEntities[entities_tuple[1]] = {};
        allEntities[entities_tuple[0]][entities_tuple[1]] = 'r';
        allEntities[entities_tuple[1]][entities_tuple[0]] = 'l';
    }
    for(entity in allEntities){
        filteredEntities['unselected'][entity] = {'selected' :{}, 'unselected' : {}};
        for(entity2 in allEntities[entity]){
            filteredEntities['unselected'][entity]['unselected'][entity2] = allEntities[entity][entity2];
        }
    }
    $('#entityNameFilterInput').on('keypress', function(event) {
        if ( event.which == 13 ) {
            event.preventDefault();
            filteredEntities['selected'] = {};
            filteredEntities['unselected'] = {};
            for(entity in allEntities){
                if(entity.indexOf(($(this).find('input').val())) != -1){
                    filteredEntities['unselected'][entity] = {'selected' :{}, 'unselected' : {}};
                    for(entity2 in allEntities[entity]){
                        filteredEntities['unselected'][entity]['unselected'][entity2] = allEntities[entity][entity2];
                    }
                }
            }
            updateEntityList();
        }
    });
    $('#selectAllEntityButton').click(function(){
        $('#entityList .ui.checkbox').checkbox('set checked');
        filteredEntities['selected'] = Object.assign(
            filteredEntities['selected'],
            filteredEntities['unselected']
        );
        filteredEntities['unselected'] = {};
        for(entity1 in filteredEntities['selected']){
            filteredEntities['selected'][entity1]['selected'] = Object.assign(
                filteredEntities['selected'][entity1]['selected'],
                filteredEntities['selected'][entity1]['unselected']
            );
            filteredEntities['selected'][entity1]['unselected'] = {};
        }
        updateRelatedList();
    });
    $('#selectNoneEntityButton').click(function(){
        $('#entityList .ui.checkbox').checkbox('set unchecked');
        filteredEntities['unselected'] = Object.assign(
            filteredEntities['unselected'],
            filteredEntities['selected']
        );
        filteredEntities['selected'] = {};
        updateRelatedList();
    });
    $('#selectAllRelatedButton').click(function(){
        for(entity1 in filteredEntities['selected']){
            filteredEntities['selected'][entity1]['selected'] = Object.assign(
                filteredEntities['selected'][entity1]['selected'],
                filteredEntities['selected'][entity1]['unselected']
            );
            filteredEntities['selected'][entity1]['unselected'] = {};
        }
        updateRelatedList();
    });
    $('#selectNoneRelatedButton').click(function(){
        for(entity1 in filteredEntities['selected']){
            filteredEntities['selected'][entity1]['unselected'] = Object.assign(
                filteredEntities['selected'][entity1]['unselected'],
                filteredEntities['selected'][entity1]['selected']
            );
            filteredEntities['selected'][entity1]['selected'] = {};
        }
        updateRelatedList();
    });
    $('#seedExpanderInput').on('keypress', function(event){
        if ( event.which == 13 ) {
            event.preventDefault();
            levelNum = $(this).find('input').val();
            if(levelNum.match('[1-9]')){
                newFilteredEntities = {selected:{}, unselected:{}};
                for(entity1 in filteredEntities['selected']){
                    newFilteredEntities['selected'][entity1] = {'selected':{}, 'unselected':{}};
                    for(entity2 in allEntities[entity1]){
                        newFilteredEntities['selected'][entity1]['selected'][entity2] = allEntities[entity1][entity2];
                    }
                }
                for(level = 1; level < parseInt(levelNum); level++){
                    for(entity1 in newFilteredEntities['selected']){
                        for (entity2 in allEntities[entity1]){
                            if(entity2 in newFilteredEntities['selected']) continue;
                            newFilteredEntities['selected'][entity2] = {'selected':{}, 'unselected':{}};
                            for(entity22 in allEntities[entity2]){
                                newFilteredEntities['selected'][entity2]['selected'][entity22] = allEntities[entity2][entity22];
                            }
                        }
                    }
                }
                filteredEntities = newFilteredEntities;
                updateEntityList();
            }
        }
    })
    $('#entityDegreeFilterFromInput').on('keypress', function(event){
        if ( event.which == 13 ) {
            entityDegreeFilter();
        }
    });
    $('#entityDegreeFilterToInput').on('keypress', function(event){
        if ( event.which == 13 ) {
            entityDegreeFilter();
        }
    });
    updateRelationList()
    updateEntityList();
}

var updateRelationList = function(){

    d3.select('#relationTable tbody').selectAll('tr').remove();

    relationListData = relationSta.filter(function(d){
        return d['relationInd'] > 0 && recPreSta[d['relationInd']]['posNum'] > 0;
    });

    var relationTableRow = d3.select('#relationTable tbody')
        .selectAll('tr')
        .data(relationListData)
        .enter()
        .append('tr')
        .style('color', function(d){return relationColorScale(d['relationInd'] / relation_data.length)});

    relationTableRow.append('td').text(function(d) {return relation_data[d['relationInd']]});
    relationTableRow.append('td').text(function(d) {return recPreSta[d['relationInd']]['posNum']});
    relationTableRow.append('td').text(function(d) {return recPreSta[d['relationInd']]['precision']});
    relationTableRow.append('td').text(function(d) {return recPreSta[d['relationInd']]['recall']});

    relationTableRow.on('click', function(d){
        var id = d3.select(this).data()[0]['relationInd'];
        if(d3.select(this).classed('active')){
            d3.select(this).classed('active', false);
            delete filteredRelations[id];
        }else{
            d3.select(this).classed('active', true);
            filteredRelations[id] = true;
        }
        filterOutputFromRelation();
    });

    $('#relationTable').tablesort();}


var updateEntityList = function(){
    d3.select('#entityList')
        .selectAll('div')
        .remove();
    var entitiesListData = [];
    for(entity in filteredEntities['selected']){
        entitiesListData.push({'entity':entity, 'related':filteredEntities['selected'][entity]});
    }
    for(entity in filteredEntities['unselected']){
        entitiesListData.push({'entity':entity, 'related':filteredEntities['unselected'][entity]});
    }
    entitiesListData.sort(function(a,b){
        return a['entity'] > b['entity'] ? 1 : -1 ;
    });
    // add cluster boxes
    var entityBox = d3.select('#entityList')
        .selectAll('div')
        .data(entitiesListData)
        .enter()
        .append('div')
        .attr('class', "ui checkbox fillWidth");
    entityBox.append('input')
        .attr('type', 'checkbox')
        .attr('name', function(d) {
            return d['entity'];
        })
        .attr('class', 'hidden');
    entityBox.append('label')
        .attr('class', 'nowrap')
        .text(function(d) {
            return d['entity'];
        });
    $('#entityList .ui.checkbox').checkbox({
        onChecked: function() {
            var entity = d3.select(this).data()[0]['entity'];
            if(filteredEntities['unselected'][entity] === undefined) return;
            filteredEntities['selected'][entity] = filteredEntities['unselected'][entity];
            delete filteredEntities['unselected'][entity];
            filteredEntities['selected'][entity]['selected'] = Object.assign(
                filteredEntities['selected'][entity]['selected'],
                filteredEntities['selected'][entity]['unselected']
            );
            filteredEntities['selected'][entity]['unselected'] = {};
            updateRelatedList();
        },
        onUnchecked: function() {
            var entity = d3.select(this).data()[0]['entity'];
            if(filteredEntities['selected'][entity] === undefined) return;
            filteredEntities['unselected'][entity] = filteredEntities['selected'][entity];
            delete filteredEntities['selected'][entity];
            updateRelatedList();
        }
    });
    chooseEntityList();

}

var updateRelatedList = function(){
    var relatedListData = [];
    for(entity in filteredEntities['selected']) {
        relatedListData.push({'entity': entity, 'related': filteredEntities['selected'][entity]});
    }
    relatedListData.sort(function(a,b){
        return a['entity'] > b['entity'] ? 1 : -1 ;
    });
    // initial relatedList
    d3.select("#relatedList")
        .selectAll('div')
        .remove();
    var relatedGroups = d3.select("#relatedList")
        .selectAll('div')
        .data(relatedListData)
        .enter()
        .append('div')
        .classed("entityGroup", true)
        .attr('entity', function(d) {
            return d['entity'];
        });
    relatedGroups.append('label')
        .attr('class', 'nowrap')
        .text(function(d) {
            degree = Object.keys(d['related']['selected']).length + Object.keys(d['related']['unselected']).length;
            return d['entity'] + '(' + degree + ')';
        });
    relatedGroups.each(function(d){
        var relatedEntitiesData = [];
        for(relatedEntity in d['related']['selected']){
            relatedEntitiesData.push({'entity':relatedEntity, 'pos':d['related']['selected'][relatedEntity], 'initialChecked':true});
        }
        for(relatedEntity in d['related']['unselected']){
            relatedEntitiesData.push({'entity':relatedEntity, 'pos':d['related']['unselected'][relatedEntity], 'initialChecked':false});
        }
        relatedEntitiesData.sort(function(a,b){
            return a['entity'] > b['entity'] ? 1 : -1 ;
        });
        var relatedBox = d3.select(this)
            .selectAll('div')
            .data(relatedEntitiesData)
            .enter()
            .append('div')
            .attr('class', 'ui checkbox fillWidth');

        relatedBox.append('input')
            .attr('type', 'checkbox')
            .attr('groupname', d['entity'])
            .attr('pos', function(d) {
                return d['pos'];
            })
            .attr('name', function(d) {
                return d['entity'];
            });
        relatedBox.append('label')
            .attr('class', 'nowrap')
            .text(function(d) {
                return d['entity'];
            });
        var checkedRelatedBox = relatedBox.select(function(d){
            if(d['initialChecked']) return this;
        }).each(function(d){
            $(this).checkbox('set checked');
        })
    });


    $('#relatedList .ui.checkbox').checkbox({
            onChecked: function() {
                var entity1 = $(this).attr('groupname');
                var entity2 = $(this).attr('name');
                if(filteredEntities['selected'][entity1] === undefined ||
                    filteredEntities['selected'][entity1]['unselected'][entity2] === undefined
                ) return;
                filteredEntities['selected'][entity1]['selected'][entity2] = filteredEntities['selected'][entity1]['unselected'][entity2]
                delete filteredEntities['selected'][entity1]['unselected'][entity2];
                if(entity2 in filteredEntities['selected']){
                    filteredEntities['selected'][entity2]['selected'][entity1] = filteredEntities['selected'][entity2]['unselected'][entity1]
                    delete filteredEntities['selected'][entity2]['unselected'][entity1];
                    var cb = $('#relatedList .ui.checkbox input[groupname=\''+ entity2 +'\'][name=\''+ entity1 +'\']').parent();
                    cb.checkbox('set checked');
                }
                filterOutputFromName();
            },
            onUnchecked: function() {
                var entity1 = $(this).attr('groupname');
                var entity2 = $(this).attr('name');
                if(filteredEntities['selected'][entity1] === undefined ||
                    filteredEntities['selected'][entity1]['selected'][entity2] === undefined
                ) return;
                filteredEntities['selected'][entity1]['unselected'][entity2] = filteredEntities['selected'][entity1]['selected'][entity2]
                delete filteredEntities['selected'][entity1]['selected'][entity2];
                if(entity2 in filteredEntities['selected']){
                    filteredEntities['selected'][entity2]['unselected'][entity1] = filteredEntities['selected'][entity2]['selected'][entity1]
                    delete filteredEntities['selected'][entity2]['selected'][entity1];
                    var cb = $('#relatedList .ui.checkbox input[groupname=\''+ entity2 +'\'][name=\''+ entity1 +'\']').parent();
                    cb.checkbox("set unchecked");
                }
                filterOutputFromName();
            }
    });
    filterOutputFromName();
}

var filterOutputFromName = function(){
    filterOutput = [];
    for (var entity1 in filteredEntities['selected']) {
        for (var entity2 in filteredEntities['selected'][entity1]['selected']) {
            if (!(entity2 in filteredEntities['selected']) || filteredEntities['selected'][entity1]['selected'][entity2] == 'r') {
                filterOutput.push(
                    filteredEntities['selected'][entity1]['selected'][entity2] == 'r' ?
                        [entity1, entity2] :
                        [entity2, entity1]
                );
            }
        }
    }
    updateFromFilter();
}

var filterOutputFromRelation = function(){
    filterOutput = [];
    for(relationInd in filteredRelations){
        for(tupleInd in relationSta[relationInd]['tuples']){
            tuple = relationSta[relationInd]['tuples'][tupleInd];
            filterOutput.push(tuple.split(' '));
        }
    }
    updateFromFilter();
}

var updateFromFilter = function(){
    selectedTuple = [];
    updateChartsPanel();
    updateAttentionView();
    updateAttentionDropdown();
    updateWordCloud();
    updateGraph();
}