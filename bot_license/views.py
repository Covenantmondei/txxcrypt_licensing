from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import LicenseSerializer, ProductSerializer
from .models import BotLicense, Product
from .utils import generate_license_key



class CreateProductView(APIView):
    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class CreateLicenseView(APIView):
    def post(self, request):
        # Generate a unique license key
        license_key = generate_license_key()
        
        # Add the generated license key to the request data
        data = request.data.copy()
        data['license_key'] = license_key
        
        serializer = LicenseSerializer(data=data)
        if serializer.is_valid():
            license = serializer.save()
            return Response(LicenseSerializer(license).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class VerifyLIcenseView(APIView):
    def post(self, request):
        license_key = request.data.get('license_key')
        hwid = request.data.get('hwid')
        account = request.data.get('account_id')

        try:
            license = BotLicense.objects.get(license_key=license_key)
        except BotLicense.DoesNotExist:
            return Response({'detail': 'Invalid license key.'}, status=status.HTTP_404_NOT_FOUND)

        if license.expired():
            return Response({'detail': 'License has expired.'}, status=status.HTTP_403_FORBIDDEN)


        return Response({'detail': 'License is valid.'}, status=status.HTTP_200_OK)
    

class RevokeLicenseView(APIView):
    def post(self, request):
        license_key = request.data.get('license_key')

        try:
            license = BotLicense.objects.get(license_key=license_key)
        except BotLicense.DoesNotExist:
            return Response({'detail': 'Invalid license key.'}, status=status.HTTP_404_NOT_FOUND)

        license.is_active = False
        license.save()

        return Response({'detail': 'License has been revoked.'}, status=status.HTTP_200_OK)


class LicenseDetailsView(APIView):
    def get(self, request, license_key):
        try:
            license = BotLicense.objects.get(license_key=license_key)
        except BotLicense.DoesNotExist:
            return Response({'detail': 'Invalid license key.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LicenseSerializer(license)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssueLicenseView(APIView):

    def post(self, request):
        serializer = LicenseSerializer(data=request.data)
        if serializer.is_valid():
            license = serializer.save(user=request.user)
            return Response(LicenseSerializer(license).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class AllProductsView(APIView):

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AllLicensesView(APIView):

    def get(self, request):
        licenses = BotLicense.objects.all()
        serializer = LicenseSerializer(licenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardView(APIView):

    def get(self, request):
        total_products = Product.objects.count()
        
        active_licenses = BotLicense.objects.filter(is_active=True).count()
        
        now = timezone.now()
        expired_licenses = BotLicense.objects.filter(
            expires_at__lt=now
        ).count()
        
        recent_products = Product.objects.order_by('-created_at')[:5]
        products_data = ProductSerializer(recent_products, many=True).data
        
        return Response({
            'total_products': total_products,
            'active_licenses': active_licenses,
            'expired_licenses': expired_licenses,
            'recent_products': products_data
        }, status=status.HTTP_200_OK)