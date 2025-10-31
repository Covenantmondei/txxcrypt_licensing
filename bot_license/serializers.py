from rest_framework import serializers
from .models import Product, BotLicense
from django.utils import timezone
from .utils import generate_license_key


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['created_at']


class LicenseSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    product = ProductSerializer(read_only=True)
    expiry_date = serializers.DateTimeField(
        source='expires_at',
        required=False,
        allow_null=True,
        write_only=True
    )
    
    class Meta:
        model = BotLicense
        fields = ['id', 'license_key', 'product', 'product_id', 'account_id', 
                  'is_active', 'created_at', 'expires_at', 'expiry_date']
        read_only_fields = ['id', 'license_key', 'created_at', 'is_active']
        extra_kwargs = {
            'expires_at': {'read_only': True}
        }
    
    def create(self, validated_data):
        # Auto-generate license key
        validated_data['license_key'] = generate_license_key()
        
        # Handle expiry_date if provided
        if 'expires_at' in validated_data and validated_data['expires_at']:
            expires_at = validated_data['expires_at']
            # Make sure it's timezone aware
            if timezone.is_naive(expires_at):
                expires_at = timezone.make_aware(expires_at)
            validated_data['expires_at'] = expires_at
        else:
            # Set to None if not provided (no expiration)
            validated_data['expires_at'] = None
        
        return super().create(validated_data)