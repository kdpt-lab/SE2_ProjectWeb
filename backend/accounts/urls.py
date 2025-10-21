from django.urls import path
from .views import (
    RegisterUserView,
    RegisterAdminView,
    LoginView,
    ChangePasswordView,
    DeactivateAccountView,
    LoginActivityView,
    BlockUserView,
    
    # Order
    OrderListView,
    
    # Service
    ServiceListView, 
    ServiceDetailView,
    toggle_service_availability,
    
    # 📦 Product
    ProductListView, 
    ProductDetailView,
    toggle_product_availability,
    InventoryView,
    
    # ✅ Staff
    StaffUserListView, 
    StaffUpdateProfileView,
    UserDetailView,
    
    # ✅ Pet Profile
    PetProfileListView,
    PetProfileDetailView,

    # ✅ Feedback
    FeedbackCreateView, # FIX: Ensures the correct view name is imported
    FeedbackGalleryView,
    
    # ✅ Appointment
    AppointmentCreateView, # NEW: For POST requests
    AppointmentListView,   # NEW: For GET requests (booked slots)
)
from . import views


urlpatterns = [
    # --- Authentication & User Management Paths ---
    path("register/user/", RegisterUserView.as_view(), name="register_user"),
    path("register/admin/", RegisterAdminView.as_view(), name="register_admin"),
    path("login/", LoginView.as_view(), name="login"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("deactivate/", DeactivateAccountView.as_view(), name="deactivate_account"),
    path("logs/", LoginActivityView.as_view(), name="login_activity"),
    path("block-user/<str:username>/", BlockUserView.as_view(), name="block_user"),
    
    # --- Service Management Paths ---
    path('services/', ServiceListView.as_view(), name='services'), 
    path('services/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'), 
    path('services/<int:pk>/toggle/', views.toggle_service_availability, name='toggle_service_availability'),

    # --- Order Management Paths ---
    path('orders/', OrderListView.as_view(), name='order-list-create'),

    # --- Product Management Paths ---
    path('products/', ProductListView.as_view(), name='products'), 
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'), 
    path('products/<int:pk>/toggle/', views.toggle_product_availability, name='toggle_product_availability'),
    path('inventory/', InventoryView.as_view(), name='inventory-list'),
    
    # --- Staff Management Paths ---
    path('users/staff/', StaffUserListView.as_view(), name='staff-list'),
    path('users/<int:pk>/update-profile/', StaffUpdateProfileView.as_view(), name='staff-update-profile'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail-delete'), # For DELETE

    # --- Pet Profile Paths ---
    path('pets/', PetProfileListView.as_view(), name='petprofile-list-create'),
    path('pets/<int:pk>/', PetProfileDetailView.as_view(), name='petprofile-detail'),

    # --- Feedback Paths ---
    # Handles POST /api/accounts/feedback/
    path('feedback/', FeedbackCreateView.as_view(), name='feedback-create'), 
    # Handles GET /api/accounts/feedback/gallery/
    path('feedback/gallery/', FeedbackGalleryView.as_view(), name='feedback-gallery'), 
    
    # ===============================================
    # ✅ NEW: APPOINTMENT PATHS
    # ===============================================
    # Handles POST /api/accounts/appointments/ (Booking creation)
    path('appointments/', AppointmentCreateView.as_view(), name='appointment-create'), 
    # Handles GET /api/accounts/appointments/booked/ (Calendar data)
    path('appointments/booked/', AppointmentListView.as_view(), name='appointment-list'), 
]
