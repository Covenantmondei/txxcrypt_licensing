from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from .serializers import LicenseSerializer, ProductSerializer
from .models import BotLicense, Product
from .utils import generate_license_key
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator



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
    

class HealthCheckView(View):
    def get(self, request):
        return JsonResponse({
            'status': 'healthy',
            'service': 'TxxCrypt License Manager',
            'version': '1.0.0'
        })


@method_decorator(csrf_exempt, name='dispatch')
class EAValidate(APIView):

    def post (self, request):
        license_key = request.data.get('license_key') or request.POST.get('license_key')
        account = request.data.get('account_id') or request.POST.get('account_id')

        if not license_key:
            return Response({'valid': 'License key is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            license = BotLicense.objects.get(license_key=license_key)
        except BotLicense.DoesNotExist:
            return Response({'valid': 'Invalid license key.'}, status=status.HTTP_404_NOT_FOUND)
        
        if account and license.account_id != account:
            return Response({'valid': 'Account ID does not match.'}, status=status.HTTP_403_FORBIDDEN)

        if license.expired():
            return Response({'valid': 'License has expired.'}, status=status.HTTP_403_FORBIDDEN)


        return Response({'valid': 'License is valid.'}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class ActivateLicense(APIView):
     
     def post(self, request):
         license_key = request.data.get('license_key')

         try:
             license = BotLicense.objects.get(license_key=license_key)
         except BotLicense.DoesNotExist:
             return Response({'detail': 'Invalid license key.'}, status=status.HTTP_404_NOT_FOUND)

         if not license.is_active:
             license.is_active = True
             license.save()

         return Response({'detail': 'License has been activated.'}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class DeactivateLicense(APIView):
     
     def post(self, request):
         license_key = request.data.get('license_key')

         try:
             license = BotLicense.objects.get(license_key=license_key)
         except BotLicense.DoesNotExist:
             return Response({'detail': 'Invalid license key.'}, status=status.HTTP_404_NOT_FOUND)

         if license.is_active:
             license.is_active = False
             license.save()

         return Response({'detail': 'License has been deactivated.'}, status=status.HTTP_200_OK)