/*  ---  FormConfig  
 
    Se llama genericamente forma, y corresponde a un panel que puede ser adosado a una ventana 
    o a un contenedor cualquiera,
 
    La forma se divide en secciones,  las secciones son de un tipo particular correspondiente 
    a los diferentes contenedores,  las secciones por defecto son simplemente fieldset
    
    El el arbol solo se encontraran 
    
        Secciones 
            Secciones 
                ....
                    fieldset  
                        Campos  

    no deberia mezclarse en el diseno campos y secciones dentro del mismo contenedor
    los field set son los contenedores de campos, los demas solo pueden contener otros contenedores    

    renderer: this.formatDate,
 */

Ext.define('ProtoUL.view.FormConfig', {
    extend : 'Ext.form.Panel',
    alias : 'widget.protoform',

    requires : ['Ext.form.field.Text', 'Ext.form.*', 'Ext.data.*', 'Ext.tip.QuickTipManager'],
    
    //@myMeta   Base Definition  
    myMeta : null, 

    //@formConfig  Objeto correspondiente a la forma en la meta ( forma parte de la meta ) 
    formConfig : null, 

    
    //@ Store asociado al registro de entrada linked o independiente
    store : null, 

    //@prFormLayout  :  Componentes de la forma ( Itmems del arbol )   
    prFormLayout : [], 

    // Mantiene el IdMaster para las operaciones maestro detalle  
    idMaster : null,
      
    // Coleccion de campos html definidos en htmlSet
    htmlPanels : {},     
      

    // Defne como manejar  maneja los campos heredados de los zoom 
    zoomReturnDef : null, 


    initComponent : function() {
        this.addEvents('create', 'close', 'hide');

        var me = this; 

        // Recupera la clase para obtener la meta ------------------------------------------
        var myMeta = this.myMeta;
        var _pForm = this;


        this.btSave = Ext.create( 'Ext.Button', {
            iconCls : 'icon-save',
            id : this.idSaveBt,
            text: _SM.__language.Title_Save_Button,
            scope : this,
            handler : this.onSave
        });

        this.stMsg = Ext.create('Ext.toolbar.TextItem');

        Ext.apply(this, {
            frame      : true,
            autoScroll : true,
            
            bodyStyle: 'padding:5px 5px',
            bodyPadding: 10,
            activeRecord : null,
            items : this.prFormLayout,

            dockedItems : [{
                xtype : 'toolbar',
                dock : 'bottom',
                ui : 'footer',
                items : [ this.stMsg, '->',  this.btSave , {
                    iconCls : 'icon-reset',
                    text: _SM.__language.Toolbar_Text_Reset_Button,
                    scope : this,
                    handler : this.onReset
                }]
            }]
            
        });
        
        this.callParent();

        // obtiene la coleccion de panles html para su manipulacion 
        this.getHtmlPanels(); 

        // Obtiene los store de las grillas dependientes
        this.cllStoreDet = getStoreDet( this.items.items  ); 
        
        // Indexa los stores con la info de los detalles copiando la info del detalle  
        for ( var ix in this.cllStoreDet ) {
            var lObj = this.cllStoreDet[ix];
            for ( var ixD in this.myMeta.detailsConfig ) {
                var lDet = this.myMeta.detailsConfig[ ixD ];
                if ( lObj.viewCode == lDet.conceptDetail ) {
                    lObj.detailDefinition = lDet 
                }
            }
        }; 
        
        
        // FIX:  las 2 cols no se marcan bien 
        this.doLayout()

    },
    
    

    showFormConfig: function () {
        _SM.showConfig( 'Form Config' , this.myMeta.formConfig   )
       },

    showLayoutConfig: function () {
        _SM.showConfig( 'LayoutConfig' , this.prFormLayout   )
       },
        
    
    setActiveRecord : function(record) {
        this.activeRecord = record;
        if(record) {
            // this.down('#save').enable();
            this.getForm().loadRecord(record);
            this.linkDetail( record )
            this.loadN2N( record )
            this.updateZoomIds()

            this.updateHtmlPanels( record )
            
        } else {
            // this.down('#save').disable();
            this.getForm().reset();
            this.linkDetail( )

            // Si no se envia registro se resetea 
            this.updateHtmlPanels()

        }

    },

    updateHtmlPanels: function( record ) {
    
        var sHtml 
        for (var ix in this.htmlPanels  ) {
            var obj = this.htmlPanels[ix]
            
            if (record) { sHtml = record.get( ix )
            } else { sHtml = '' }
                
            obj.update( sHtml )
            obj.rawHtml = sHtml
        } 
            
    }, 

    readHtmlPanels: function( record ) {
        for (var ix in this.htmlPanels  ) {
            var obj = this.htmlPanels[ix]
            record.set( ix, obj.rawHtml  )            
        } 
    }, 


    loadN2N: function( record ) {

        var myN2N = this.myFormController.N2Nfields 
        if ( ! myN2N )  return 
        
        for ( var ixV in myN2N ) {
            var lObj = myN2N[ixV];
            var prList = Ext.getCmp( lObj.id )
            if ( ! prList )  { continue } 
            prList.addDataSet( record.get(  lObj.name  ) )
        }


    },

        // Refresca las grillas de detalle 
    linkDetail: function( record ) {
    
        this.idMaster = -1
        
        if ( record && !record.phantom ) {
            this.idMaster = record.get('id' ) ;
        }

        for ( var ixDet in this.cllStoreDet ) {
            var tmpStore = this.cllStoreDet[ixDet];
            var detField = tmpStore.detailDefinition.detailField, myFilter = {} 

            // myFilter[ detField ] = this.idMaster

            var protoFilter = [{ "property" :  detField , "filterStmt" : this.idMaster  }];
            tmpStore.myLoadData( protoFilter, null,  this.idMaster )

        }

    },

    setText : function ( sText ) {
         
         this.stMsg.setText( sText )
         
    }, 
    
    onSave : function() {

        /**
         *      this.activeRecord  es la copia de mi registro, 
         *      
         *      this.getForm().getValues()  Obtiene una copia de los campos presentes en la forma, 
         *          para actualizarlos en el registro se deben recorrer uno a uno,  
         *          es una coleccion estandar

         *      this.getForm().setValues()  permite mostrar valores sobre los campos presentes
         *          si el campo no existe, no hace nada 
         *   
         *      La actualizacion de campos debe hacerse sobre el activeRecord y con setValues, 
         *      de esta forma no hay necesidad de incluir campos ocultos, al momento de guardar la forma 
         *      se traeran los campos visibles  (  getValues  ) y se actualizan uno a uno, sobre activeRecord  
         *      se guarda siempre el activeRecord 
         * 
         *      La actualizacion BackEnd se puede hacer con  submit ( action.submit )
         *      o trabajando directamente con el modelo mediante  updateRecord 
         */


        this.updateZoomIds()

        var form = this.getForm();
        if( ! form.isValid()) {
            this.setText(_SM.__language.Msg_Invalid_Form)
            return;  
        }  

        var active = this.activeRecord
        if(!active) return;


        form.updateRecord( active );
        // this.onReset();


        var me = this; 
        me.readHtmlPanels( active )
       
        // Si es nuevo 
        if ( this.myFormController.newForm ) {
            this.store.add( active ); 
        }
         
        if ( this.store.autoSync != true   ) { 

            this.store.sync({
                success: function(result, request ) {
    
                    var myReponse = result.operations[0].response 
    
                    var myResult = Ext.decode( myReponse.responseText );
                    if( myResult.message ) {
                        _SM.errorMessage(_SM.__language.Msg_Error_Save_Form, myResult.message)
                    } else {
                        me.fireEvent('close', me );
                    }
                },
                failure: function(result, request) {
                    _SM.errorMessage(_SM.__language.Msg_Error_Save_Form, _SM.__language.Msg_Failed_Operation)
                }
            });
        } 

        this.fireEvent('close', this );

    },

    onReset : function() {
        this.setActiveRecord(null);
        this.getForm().reset();
        this.fireEvent('close', this );
    },
        

    updateZoomIds:  function() {

        // La info del zoom permanece en el campo fk, es necesario actualizar el registro 
        // antes de guardarlo, TODO: esto se podria hacer en el zoomReturn ( cpFromField ) para actualzar 
        // otros campos derivados del zoom.  

        var lFields = this.getForm().getFields().items 
       
        // Manejo del retorno del zoom 
        for (var ix in lFields  ) {
            var vFld = lFields[ix]
            if (  vFld.xtype != 'protoZoom' ) continue;
            
             // Actualiza el fkId en el zoom para poder hacer los vinculos 
            this.updateFkId(  vFld,   vFld.fkId ) 
             
                        
            if ( ! vFld.zoomRecord ) continue; 

            // Actualiza el Id con el dato proveniente del zoom 
            this.updateFormField(  vFld.fkId, vFld.zoomRecord.data.id ) 
            
            // Actualiza los valores de retorno 
            // this.updateZoomReturn( vFld  )
        }
       
        
    }, 

/*
    
    updateZoomReturn: function (  zoomFld  ) {

        // verifica si esta definido y lo define a necesidad 
        if ( ! this.zoomReturnDef  ) {

            // mantiene una lista con la definicion de los cpFromField 
            this.zoomReturnDef = []
            
            // Crea la coleccion de campos q deben heredarse 
            for (var ix in this.myMeta.fields ) {
                var vFld = this.myMeta.fields[ix] 
                if ( ! vFld.cpFromZoom ) continue;
                
                var cpFrom = {
                    "name"    : vFld.fName,
                    "cpFromZoom" : vFld.cpFromZoom,   
                    "cpFromField" : vFld.cpFromField
                } 
            }
        } 
        
        // Verifica si hay elementos a heredar 
        if ( this.zoomReturnDef.length  == 0 ) { return } 

        // Recorre las propiedades a heredar         
        for (var ix in this.zoomReturnDef ) {
            var cpFrom = this.zoomReturnDef[ix]
            
            if ( cpForm.cpFromZoom == zoomFld.name   ) {
                this.updateFormField(  zoomFld.name , zoomFld[ cpForm.cpFromField ] )
            }
        }

    }, 
*/

    updateFkId: function (  zoomField, fkId ) {
        // Actualiza el IdValue en el zoom para hacer los vinculos  

        zoomField.fkIdValue  = this.activeRecord.get( fkId ) 

    }, 

    updateFormField: function (  fldName, fldValue ) {

        var lRec = {}
        lRec[ fldName ] = fldValue
        this.getForm().setValues( lRec ) 
        
        var lRec = this.activeRecord 
        lRec.data[ fldName ] = fldValue
        if ( ! lRec.modified[ fldName ]  ) {
            lRec.modified[ fldName ] = lRec.data[ fldName ]  
        }         
          
    }, 


    onCreate : function() {
        var form = this.getForm();

        if(form.isValid()) {
            this.fireEvent('create', this, form.getValues());
            form.reset();
        }

    },

    setFormReadOnly: function( bDisable ){
        
        // Fix : Error ExtJs ??? dice q el obj no tiene metodo isXType 
        // this.setDisabled( bDisable )

        // desactiva el boton save 
        this.btSave.setDisabled( true )
                
        this.setReadOnlyFields( bDisable )
    }, 


    /* 
     * @bReadOnly indica q toda la forma es readOnly, podria servir para prender y apagar el readOnly
     * FIX: Una mascara seria mejor  
     */
    setReadOnlyFields: function( bReadOnly , readOnlyFields ){
          
        // var readOnlyCls = 'protofield-readonly'
        var myFields = this.getForm().getFields();
    
        Ext.Array.forEach( myFields.items , function( obj ) {
        
            if ( obj.readOnly ) {
                obj.setReadOnly( true );
                // obj[bReadOnly ? 'addCls' : 'removeCls']( readOnlyCls );
                // if ( obj.xtype != 'htmlfield' ) obj.setDisabled( true  );

            } else if ( ! readOnlyFields  || ( obj.name in _SM.objConv( readOnlyFields )  )  ) {
                // El obj no es readOnly pero la forma si,  
                // FIX: poner una mascara, pero q pasa con el zoom  
                obj.setReadOnly( bReadOnly );
                
            }; 
        
        });

        // Recorre los htmlPanels         
        for (var ix in this.htmlPanels  ) {
            var obj = this.htmlPanels[ix]
            var fDef = obj.__ptConfig 
            
            if ( fDef.readOnly ) {
                obj.setReadOnly( true );
            } else if ( ! readOnlyFields  || ( fDef.name in _SM.objConv( readOnlyFields )  )  ) {
                obj.setReadOnly( bReadOnly );
            }; 

        } 
        
        
      },

    getHtmlPanels: function () {
        // Busca si tiene htmlSets podria agregarse los paneles como campos, 
        // los paneles al interior deberian heredar de  'Ext.form.field.Base' y mezclar Ext.form.Basic 
        // setear propiedad  isFormField : true 
        // implementar por lo menos los metodos : valueToRaw, setRawValue
        
        this.getHtmlPanelDefinition( this.items.items )
    },

    getHtmlPanelDefinition: function ( formItems ) {
        for (var ix in formItems   ) {
            var vFld = formItems[ix]
            
            if ( vFld.xtype ==  "htmlset" ) {
                Ext.apply(  this.htmlPanels, vFld.htmlPanels  )
            } else if ( vFld.xtype ==  "fieldset" ) {
                this.getHtmlPanelDefinition( vFld.items.items )     
            }
        } 
    }
    
});


//TODO:  Agregar tooltip a los campos 

/* 
{
  fieldLabel: 'test label'
  allowBlank: false,
  listeners: {
    render: function(c) {
      Ext.QuickTips.register({
        target: c.getEl(),
        text: 'this is a test message'
      });
    }
  }
} 
  
 */