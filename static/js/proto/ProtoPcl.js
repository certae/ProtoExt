/*
 *  Proto Code Library    ( PCL )
 *
 *  Edicion de la plc
 *  Esta forma sera invocada desde la pcl o desde el respositorio de pcls ( ProtoLib.ProtoDefinition )
 *    Por lo tanto la Pcl ya viene dada,
 *
 */

/*jslint nomen: true, sloppy : true, white : true, sub : true */
/*global Ext */
/*global _SM */


Ext.define('ProtoUL.proto.ProtoPcl' ,{
    extend: 'Ext.panel.Panel',
    alias : 'widget.protoPcl',
    /*
     * @Required
     * myMeta  : Metadata
     */
    myMeta : null,
    myFieldDict : null,

    /*
     * editable : False is ReadOnly
     */
    editable : true,


    initComponent: function() {

        var me = this;
        if ( ! this.myMeta  ) {
            _SM.__StBar.showError( 'not loaded???', 'protoPcl.init' );
            return;
        }

        this.myFieldDict = _SM.getFieldDict( this.myMeta )

        _SM.defineProtoPclTreeModel();

        var tBar =  Ext.create('ProtoUL.proto.ProtoToolBar', {dock : 'top'});
        var sbar = Ext.create('Ext.form.Label', { text: _SM.__language.ProtoPcl_Edition_Tool });

        var treeData = getTreeData( me );

        var treeGridStore = Ext.create('Ext.data.TreeStore', {
            model: 'Proto.PclTreeNode',
            root: treeData
        });

        this.treeGridStore = treeGridStore;

        var treeGrid = Ext.create('Ext.tree.Panel', {
            store: treeGridStore,
            sortableColumns : false,
            useArrows: true,
            rootVisible: true,
            multiSelect: false,
            singleExpand: true,
            stripeRows: true,
            rowLines : true,

            columns: [{
                xtype: 'treecolumn', //this is so we know which column will show the tree
                text: 'text',
                flex: 3,
                dataIndex: 'text'
            // },{
                // text: 'Ix',
                // dataIndex: 'id'
            },{
                text: '__ptType',
                dataIndex: '__ptType'
            }],
            listeners: {
                'itemmouseenter': function(view, record, item) {
                    Ext.fly(item).set({'data-qtip': getAttrMsg( record.data.text ), 'data-qtitle': record.data.text });
              }, scope : me
            }

        });

        this.treeGrid = treeGrid ;


        var propsGrid = Ext.create('ProtoUL.ux.ProtoProperty', {
            source : { name : '' } 
        });
        var fieldList = Ext.create('ProtoUL.ux.ProtoList', {
            idTitle: 'SelectedFields'
        });

        var jsonText = Ext.create('Ext.form.TextArea', {
            autoScroll : true,
            labelAlign : 'top'
        });

//  ================================================================================================

        var panelItems =   [{
                region: 'center',
                flex: 3,
                layout: 'fit',
                minSize: 50,
                items: treeGrid,
                border: false
            }, {
                region: 'east',
                collapsible: false,
                split: true,
                flex: 2,
                layout: 'fit',
                minSize: 200,
                items : [propsGrid, fieldList, jsonText],
                border: false
        }];


        Ext.apply(this, {
            layout: 'border',
            items: panelItems,
            dockedItems: [ tBar ],
            bbar: [ sbar ]
        });


        this.callParent(arguments);

        fieldList.hide()
        jsonText.hide()

// ----------------------------------------------------------------------------------------------

        tBar.on({
            'preview': function ( ) {
                me.myMeta  =  Tree2Meta( me.treeGridStore.getRootNode() )
                _SM.savePclCache( me.myMeta.viewCode, me.myMeta, true )
            },
            'save': function ( ) {

                var myCustom =  Tree2Meta( me.treeGridStore.getRootNode() )
                if ( me.custom ) {
                    if ( me.metaConfig ) {
                        // Si escribe sobre la meta copia el list|Display para hacerlo mas facil
                        me.myMeta.gridConfig.listDisplay = myCustom.listDisplay;
                        delete myCustom.listDisplay;
                        me.myMeta.gridSets = myCustom;

                    }   else {
                        // Aqui solmanete  manejara el custom
                        me.myMeta.custom = myCustom

                    }

                }   else {
                    // Pcl completa ( forza el metaConfig y reconstruye fields )
                    myCustom.fields = myCustom.fieldsBase.concat( myCustom.fieldsAdm )

                    me.metaConfig = true
                    me.myMeta = myCustom
                }

                me.myMeta.metaVersion = _versionMeta
                _SM.savePclCache( me.myMeta.viewCode, me.myMeta, true )

                if ( me.metaConfig ) {  // La meta modificada
                    _SM.savePci( me.myMeta )
                } else {
                    // Solo el custom, empaqueta el objeto para poder agregarle info de control
                    myCustom = {
                        viewCode : '_custom.' + me.myMeta.viewCode,
                        metaVersion : _versionMeta,
                        custom   : myCustom
                    }
                    _SM.savePci( myCustom )
                }

            },
            'reload': function ( ) {

            },
            'cancel': function (  ) {
                me.cancelChanges()
            },
            'show1': function (  ) {
                _SM.showConfig( 'Meta' , me.myMeta  )
            },
            'add': function ( record ) {
                addTreeNode ( record )
            },
            'del': function ( record ) {
                delTreeNode ( record )
            },
            scope : this
        })

        treeGrid.on({
            'select': function ( rowModel , record,  rowIndex,  eOpts ) {

                saveJsonText()
                saveFieldList()

                me.treeRecord  = record;
                preparePropertiesPCL( record );
            }, scope: me }
        );


        propsGrid.on({
            'beforeedit': {fn: function ( editor, e, eOpts) {
                if ( me.editable == false ) return false
            }},

            // Fires after a editing. ...
            'edit': {fn: function ( editor, e, eOpts) {
                if ( e.value == e.originalValue ) return;

                var oData = me.treeRecord.data.__ptConfig
                var prpName = e.record.data.name

                // ****  Solo llegan objetos, los Array deben tener un __ptConfig aidcional
                if ( _SM.typeOf(oData) !=  "object") {

                    if ( ! oData.__ptConfig ) oData.__ptConfig = {}
                    oData.__ptConfig[ prpName ]  = e.value

                } else {

                    // Asigna el valor a la propiedad
                    oData[ prpName ]  = e.value
                }
            }},
            scope: me }
        );


        fieldList.on({
            'checked' : {fn: function ( record, recordIndex, checked ) {
                saveFieldList()
            }},
            'reorder' : {fn: function () {
                saveFieldList()
            }},
            scope: me }
        );

// ----------------------------------------------------------------------------------------------

        function getTreeData( me ) {

            var treeData = {}

            if ( me.custom ) {
                if ( me.metaConfig ) {
                // Si escribe sobre la meta copia el list|Display para hacerlo mas facil
                    var myCustom = { listDisplay : me.myMeta.gridConfig.listDisplay }
                    myCustom = Ext.apply( myCustom, me.myMeta.gridSets )
                    treeData = Meta2Tree( myCustom, 'custom', 'custom' );
                }   else {
                // Aqui solmanete  manejara el custom
                    treeData = Meta2Tree( me.myMeta.custom, 'custom', 'custom' );
                }
            }   else {

                // Prepara la PCL
                // delete me.myMeta.fields
                var tmpMeta = _SM.clone( me.myMeta, 0, ['fields'] )
                tmpMeta.fieldsBase =  tmpMeta.fieldsBase.sort( _SM.sortObjByName )
                tmpMeta.fieldsAdm =  tmpMeta.fieldsAdm.sort( _SM.sortObjByName )

                treeData = Meta2Tree( tmpMeta, 'pcl', 'pcl' );
                for (var ix in treeData.children ) {
                    var vFld  =  treeData.children[ix]
                    if ( vFld.text == 'fields' ) {
                        treeData.children.splice(ix, 1);
                        break;
                    }
                }
            }

            treeData.expanded = true;

            // Para guardar las dos definiciones ( la data se modifica al generar el store )
            me.treeData = _SM.clone( treeData );

            return treeData
        }


        function addTreeNode ( record ) {

            // verifica el tipo de datos
            var ptType = record.data.__ptType
            if ( ! ptType ) return;

            // Carga el __ptConfig es el obj de referencia q viaja
            var __ptConfig = record.data.__ptConfig || {}


            // Obtiene la definicion del nodo hijo
            var nodeDef =  _MetaObjects[ ptType ]
            var childDef = _MetaObjects[ nodeDef.listOf ] || {}

            // Pregunta el nombre del nuevo nodo
            var pName = _SM.ptPrompt ( nodeDef.listOf, childDef.addPrompt  )
            if ( ! pName ) return;

            // Propiedad q llevara el nombre del nodo
            var nodeName = childDef.nodeName || 'name'

            // Crea el nodo base
            var tNode = getNodeBase( pName, nodeDef.listOf, { '__ptType' : nodeDef.listOf } )

            // asigna el nombre del nodo
            tNode.__ptConfig[ nodeName ]   = pName

            if ( childDef.__ptStyle  == 'jsonText' ) {

                var template = childDef.addTemplate.replace( '@name', pName )
                tNode.__ptConfig.__ptValue = template

            } else if ( childDef.__ptStyle  == 'colList' ) {
            } else  {

                // Tipo objeto, debe recrear el objeto pues existen listas y otras
                var newObj = verifyMeta( {}, nodeDef.listOf , tNode )
            }

            record.appendChild( tNode )

        }

        function delTreeNode ( record ) {

            var ptType = record.data.__ptType
            var parent = record.parentNode

            record.remove( )
            resetPanelInterface()

            if ( parent ) {
                var view = me.treeGrid.getView();
                view.select( parent );
            }
        }

// ----------------------------------------------------------------------------------------------


        function getAttrMsg( attrName ) {
            var msg =  _MetaObjects[ attrName ] || {}
            return msg.description || ''
        }

        // jsonText.on({'deactivate': function ( obj ,  eOpts ) {
        function saveJsonText() {
            if ( jsonText.isVisible()) {
                jsonText.__ptConfig.__ptValue  = jsonText.getRawValue()
            }
        }

        function saveFieldList() {
            if ( fieldList.isVisible()) {
                // __ptConfig guarda la ref al obj de base
                fieldList.__ptConfig.__ptList  = Ext.encode( fieldList.getChecked() )
            }
        }


// ----------------------------------------------------------------------------------------------

        function resetPanelInterface() {
            jsonText.hide()
            propsGrid.hide()
            fieldList.hide()
            resetButtons()
        }

        function resetButtons() {
            tBar.setButton( 'add', bVisible = false, true )
            tBar.setButton( 'del', bVisible = false, true )
        }

        function preparePropertiesPCL( record ){

            var oData      = record.data
            var ptType     = oData.__ptType
            var __ptConfig = oData.__ptConfig || {}

    	    var template = _MetaObjects[ ptType ] || {}

            // Status Bar
            var sMsg = getAttrMsg( record.data.text )
            if ( sMsg ) sMsg = '<strong>' + record.data.text + '</strong> : ' +  sMsg
            else  sMsg = '<strong>' + ptType  + '</strong>  [ ' +  record.data.text  + ' ]'
            sbar.setText( sMsg , false )

            // Clear
            resetPanelInterface()

            if ( template.__ptStyle == "jsonText") {
                jsonText.__ptConfig = __ptConfig
                jsonText.setRawValue( __ptConfig.__ptValue )
                jsonText.setFieldLabel( oData.text )
                jsonText.show()

            } else if ( template.__ptStyle == "colList") {
                fieldList.show()
                fieldList.__ptConfig = __ptConfig
                prepareColList( oData )

            } else {
                propsGrid.show()
                prepareProperties( record , me.myMeta,  propsGrid  )
            }

            // Prepara el menu
            var nodeDef = _MetaObjects[ ptType ] || {}
            if ( nodeDef.allowAdd  ) {

                tBar.setButton('add', true, true, _SM.__language.ProtoPcl_Add_Instance + ptType, record)
            }

            if ( nodeDef.allowDel ) {
                tBar.setButton('del', true, true, _SM.__language.ProtoPcl_Del_Current + ptType + ' [' + oData.text + ']', record)

            }

        };



        var fList
        function prepareColList( oData ) {

            if ( ! fList )  {
                // Crea los campos del store
                fList= []
                for (var ix in me.myMeta.fieldsBase ) {
                    var vFld  =  me.myMeta.fieldsBase[ix];
                    fList.push( vFld.name )
                }
            }

            // Copia solo los campos contenidos en fields
            var tmpList = Ext.decode( oData.__ptConfig.__ptList  )
            var fSelected = []
            for (var ix in tmpList  ) {
                var vFld  =  tmpList[ix];
                if ( me.myFieldDict[vFld] ) {
                   fSelected.push( vFld )
                }
            }


            fieldList.removeAll()
            fieldList.addDataSet( fSelected, true  )
            fieldList.addDataSet( fList )
        }


    },


    cancelChanges: function() {
        //TODO: Verificar si hace un reload
        // this.treeGridStore.getRootNode().removeAll();
        // this.treeGridStore.setRootNode( this.treeData )
    }

});
