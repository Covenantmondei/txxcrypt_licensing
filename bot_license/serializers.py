from rest_framework import serializers
from .models import Product, BotLicense
from django.utils import timezone
from django.utils.dateparse import parse_datetime


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['created_at']


class LicenseSerializer(serializers.ModelSerializer):
    expiry_date = serializers.DateTimeField(
        source='expires_at',
        required=False,
        allow_null=True,
        write_only=True
    )
    
    class Meta:
        model = BotLicense
        fields = ['id', 'license_key', 'product', 'account_id', 'is_active', 
                  'created_at', 'expires_at', 'expiry_date']
        read_only_fields = ['license_key', 'created_at']
    
    def create(self, validated_data):
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