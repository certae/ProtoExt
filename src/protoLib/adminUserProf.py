import django.contrib.admin

class usrProfileAdmin(django.contrib.admin.ModelAdmin):
    protoExt = {
    "__ptType": "pcl",
    "description": "User Profile",
    "protoConcept": "protoLib.UserProfile",
    "protoIcon": "icon-1",
    "metaVersion": "13.0111",
    "idProperty": "id",
    "protoOption": "protoLib.UserProfile",
    "shortTitle": "User Profile",
    "fields": [{
        "__ptType": "field",
        "vType": "protoN2N",
        "name": "userSites",
        "header": "userSites",
        
        "type": "protoN2N"
    }, {
        "__ptType": "field",
        "fkField": "user",
        "hidden": True,
        "type": "foreignid",
        "name": "user_id",
        "readOnly": True
    }, {
        "__ptType": "field",
        "flex": 1,
        "name": "__str__",
        "fkId": "id",
        "zoomModel": "protoLib.UserProfile",
        "cellLink": True,
        "header": "User Profile",
        "readOnly": True,
        "type": "string"
    }, {
        "__ptType": "field",
        "fkField": "userGroup",
        "hidden": True,
        "type": "foreignid",
        "name": "userGroup_id",
        "readOnly": True
    }, {
        "__ptType": "field",
        "zoomModel": "auth.User",
        "name": "user",
        "fkId": "user_id",
        "required": True,
        "header": "user",
        
        "type": "foreigntext"
    }, {
        "__ptType": "field",
        "header": "ID",
        "readOnly": True,
        "type": "autofield",
        "name": "id",
        
        "hidden": True
    }, {
        "__ptType": "field",
        "zoomModel": "protoLib.OrganisationTree",
        "name": "userGroup",
        "fkId": "userGroup_id",
        "header": "userGroup",
        
        "type": "foreigntext"
    }],
    "actions": [],
    "protoDetails": [{
        "__ptType": "protoDetail",
        "detailField": "userprofile__pk",
        "conceptDetail": "protoLib.UserProfile_userSites",
        "detailName": "userprofile",
        "menuText": "UserProfile_userSites",
        "masterField": "pk"
    }],
    "protoSheets": [],
    "gridConfig": {
        "__ptType": "gridConfig",
        "listDisplay": ["user", "userGroup"],
        "baseFilter": [],
        "initialFilter": [],
        "initialSort": [],
        "searchFields": [],
        "sortFields": [],
        "hiddenFields": ["id"],
        "readOnlyFields": [],
        "others": {
            "__ptType": "others",
            "filtersSet": [],
            "listDisplaySet": [],
            "sortersSet": []
        }
    },
    "protoForm": {
        "__ptType": "protoForm",
        "items": [{
            "__ptType": "fieldset",
            "fsLayout": "2col",
            "items": [{
                "__ptType": "formField",
                "name": "user"
            }]
        }, {
            "__ptType": "fieldset",
            "fsLayout": "2col",
            "items": [{
                "__ptType": "formField",
                "name": "userGroup"
            }]
        }, {
            "__ptType": "fieldset",
            "fsLayout": "1col",
            "items": [{
                "__ptType": "formField",
                "name": "userSites"
            }]
        }]
    },
    "protoUdp": {
        "__ptType": "protoUdp"
    },
    "custom": {
        "__ptType": "custom",
        "filtersSet": [],
        "listDisplaySet": [],
        "sortersSet": []
    },
    "businessRules": {
        "__ptType": "businessRules"
    },
    "updateTime": "2013-01-28 07:56:18"
}