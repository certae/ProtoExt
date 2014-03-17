# -*- coding: utf-8 -*-

import traceback

from protoLib.utilsBase import slugify
from protoLib.downloadFile import getFullPath 

from viewDefinition import getViewDefinition, getViewCode, getEntities


def doModelPrototype( modeladmin, request, queryset, parameters):
    """ 
    funcion para crear el prototipo sobre 'protoTable' con la definicion del diccionario
    a partir de Model  
    """

#   El QSet viene con la lista de Ids  
    if queryset.count() == 0:
        return  {'success':False, 'message' : 'No record selected' }
        
#   Mensaje de retorno
    returnMsg = '' 

#   Recorre los registros selccionados   
    for pModel in queryset:
        returnTmp = getEntities( pModel.entity_set.all() , request , None  )
        returnMsg += 'Model : ' + pModel.code + ' Entts: ' + returnTmp + '; '    

    return {'success':True, 'message' : returnMsg } 


def doEntityPrototype( modeladmin, request, queryset, parameters ):

#   El QSet viene con la lista de Ids  
    if queryset.count() != 1:
        return  {'success':False, 'message' : 'No record selected' }

    if len( parameters ) != 1: 
        return  {'success':False, 'message' : 'ViewName required!!' }

#   Recorre los registros selccionados   
    returnTmp = 'Entt: ' + getEntities( queryset , request, parameters[0]['value']  )
    return {'success':True, 'message' :  returnTmp } 


def doPropertyModelJoin( modeladmin, request, queryset, parameters):
    """ 
    funcion para unir dos propertyModel 
    """

    from propModelJoin import doPropModelJoin 

#   El QSet viene con la lista de Ids  
    if queryset.count() < 2:
        return  {'success':False, 'message' : 'Multiple selection required'}

    return doPropModelJoin ( queryset )


# -----------  Models  

def doModelGraph( modeladmin, request, queryset, parameters):
    """ 
    funcion para crear el modelo grafico 
    a partir de Model ( doModel )   
    el proyecto enviara la el QSet de todos los modelos 
    """

    from graphModel import generateDotModels

#   El QSet viene con la lista de Ids  
    if queryset.count() != 1:
        return  {'success':False, 'message' : 'No record selected' }

            
#   Envia el QSet con la lista de modelos, 
    dotdata = generateDotModels ( queryset )

#   Genera el archvivo dot     
    fileName = 'gm_' + slugify( queryset[0].code ) + '.dot'
    fullPath = getFullPath( request, fileName )

    fo = open( fullPath , "wb")
    fo.write( dotdata.encode('utf-8'))
    fo.close()

    try:
        import pygraphviz
        fileNamePdf = fileName.replace( '.dot', '.pdf') 
        fullPathPdf = getFullPath( request, fileNamePdf )

        graph = pygraphviz.AGraph( fullPath )
        graph.layout( prog= 'dot' )
        graph.draw( fullPathPdf, format ='pdf')

        fileName = fileNamePdf
    except ImportError:
        pass

    return  {'success':True , 'message' : fileName,  'fileName' : fileName }



def doExportPrototype( modeladmin, request, queryset, parameters):

    
    from prototype.actions.exportProtoype  import exportPrototypeModel
    

#   El QSet viene con la lista de Ids  
    if queryset.count() != 1:
        return  {'success':False, 'message' : 'No record selected' }

            
#   Envia el QSet con la lista de modelos, 
    strModel = exportPrototypeModel ( request, queryset[0] )
        
#   Genera el archvivo py      
    fileName = 'model_{0}.py'.format( slugify( queryset[0].code ) )
    fullPath = getFullPath( request, fileName )

    fo = open( fullPath , "w")
    fo.write( strModel.encode('utf-8'))
    fo.close()

    return  {'success':True , 'message' : fileName,  'fileName' : fileName }


def doExportProtoJson( modeladmin, request, queryset, parameters):

    
    from prototype.actions.exportViews  import exportProtoJson
    

#   El QSet viene con la lista de Ids  
    if queryset.count() != 1:
        return  {'success':False, 'message' : 'No record selected' }

            
#   Envia el QSet con la lista de modelos, 
    try:
        strModel = exportProtoJson ( request, queryset[0] )
    except Exception :
        traceback.print_exc()
        return  {'success':False, 'message' : 'Load error' }

        
#   Genera el archvivo py      
    fileName = 'proto_{0}.json'.format( slugify( queryset[0].code ) )
    fullPath = getFullPath( request, fileName )

    fo = open( fullPath , "w")
    fo.write( strModel.encode('utf-8'))
    fo.close()

    return  {'success':True , 'message' : fileName,  'fileName' : fileName }


# ----------------   Project  

def doImportSchema( modeladmin, request, queryset, parameters):
    """ 
    funcion para Importar la def de una Db ( basado en inspectDb ) 
    """

    from reverseDb import getDbSchemaDef 

#   El QSet viene con la lista de Ids  
    if queryset.count() != 1:
        return  {'success':False, 'message' : 'No record selected' }

    try: 
        getDbSchemaDef( queryset[0] , request  )
    
#   Recorre los registros selccionados   
    except Exception :
        traceback.print_exc()
        return  {'success':False, 'message' : 'Load error' }
        
    return {'success':True, 'message' :  'runing ...' } 
