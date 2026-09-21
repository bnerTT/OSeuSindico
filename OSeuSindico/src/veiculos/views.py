from django.shortcuts import render

from .models import Veiculos
from .serializers import VeiculoSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .serializers import VeiculoSerializer

# Create your views here.
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def veiculos_api(request):
    if request.method == 'GET':
        veiculos = Veiculos.objects.all().order_by('id')
        
        placa_buscada = request.GET.get('placa', None)
        morador_id = request.GET.get('morador')
        apartamento_buscado = request.GET.get('apartamento', None)
        
        if placa_buscada:
            veiculos = veiculos.filter(placa__icontains=placa_buscada)
            
        if morador_id:
            veiculos = veiculos.filter(morador_id=morador_id)
            
        if apartamento_buscado:
            veiculos = veiculos.filter(morador__apartamento__iexact=apartamento_buscado)
            
        paginator = PageNumberPagination()
        paginator.page_size = 5
        
        resultado_paginado = paginator.paginate_queryset(veiculos, request)
        
        serializer = VeiculoSerializer(resultado_paginado, many=True) 
        
        return paginator.get_paginated_response(serializer.data)
        
    elif request.method == 'POST':
        serializer = VeiculoSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "Mensagem":"Veículo cadastrado com sucesso",
                "Dados": serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def veiculos_api_detalhe(request, pk):
    try:
        veiculo = Veiculos.objects.get(pk=pk)
    except Veiculos.DoesNotExist:
        return Response({
            "Erro":"Veículo não encontrado"
        }, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == "GET":
        serializer = VeiculoSerializer(veiculo)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == "PUT":
        serializer = VeiculoSerializer(veiculo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "Mensagem":"Veículo atualizado com sucesso!"
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        veiculo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)