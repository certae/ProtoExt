# -*- coding: utf-8 -*-

# from django.http import HttpResponse
# import json

from protoLib.utilsWeb import JsonError

# from protoLibExt.models import UserFiles
# from protoLibExt.forms import UserFilesForm

def loadSingleFile(request):
    """ return full field tree 
    """

    if not request.user.is_authenticated(): 
        return JsonError('readOnly User')

    if request.method != 'POST':
        return JsonError( 'invalid message' ) 

    for key, fileObj in request.FILES.items():
        path = fileObj.name
        dest = open(path, 'w')
        if fileObj.multiple_chunks:
            for c in fileObj.chunks():
                dest.write(c)
        else:
            dest.write(fileObj.read())
        dest.close()
        a  = key 
    

    # form = DocumentForm( request.POST, request.FILES )
    # if form.is_valid():
    #     newdoc = Document(docfile = request.FILES['docfile'])
    #     newdoc.save()

    #     # Redirect to the document list after POST
    #     return HttpResponseRedirect(reverse('myproject.myapp.views.list'))


    # else:
    #     form = DocumentForm() # A empty, unbound form

    # # Load documents for the list page
    # documents = Document.objects.all()

    # # Render list page with the documents and the form
    # return render_to_response(
    #     'myapp/list.html',
    #     {'documents': documents, 'form': form},
    #     context_instance=RequestContext(request)
    # )


