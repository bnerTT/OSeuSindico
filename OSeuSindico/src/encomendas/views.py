# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Encomendas
from .serializers import EncomendasSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def encomendas_api(request):
    usuario_logado = request.user
    
    if request.method == 'GET':
        if request.user.is_staff:
            encomendas = Encomendas.objects.all()
        else:
            encomendas = Encomendas.objects.filter(morador__user=request.user)
        serializer = EncomendasSerializer(encomendas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        if not request.user.is_staff:
            return Response({
                "Erro":"Apenas portaria pode registrar."
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = EncomendasSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "mensagem": "Encomenda registrada com sucesso!",
                "dados": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def encomenda_detalhe_api(request, pk):
    
    try:
        if request.user.is_staff:
            encomenda = Encomendas.objects.get(pk=pk)
            
        else:
            encomenda = Encomendas.objects.get(pk=pk, morador__user=request.user)
            
    except Encomendas.DoesNotExist:
        return Response(
            {"erro": "Encomenda não encontrada ou você não tem permissão para vê-la."}, 
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = EncomendasSerializer(encomenda)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = EncomendasSerializer(encomenda, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"mensagem": "Atualizado!", "dados": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        encomenda.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)