from django.shortcuts import render
from .models import Morador
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .serializers import MoradorSerializer

# Create your views here.


@api_view(['GET', 'POST'])
def moradores_api(request):
    if request.method == 'POST':
        serializer = MoradorSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response({
                "mensagem": "Morador criado com sucesso!",
                "dados": serializer.data
            },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'GET':
        moradores = Morador.objects.all()
        serializer = MoradorSerializer(moradores, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE', 'PUT'])
def id_moradores_api(request, pk):
        try:
            morador = Morador.objects.get(pk=pk)
        except Morador.DoesNotExist:
            return Response(
                {"Erro": "Morador não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )


        if request.method == "DELETE":
                morador.user.delete()
                return Response(
                    status=status.HTTP_204_NO_CONTENT
                )
                
                
        if request.method == "PUT":
            serializer = MoradorSerializer(morador, data=request.data)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "Mensagem":"Morador atualizado com sucesso",
                    "dados": serializer.data}, status=status.HTTP_200_OK
                )
                
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
            
        