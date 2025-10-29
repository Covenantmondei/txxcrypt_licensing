from rest_framework import serializers
from .models import Product, BotLicense


class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotLicense
        fields = '__all__'
        read_only_fields = ['issued_at', 'expires_at']

        def create(self, validated_data):
            return BotLicense.objects.create(**validated_data)


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['created_at']

        def create(self, validated_data):
            return Product.objects.create(**validated_data)