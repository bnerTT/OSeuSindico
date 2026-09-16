# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Encomendas
from .serializers import EncomendasSerializer

@api_view(['GET', 'POST'])
def encomendas_api(request):
    if request.method == 'GET':
        encomendas = Encomendas.objects.all()
        serializer = EncomendasSerializer(encomendas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = EncomendasSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "mensagem": "Encomenda registrada com sucesso!",
                "dados": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def encomenda_detalhe_api(request, pk):
    try:
        encomenda = Encomendas.objects.get(pk=pk)
    except Encomendas.DoesNotExist:
        return Response({"erro": "Encomenda não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EncomendasSerializer(encomenda)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = EncomendasSerializer(encomenda, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "mensagem": "Encomenda atualizada com sucesso!",
                "dados": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        encomenda.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)