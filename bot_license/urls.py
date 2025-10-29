from django.urls import path
from .views import CreateLicenseView, CreateProductView, RevokeLicenseView, VerifyLIcenseView, LicenseDetailsView, AllLicensesView, AllProductsView

urlpatterns = [
    path('product/create/', CreateProductView.as_view(), name='create-product'),
    path('license/create/', CreateLicenseView.as_view(), name='create-license'),
    path('license/verify/', VerifyLIcenseView.as_view(), name='verify-license'),
    path('license/revoke/', RevokeLicenseView.as_view(), name='revoke-license'),
    path('license/<str:license_key>/', LicenseDetailsView.as_view(), name='license-details'),
    path('licenses/', AllLicensesView.as_view(), name='all-licenses'),
    path('products/', AllProductsView.as_view(), name='all-products'),
]