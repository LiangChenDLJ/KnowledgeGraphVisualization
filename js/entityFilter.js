var allEntities = {};
var filteredEntities = {'selected' : {}, 'unselected' : {}};

var initializeEntityFilter = function(){
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
    })
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
    updateEntityList();
}

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
    updateRelatedList();
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
    relatedGroups.append('label').text(function(d) {
            return d['entity'];
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
                updateGraph();
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
                updateGraph();
            }
    });
    updateGraph();
}